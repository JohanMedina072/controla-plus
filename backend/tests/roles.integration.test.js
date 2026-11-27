const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { randomBytes, randomUUID } = require("node:crypto");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { hashPassword } = require("../src/security/passwords");
const { databaseUrl } = require("./test-database");
const { Prisma } = require("@prisma/client");

const url = new URL(databaseUrl("DATABASE_URL", "controla_stage1_clean"));
const prisma = require("../src/config/prisma");
after(() => prisma.$disconnect());

before(() => {
  const psql = process.platform === "win32" ? "psql.exe" : "psql";
  const executable = process.env.PG_BINDIR ? path.resolve(process.env.PG_BINDIR, psql) : psql;
  const execute = (target) => execFileSync(executable, [
    "-X", "-w", "-h", url.hostname, "-p", url.port, "-U", url.username, "-d", "controla_stage1_clean",
    "-v", "target_db=" + target, "-f", path.resolve(__dirname, "../../database/roles.sql"),
  ], { env: { ...process.env, PGPASSWORD: url.password }, stdio: "pipe", timeout: 15_000, windowsHide: true });
  assert.throws(() => execute("destino_incorrecto"), (error) => error.status === 3);
  execute("controla_stage1_clean");
  execute("controla_stage1_clean");
});

const assume = (role, action) => prisma.$transaction(async (db) => {
  await db.$executeRaw`SET LOCAL ROLE ${Prisma.raw(role)}`;
  return action(db);
});
const permissionDenied = (error) => error.meta?.code === "42501";

test("el rol de aplicación ejecuta el DML requerido y carece de DDL y acceso a migraciones", async () => {
  const passwordHash = await hashPassword(randomBytes(18).toString("hex"));
  await assume("controla_app", async (db) => {
    const user = await db.user.create({ data: { name: "Prueba de rol", email: randomUUID() + "@example.test", passwordHash } });
    const category = await db.category.create({ data: { userId: user.id, name: "Comida", type: "EXPENSE" } });
    const method = await db.paymentMethod.create({ data: { userId: user.id, name: "Efectivo" } });
    const account = await db.account.create({ data: { userId: user.id, name: "Cuenta", initialBalance: "100" } });
    const movement = await db.movement.create({ data: { userId: user.id, type: "EXPENSE",
      categoryId: category.id, paymentMethodId: method.id, accountId: account.id, amount: "25" } });
    const changed = await db.movement.update({ where: { id: movement.id }, data: { amount: "30.25" } });
    assert.equal(changed.amount.toString(), "30.25");
    await db.movement.delete({ where: { id: movement.id } });
    await db.account.delete({ where: { id: account.id } });
  });
  await assert.rejects(async () => assume("controla_app", async (db) =>
    db.$executeRaw`CREATE TABLE public.ddl_denegado (id integer)`), permissionDenied);
  await assert.rejects(async () => assume("controla_app", async (db) =>
    db.$queryRaw`SELECT count(*) FROM "_prisma_migrations"`), permissionDenied);
});

test("respaldo y rol académico tienen acceso de lectura según su propósito", async () => {
  const counts = await assume("controla_backup", async (db) => db.$queryRaw`SELECT count(*) FROM "User"`);
  assert.ok(counts[0].count > 0n);
  await assert.rejects(async () => assume("controla_backup", async (db) =>
    db.$executeRaw`DELETE FROM "Movement" WHERE false`), permissionDenied);
  const summary = await assume("controla_academic", async (db) => db.$queryRaw`
    SELECT tipo, movimientos FROM public.controla_academic_counts
  `);
  assert.ok(summary.every(({ tipo, movimientos }) => ["INCOME", "EXPENSE"].includes(tipo) && movimientos > 0n));
  await assert.rejects(async () => assume("controla_academic", async (db) =>
    db.$queryRaw`SELECT "passwordHash" FROM "User" LIMIT 0`), permissionDenied);
});

test("la migración puede ejecutar DDL y la administración conserva un rol separado", async () => {
  await assume("controla_migrator", async (db) => {
    await db.$executeRaw`CREATE TABLE public.ddl_de_prueba (id integer)`;
    await db.$executeRaw`DROP TABLE public.ddl_de_prueba`;
  });
  const [roles] = await prisma.$queryRaw`
    SELECT pg_has_role('controla_admin', 'controla_migrator', 'MEMBER') AS administration,
           pg_has_role('controla_app', 'controla_migrator', 'MEMBER') AS application,
           has_database_privilege('controla_migrator', current_database(), 'CREATE') AS create_schema
  `;
  assert.deepEqual(roles, { administration: true, application: false, create_schema: false });
});
