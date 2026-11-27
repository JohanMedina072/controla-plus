const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { randomBytes, randomUUID } = require("node:crypto");
const path = require("node:path");
const { after, test } = require("node:test");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { databaseUrl, prismaCli } = require("./test-database");

const upgradeUrl = databaseUrl("CONTROLA_TEST_UPGRADE_URL", "controla_stage1_upgrade");
const prisma = new PrismaClient({ datasourceUrl: upgradeUrl });
const integrityMigration = "20261023181837_harden_database_integrity";

after(() => prisma.$disconnect());

function appliedMigrations() {
  return prisma.$queryRaw`
    SELECT migration_name FROM "_prisma_migrations"
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
    ORDER BY migration_name
  `;
}

test("actualizar desde las cuatro migraciones previas conserva los movimientos históricos", async () => {
  const [database] = await prisma.$queryRaw`SELECT current_database() AS name`;
  assert.equal(database.name, "controla_stage1_upgrade");

  const before = await appliedMigrations();
  assert.equal(before.length, 4);
  assert.ok(!before.some(({ migration_name }) => migration_name === integrityMigration));

  const user = await prisma.user.create({
    data: {
      name: "Persona de la migración",
      email: `${randomUUID()}@example.test`,
      passwordHash: await bcrypt.hash(randomBytes(24).toString("base64url"), 12),
    },
  });
  const account = await prisma.account.create({
    data: { userId: user.id, name: "Cuenta histórica", initialBalance: "500.00" },
  });
  const category = await prisma.category.create({
    data: { userId: user.id, name: "Comida", type: "EXPENSE" },
  });
  const method = await prisma.paymentMethod.create({
    data: { userId: user.id, name: "Efectivo" },
  });
  const data = {
    userId: user.id,
    type: "EXPENSE",
    amount: "40.25",
    description: "Importe histórico de prueba",
    date: new Date("2026-05-10T12:00:00.000Z"),
    categoryId: category.id,
    paymentMethodId: method.id,
  };
  const unassigned = await prisma.movement.create({ data });
  const assigned = await prisma.movement.create({ data: { ...data, accountId: account.id } });
  const reminder = await prisma.paymentReminder.create({
    data: {
      userId: user.id, type: "CREDIT", name: "Crédito BCP", dueDay: 31,
      nextDueDate: new Date("2026-01-31T00:00:00.000Z"), amount: "80.00",
    },
  });

  const migrationOutput = execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: upgradeUrl },
    encoding: "utf8",
    timeout: 60_000,
    windowsHide: true,
  });
  process.stdout.write(migrationOutput);

  const after = await appliedMigrations();
  assert.deepEqual(after.slice(0, before.length), before);
  assert.ok(after.some(({ migration_name }) => migration_name === integrityMigration));
  for (const expected of [unassigned, assigned]) {
    const actual = await prisma.movement.findUniqueOrThrow({ where: { id: expected.id } });
    assert.deepEqual(actual, expected);
  }
  assert.equal(unassigned.accountId, null);
  const savedReminder = await prisma.paymentReminder.findUniqueOrThrow({ where: { id: reminder.id } });
  assert.deepEqual(savedReminder, reminder);

  const indexes = await prisma.$queryRaw`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
  `;
  const indexNames = indexes.map(({ indexname }) => indexname);
  for (const name of ["Movement_userId_date_idx", "Movement_accountId_date_idx", "PaymentReminder_userId_nextDueDate_idx"]) {
    assert.ok(indexNames.includes(name), `Debe existir el índice ${name}`);
  }
  await assert.rejects(
    async () => prisma.$executeRaw`UPDATE "Movement" SET "amount" = 0 WHERE "id" = ${unassigned.id}::uuid`,
    (error) => error.meta?.code === "23514",
  );
});
