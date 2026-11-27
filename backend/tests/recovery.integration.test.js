const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { randomBytes, randomUUID } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { performance } = require("node:perf_hooks");
const { after, test } = require("node:test");
const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("../src/security/passwords");
const { databaseUrl } = require("./test-database");

const sourceUrl = new URL(databaseUrl("DATABASE_URL", "controla_stage1_clean"));
const restoreUrl = databaseUrl("CONTROLA_TEST_RESTORE_URL", "controla_restore_stage4");
const source = require("../src/config/prisma");
const restored = new PrismaClient({ datasourceUrl: restoreUrl });
const sourceDb = "controla_stage1_clean";
const targetDb = "controla_restore_stage4";
const dbScripts = path.resolve(__dirname, "../../database");
const postgresEnv = {
  ...process.env, PGHOST: sourceUrl.hostname, PGPORT: sourceUrl.port,
  PGUSER: sourceUrl.username, PGPASSWORD: sourceUrl.password, PGOPTIONS: "",
  CONTROLA_BACKUP_KEY: randomBytes(32).toString("hex"),
};

after(async () => {
  await source.$disconnect();
  await restored.$disconnect();
});

function command(executable, args, overrides = {}) {
  const result = spawnSync(executable, args, {
    env: { ...postgresEnv, ...overrides }, encoding: "utf8", timeout: 25_000, windowsHide: true,
  });
  if (result.error) throw result.error;
  return result;
}

function psql(db, file, ...params) {
  const executable = process.platform === "win32" ? "psql.exe" : "psql";
  return command(process.env.PG_BINDIR ? path.resolve(process.env.PG_BINDIR, executable) : executable, [
    "-X", "-w", "-d", db, "-v", "target_db=" + db, ...params, "-f", path.join(dbScripts, file),
  ]);
}

function archive(action, db, file, overrides) {
  return command(process.execPath, [path.join(dbScripts, "scripts/archive.cjs"), action, db, file], overrides);
}

function checkCommand(result) {
  assert.equal(result.status, 0, result.stderr);
}

async function publicTableCount(database) {
  const [row] = await database.$queryRaw`
    SELECT count(*)::int AS total FROM pg_tables WHERE schemaname = 'public'
  `;
  return row.total;
}

test("mantenimiento verifica el destino y ejecuta VACUUM ANALYZE en la base aislada", () => {
  const rejected = psql(sourceDb, "maintenance.sql", "-v", "target_db=otra_base");
  assert.equal(rejected.status, 3);
  const report = psql(sourceDb, "maintenance.sql");
  checkCommand(report);
  assert.match(report.stdout, /filas_muertas_estimadas/);
  const vacuum = psql(sourceDb, "maintenance.sql", "-v", "run_vacuum=true");
  checkCommand(vacuum);
  assert.match(vacuum.stdout, /VACUUM/);
});

test("respaldo cifrado se restaura sin pérdida de filas, importes, claves ni historial", async () => {
  checkCommand(psql(sourceDb, "roles.sql"));
  const user = await source.user.create({ data: { name: "Caso de recuperación", email: randomUUID() + "@example.test",
    passwordHash: await hashPassword(randomBytes(18).toString("hex")) } });
  const category = await source.category.create({ data: { userId: user.id, name: "Ingresos", type: "INCOME" } });
  const method = await source.paymentMethod.create({ data: { userId: user.id, name: "Efectivo" } });
  const account = await source.account.create({ data: { userId: user.id, name: "Cuenta", initialBalance: "400" } });
  const row = { userId: user.id, categoryId: category.id, paymentMethodId: method.id, type: "INCOME" };
  await source.movement.createMany({ data: [
    { ...row, accountId: account.id, amount: "55.50" }, { ...row, accountId: null, amount: "14.25" },
  ] });
  await source.paymentReminder.create({ data: {
    userId: user.id, name: "Crédito BCP", type: "CREDIT", dueDay: 20, nextDueDate: new Date("2027-02-20"), amount: "80",
  } });

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "controla-recovery-test-"));
  const file = path.join(directory, "sintetico.controla-backup");
  try {
    const backupStart = performance.now();
    checkCommand(archive("backup", sourceDb, file, { PGOPTIONS: "-c role=controla_backup" }));
    const backupMs = performance.now() - backupStart;
    const bytes = (await fs.stat(file)).size;
    assert.ok(bytes > 32);
    const original = await fs.readFile(file);
    const duplicate = archive("backup", sourceDb, file, { PGOPTIONS: "-c role=controla_backup" });
    assert.equal(duplicate.status, 1);
    assert.match(duplicate.stderr, /ya existe/);
    assert.ok(original.equals(await fs.readFile(file)));

    assert.equal(await publicTableCount(restored), 0);
    const wrongKey = archive("restore", targetDb, file, { CONTROLA_BACKUP_KEY: randomBytes(32).toString("hex") });
    assert.equal(wrongKey.status, 1);
    assert.equal(await publicTableCount(restored), 0);

    const restoreStart = performance.now();
    checkCommand(archive("restore", targetDb, file));
    const restoreMs = performance.now() - restoreStart;
    const summary = (prisma) => prisma.$queryRaw`
      SELECT (SELECT count(*)::int FROM "User") AS users,
             (SELECT count(*)::int FROM "Account") AS accounts,
             (SELECT count(*)::int FROM "Category") AS categories,
             (SELECT count(*)::int FROM "PaymentMethod") AS methods,
             (SELECT count(*)::int FROM "Movement") AS movements,
             (SELECT count(*)::int FROM "Movement" WHERE "accountId" IS NULL) AS unassigned,
             (SELECT sum(amount)::text FROM "Movement") AS amount,
             (SELECT count(*)::int FROM "PaymentReminder") AS reminders,
             (SELECT count(*)::int FROM "_prisma_migrations") AS migrations
    `;
    assert.deepEqual(await summary(restored), await summary(source));
    const [balance] = await restored.$queryRaw`
      SELECT (a."initialBalance" + coalesce(sum(m.amount), 0))::text AS amount
      FROM "Account" a LEFT JOIN "Movement" m ON m."accountId" = a.id
      WHERE a.id = ${account.id}::uuid GROUP BY a.id
    `;
    assert.equal(balance.amount, "455.50");
    assert.equal(await restored.movement.count({ where: { userId: user.id, accountId: null } }), 1);
    const [constraints] = await restored.$queryRaw`
      SELECT count(*)::int AS total FROM pg_constraint WHERE conname IN (
        'Movement_category_owner_type_fkey', 'Movement_account_owner_fkey', 'Movement_payment_method_owner_fkey'
      )
    `;
    assert.equal(constraints.total, 3);

    checkCommand(psql(targetDb, "roles.sql"));
    const [grants] = await restored.$queryRaw`
      SELECT has_table_privilege('controla_app', 'public."Movement"', 'SELECT') AS movement,
             has_table_privilege('controla_app', 'public."_prisma_migrations"', 'SELECT') AS migration
    `;
    assert.deepEqual(grants, { movement: true, migration: false });
    const blocked = archive("restore", targetDb, file);
    assert.equal(blocked.status, 1);
    assert.match(blocked.stderr, /debe estar vacía/);
    console.log("RECUPERACION " + JSON.stringify({ bytes, backupMs: Math.round(backupMs), restoreMs: Math.round(restoreMs) }));
  } finally {
    await fs.rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
