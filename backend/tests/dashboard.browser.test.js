const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { startTestSite, testPerson, logIn, prisma } = require("./browser-fixture");

const frontendRequire = createRequire(path.resolve(__dirname, "../../frontend/package.json"));
const xlsx = frontendRequire("xlsx");
const incomeDate = "2026-01-16T12:00:00.000Z";
let site;
let owner;

before(async () => {
  site = await startTestSite();
  owner = await testPerson(site.url, "Persona del panel");
  const expense = await prisma.category.findFirstOrThrow({ where: { userId: owner.references.userId, name: "Comida" } });
  const out = { ...owner.references, type: "EXPENSE", categoryId: expense.id };
  await prisma.movement.createMany({ data: [
    { ...owner.references, amount: "1234.56", description: "Ingreso de prueba", date: new Date(incomeDate) },
    { ...out, amount: "19.90", description: "Transporte de prueba", date: new Date("2026-01-12T12:00:00Z") },
    { ...out, amount: "44.00", description: "Gasto de febrero", date: new Date("2026-02-10T12:00:00Z") },
  ] });
});

after(async () => { await site?.close(); });

const movement = (page, label) => page.locator(".movement-item").filter({ hasText: label });

async function openDashboard(t, initScript) {
  const context = await site.browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  if (initScript) await page.addInitScript(initScript);
  await page.goto(site.url);
  await logIn(page, owner);
  await movement(page, "Ingreso de prueba").waitFor();
  return page;
}

test("fechas, importes, filtros, gráficos y Excel conservan los datos del panel", async (t) => {
  const page = await openDashboard(t);
  const income = movement(page, "Ingreso de prueba");
  const dateBadge = income.locator(".movement-date-badge");
  const expected = await page.evaluate((iso) => {
    const date = new Date(iso);
    return {
      full: new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric" }).format(date),
      day: new Intl.DateTimeFormat("es-PE", { day: "2-digit" }).format(date),
      month: new Intl.DateTimeFormat("es-PE", { month: "short" }).format(date).replace(".", ""),
      amount: "+" + new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(1234.56),
    };
  }, incomeDate);
  assert.equal(await dateBadge.getAttribute("aria-label"), expected.full);
  assert.equal(await dateBadge.locator("strong").textContent(), expected.day);
  assert.equal(await dateBadge.locator("span").textContent(), expected.month);
  assert.equal(await income.locator(".movement-actions strong").textContent(), expected.amount);

  await page.locator(".monthly-chart svg.recharts-surface").first().waitFor();
  await page.locator(".expense-chart svg.recharts-surface").first().waitFor();

  const search = page.getByRole("searchbox", { name: "Buscar en tus movimientos" });
  await search.fill("transporte");
  await income.waitFor({ state: "hidden" });
  await movement(page, "Transporte de prueba").waitFor();
  assert.equal(await page.locator(".movement-item").count(), 1);
  await search.clear();
  const month = page.getByLabel("Filtrar dashboard por mes");
  await month.fill("2026-01");
  await movement(page, "Gasto de febrero").waitFor({ state: "hidden" });
  await income.waitFor();
  assert.equal(await page.locator(".movement-item").count(), 2);

  const file = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar a Excel" }).click();
  const download = await file;
  assert.equal(download.suggestedFilename(), "controla-plus-2026-01.xlsx");
  const book = xlsx.readFile(await download.path());
  const rows = xlsx.utils.sheet_to_json(book.Sheets.Movimientos);
  assert.deepEqual(rows.map((row) => [row.Descripción, row.Monto]), [
    ["Ingreso de prueba", 1234.56], ["Transporte de prueba", 19.90],
  ]);
  await page.getByRole("button", { name: "Ver todos los meses" }).click();
  await movement(page, "Gasto de febrero").waitFor();
});

test("el panel permite crear, editar y eliminar un movimiento sintético", async (t) => {
  const page = await openDashboard(t);
  await page.getByRole("button", { name: "Nuevo movimiento", exact: true }).press("Enter");
  const form = page.locator("#movement-form-section form");
  await form.locator('input[name="description"]').fill("Movimiento de regresión");
  await form.locator('input[name="amount"]').fill("22.10");
  await form.locator('select[name="accountId"]').selectOption(owner.references.accountId);
  await form.getByRole("button", { name: "Guardar movimiento" }).click();
  const added = movement(page, "Movimiento de regresión");
  await added.waitFor();
  await added.getByRole("button", { name: "Editar" }).click();
  await form.locator('input[name="description"]').fill("Movimiento editado de regresión");
  await form.locator('input[name="amount"]').fill("25.20");
  await form.getByRole("button", { name: "Actualizar movimiento" }).click();
  const edited = movement(page, "Movimiento editado de regresión");
  await edited.waitFor();
  const saved = await prisma.movement.findFirstOrThrow({ where: {
    description: "Movimiento editado de regresión", userId: owner.references.userId,
  } });
  assert.equal(saved.amount.toString(), "25.2");
  page.once("dialog", (dialog) => dialog.accept());
  await edited.getByRole("button", { name: "Eliminar" }).click();
  await edited.waitFor({ state: "hidden" });
  assert.equal(await prisma.movement.count({ where: { id: saved.id } }), 0);
});

test("una transcripción sintética pasa por revisión y se guarda con la cuenta elegida", async (t) => {
  const page = await openDashboard(t, () => {
    window.SpeechRecognition = class {
      start() { this.onstart(); }
      stop() {
        this.onresult({ results: [[{ transcript: "Gasté 6.40 en comida" }]] });
        this.onend();
      }
      abort() { this.onend(); }
    };
  });
  await page.getByRole("button", { name: "Mantén presionado para registrar por voz" }).focus();
  await page.keyboard.down("Enter");
  await page.getByRole("button", { name: "Suelta para terminar la grabación" }).waitFor();
  await page.keyboard.up("Enter");
  const review = page.getByRole("region", { name: "Confirma el movimiento" });
  await review.waitFor();
  assert.equal(Number(await review.locator('input[name="amount"]').inputValue()), 6.4);
  assert.equal(await review.locator('select[name="type"]').inputValue(), "EXPENSE");
  await review.locator('input[name="description"]').fill("Registro por voz sintético");
  await review.locator('select[name="accountId"]').selectOption(owner.references.accountId);
  await review.locator('select[name="paymentMethodId"]').selectOption(owner.references.paymentMethodId);
  await review.getByRole("button", { name: "Confirmar movimiento" }).click();
  await movement(page, "Registro por voz sintético").waitFor();
  const saved = await prisma.movement.findFirstOrThrow({ where: { description: "Registro por voz sintético" } });
  assert.equal(saved.accountId, owner.references.accountId);
  assert.equal(saved.amount.toString(), "6.4");
});
