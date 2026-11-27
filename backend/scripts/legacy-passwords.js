const { hashPassword, isBcryptHash, validBcryptLength } = require("../src/security/passwords");

async function migrateLegacyPasswords(prisma, { apply = false } = {}) {
  const users = await prisma.user.findMany({ select: { id: true, passwordHash: true } });
  const legacy = users.filter(({ passwordHash }) => !isBcryptHash(passwordHash));
  const convertible = legacy.filter(({ passwordHash }) =>
    passwordHash && !passwordHash.startsWith("$2") && validBcryptLength(passwordHash));
  const result = { legacy: legacy.length, convertible: convertible.length,
    needsReview: legacy.length - convertible.length, migrated: 0, changedDuringRun: 0 };

  if (!apply || result.needsReview > 0) return result;

  for (const { id, passwordHash } of convertible) {
    const update = await prisma.user.updateMany({
      where: { id, passwordHash },
      data: { passwordHash: await hashPassword(passwordHash) },
    });
    result.migrated += update.count;
    result.changedDuringRun += 1 - update.count;
  }
  return result;
}

async function main() {
  require("dotenv").config({ quiet: true });
  const [mode, database, extra] = process.argv.slice(2);
  if (!["--scan", "--apply"].includes(mode) || !database || extra !== undefined) {
    throw new Error("Indica --scan o --apply seguido del nombre exacto de la base autorizada.");
  }
  const prisma = require("../src/config/prisma");
  try {
    const [target] = await prisma.$queryRaw`SELECT current_database() AS name`;
    if (target.name !== database) throw new Error("La base conectada no coincide con la indicada.");
    const result = await migrateLegacyPasswords(prisma, { apply: mode === "--apply" });
    console.log(JSON.stringify(result));
    if (result.needsReview || result.changedDuringRun) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.code ? "Falló la revisión de contraseñas heredadas." : error.message);
    process.exitCode = 1;
  });
}

module.exports = { migrateLegacyPasswords };
