const bcrypt = require("bcryptjs");
const { randomBytes } = require("node:crypto");
const prisma = require("../config/prisma");
const AppError = require("../errors/app.error");
const { isBcryptHash, hashPassword } = require("../security/passwords");
const { signSession } = require("../security/session");

const DEFAULT_CATEGORIES = [
  { name: "Comida", type: "EXPENSE" },
  { name: "Transporte", type: "EXPENSE" },
  { name: "Salud", type: "EXPENSE" },
  { name: "Estudios", type: "EXPENSE" },
  { name: "Mudanzas", type: "INCOME" },
  { name: "taxi", type: "INCOME" },
  { name: "Marketplace", type: "INCOME" },
  { name: "Otros", type: "EXPENSE" },
];

const DEFAULT_PAYMENT_METHODS = [
  "Efectivo",
  "Yape",
  "Tarjeta BCP",
  "Tarjeta IO",
];

const normalizeEmail = (email) => email.trim().toLowerCase();

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const createSession = (user) => ({
  token: signSession(user),
  user: toPublicUser(user),
});

const ensureDefaultCatalog = async (database, userId) => {
  await database.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      userId,
    })),
    skipDuplicates: true,
  });

  await database.paymentMethod.createMany({
    data: DEFAULT_PAYMENT_METHODS.map((name) => ({ name, userId })),
    skipDuplicates: true,
  });
};

const dummyPasswordHash = hashPassword(randomBytes(32).toString("base64url"));

const register = async ({ name, email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError(
      "Ya existe una cuenta con ese correo",
      409,
      "EMAIL_ALREADY_REGISTERED",
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    await ensureDefaultCatalog(transaction, createdUser.id);

    return createdUser;
  });

  return createSession(user);
};

const login = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  const hasHash = user && isBcryptHash(user.passwordHash);
  const passwordMatches = await bcrypt.compare(
    password, hasHash ? user.passwordHash : await dummyPasswordHash,
  );
  if (!hasHash || !passwordMatches) {
    throw new AppError(
      "El correo o la contraseña son incorrectos",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  await ensureDefaultCatalog(prisma, user.id);

  return createSession(user);
};

const updateProfile = async (
  userId,
  { name, email, currentPassword, newPassword },
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("La sesión ya no es válida", 401, "INVALID_SESSION");
  }

  const passwordMatches = isBcryptHash(user.passwordHash)
    && await bcrypt.compare(currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(
      "La contraseña actual es incorrecta",
      400,
      "INVALID_CURRENT_PASSWORD",
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const nameChanged = name.trim() !== user.name;
  const emailChanged = normalizedEmail !== user.email;
  const passwordChanged = Boolean(newPassword);

  if (!nameChanged && !emailChanged && !passwordChanged) {
    throw new AppError(
      "No hay cambios para guardar",
      400,
      "NO_PROFILE_CHANGES",
    );
  }

  if (emailChanged) {
    const emailOwner = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: userId },
      },
      select: { id: true },
    });

    if (emailOwner) {
      throw new AppError(
        "Ya existe una cuenta con ese correo",
        409,
        "EMAIL_ALREADY_REGISTERED",
      );
    }
  }

  const data = {
    name: name.trim(),
    email: normalizedEmail,
  };

  if (passwordChanged) {
    if (newPassword === currentPassword) {
      throw new AppError(
        "La nueva contraseña debe ser diferente a la actual",
        400,
        "PASSWORD_UNCHANGED",
      );
    }

    data.passwordHash = await hashPassword(newPassword);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId, passwordHash: user.passwordHash },
    data,
  });

  return toPublicUser(updatedUser);
};

const getPublicUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("La sesión ya no es válida", 401, "INVALID_SESSION");
  }

  return toPublicUser(user);
};

module.exports = {
  register,
  login,
  updateProfile,
  getPublicUser,
  ensureDefaultCatalog,
};
