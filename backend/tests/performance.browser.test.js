const assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");
const { after, before, test } = require("node:test");
const { startTestSite, testPerson, prisma } = require("./browser-fixture");

const movementCount = 1000;
const maxMs = 3000;
let site;
let owner;

before(async () => {
  site = await startTestSite();
  owner = await testPerson(site.url, "Propietaria de rendimiento");
  const other = await testPerson(site.url, "Persona de control de rendimiento");
  const { userId } = owner.references;
  const expense = await prisma.category.findFirstOrThrow({ where: { userId, type: "EXPENSE" } });
  const secondary = await prisma.account.create({ data: {
    userId, name: "Cuenta secundaria de rendimiento", initialBalance: "500",
  } });

  await prisma.movement.createMany({ data: Array.from({ length: movementCount }, (_, index) => ({
    ...owner.references,
    ...(index % 3 === 0 ? {} : { type: "EXPENSE", categoryId: expense.id }),
    accountId: index % 2 === 0 ? owner.references.accountId : secondary.id,
    amount: String(10 + index % 90) + ".35",
    date: new Date(Date.UTC(2026, index % 12, 1 + index % 27, 12)),
    description: "Movimiento de rendimiento " + index,
  })) });
  await prisma.movement.createMany({ data: Array.from({ length: 25 }, (_, index) => ({
    ...other.references, amount: "7.50", description: "Otro propietario " + index,
  })) });
  assert.equal(await prisma.movement.count({ where: { userId } }), movementCount);
});

after(async () => {
  await site?.close();
});

function report(name, durations) {
  const order = durations.slice().sort((a, b) => a - b);
  const max = order.at(-1);
  const decimals = (value) => Number(value.toFixed(2));
  console.log("RENDIMIENTO " + JSON.stringify({
    name,
    samplesMs: durations.map(decimals),
    firstMs: decimals(durations[0]),
    p95Ms: decimals(order[Math.ceil(order.length * 0.95) - 1]),
    maxMs: decimals(max),
  }));
  assert.ok(max <= maxMs, name + " superó " + maxMs + " ms");
}

test("la API de movimientos y cuentas responde dentro de 3 s con 1000 movimientos propios", async () => {
  for (const [endpoint, expected] of [["movements", movementCount], ["accounts", 2]]) {
    const durations = [];
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const start = performance.now();
      const response = await fetch(site.url + "/api/" + endpoint, {
        headers: { Authorization: "Bearer " + owner.token },
        signal: AbortSignal.timeout(5000),
      });
      const body = await response.json();
      durations.push(performance.now() - start);
      assert.equal(response.status, 200);
      assert.equal(body.data.length, expected);
      assert.ok(body.data.every(({ userId }) => userId === owner.references.userId));
    }
    report("API " + endpoint, durations);
  }

  const [row] = await prisma.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT id, date, amount FROM "Movement"
    WHERE "userId" = ${owner.references.userId}::uuid ORDER BY date DESC
  `;
  const plan = row["QUERY PLAN"][0];
  console.log("PLAN_SQL " + JSON.stringify({
    node: plan.Plan["Node Type"],
    rows: plan.Plan["Actual Rows"],
    planningMs: plan["Planning Time"],
    executionMs: plan["Execution Time"],
  }));
});

test("el navegador pinta los 1000 movimientos propios dentro de 3 s tras confirmar el acceso", async () => {
  const context = await site.browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(site.url, { waitUntil: "load" });
    const durations = [];
    for (let attempt = 0; attempt < 7; attempt += 1) {
      await page.locator('input[name="email"]').fill(owner.email);
      await page.locator('input[name="password"]').fill(owner.password);
      const start = performance.now();
      await page.getByRole("button", { name: "Entrar" }).click();
      await page.waitForFunction((count) => document.querySelectorAll(".movement-item").length === count, movementCount);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      durations.push(performance.now() - start);
      assert.equal(await page.getByText("Otro propietario 0", { exact: true }).count(), 0);
      await page.getByRole("button", { name: "Cerrar sesión" }).press("Enter");
    }
    report("Panel Chromium " + site.browser.version(), durations);
  } finally {
    await context.close();
  }
});
