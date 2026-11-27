require("dotenv").config({ quiet: true });
const bcrypt = require("bcryptjs");
const { hashPassword, isBcryptHash, validBcryptLength } = require("../src/security/passwords");
const { ensureDefaultCatalog } = require("../src/services/auth.service");

const name = "Demostración Controla+";

async function main() {
  const email = process.env.DEMO_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_PASSWORD;
  if (!["development", "test"].includes(process.env.NODE_ENV) || process.env.DEMO_SEED !== "1"
    || !/^[^\s@]+@example\.test$/.test(email ?? "")
    || !password || password.length < 16 || !validBcryptLength(password)) {
    throw new Error("Habilita el seed en development o test, con DEMO_EMAIL en example.test y DEMO_PASSWORD válido.");
  }
  const prisma = require("../src/config/prisma");
  try {
    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.upsert({
        where: { email },
        create: { name, email, passwordHash },
        update: {},
      });
      if (user.name !== name || !isBcryptHash(user.passwordHash)
        || !await bcrypt.compare(password, user.passwordHash)) {
        throw new Error("El correo ya está ocupado. Configura un correo sintético distinto.");
      }
      await ensureDefaultCatalog(transaction, user.id);
      await transaction.account.upsert({
        where: { name_userId: { name: "Cuenta de demostración", userId: user.id } },
        create: { name: "Cuenta de demostración", userId: user.id, initialBalance: "200.00" },
        update: {},
      });
    });
    console.log("Datos sintéticos de demostración preparados.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.code ? "No se pudo preparar la demostración." : error.message);
  process.exitCode = 1;
});
