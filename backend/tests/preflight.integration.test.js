const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { randomBytes, randomUUID } = require("node:crypto");
const { after, test } = require("node:test");
const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("../src/security/passwords");
const { databaseUrl, prismaCli } = require("./test-database");

const url = databaseUrl("CONTROLA_TEST_PREFLIGHT_URL", "controla_stage1_preflight");
const prisma = new PrismaClient({ datasourceUrl: url });
after(() => prisma.$disconnect());

test("la migración se detiene ante referencias incompatibles y conserva el esquema y las filas", async () => {
  const passwordHash = await hashPassword(randomBytes(18).toString("hex"));
  const user = () => prisma.user.create({ data: {
    name: "Persona del preflight", email: randomUUID() + "@example.test", passwordHash,
  } });
  const first = await user();
  const second = await user();
  const categoryId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "Category" (id, name, "type", "userId")
    VALUES (${categoryId}::uuid, 'Categoría anterior', 'EXPENSE', ${second.id}::uuid)
  `;
  const method = await prisma.paymentMethod.create({ data: { userId: first.id, name: "Efectivo" } });
  const movementId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "Movement" (id, "type", amount, "userId", "categoryId", "paymentMethodId")
    VALUES (${movementId}::uuid, 'EXPENSE', 25.40, ${first.id}::uuid, ${categoryId}::uuid, ${method.id}::uuid)
  `;

  const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url }, encoding: "utf8", timeout: 25_000, windowsHide: true,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Controla\+ detuvo la migración/);
  const [movement] = await prisma.$queryRaw`
    SELECT "categoryId", "accountId", amount::text FROM "Movement" WHERE id = ${movementId}::uuid
  `;
  assert.deepEqual(movement, { categoryId, accountId: null, amount: "25.40" });
  const [catalog] = await prisma.$queryRaw`
    SELECT data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Category' AND column_name = 'type'
  `;
  assert.equal(catalog.data_type, "text");
  const [constraint] = await prisma.$queryRaw`
    SELECT count(*)::int AS total FROM pg_constraint WHERE conname = 'Movement_category_owner_type_fkey'
  `;
  assert.equal(constraint.total, 0);
});
