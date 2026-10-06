const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const AppError = require("../errors/app.error");
const { getJwtExpiresIn, getJwtSecret } = require("../config/app");

const PASSWORD_SALT_ROUNDS = 12;

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

const createToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
    },
    getJwtSecret(),
    {
      expiresIn: getJwtExpiresIn(),
    },
  );

const createSession = (user) => ({
  token: createToken(user),
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

  for (const name of DEFAULT_PAYMENT_METHODS) {
    const existingMethod = await database.paymentMethod.findFirst({
      where: {
        name,
        userId,
      },
    });

    if (!existingMethod) {
      await database.paymentMethod.create({
        data: {
          name,
          userId,
        },
      });
    }
  }
};

const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);

const comparePassword = async (password, passwordHash) =>
  isBcryptHash(passwordHash)
    ? bcrypt.compare(password, passwordHash)
    : password === passwordHash;

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

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

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

  if (!user) {
    throw new AppError(
      "El correo o la contraseña son incorrectos",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(
      "El correo o la contraseña son incorrectos",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  if (!isBcryptHash(user.passwordHash)) {
    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    user.passwordHash = passwordHash;
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

  const passwordMatches = await comparePassword(
    currentPassword,
    user.passwordHash,
  );

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

    data.passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
  } else if (!isBcryptHash(user.passwordHash)) {
    data.passwordHash = await bcrypt.hash(
      currentPassword,
      PASSWORD_SALT_ROUNDS,
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
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
};
