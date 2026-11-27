const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { startTestSite, testPerson, logIn, prisma } = require("./browser-fixture");

let site;
let first;
let second;

before(async () => {
  site = await startTestSite();
  first = await testPerson(site.url, "Cuenta sintética Alicia");
  second = await testPerson(site.url, "Cuenta sintética Bruno");
  await prisma.movement.createMany({ data: [
    { ...first.references, amount: "987.65", description: "Movimiento sintético de Alicia" },
    { ...second.references, amount: "123.45", description: "Movimiento sintético de Bruno" },
  ] });
});

after(async () => {
  await site?.close();
});

test("el cambio de cuenta limpia el panel antes de recibir los datos de la nueva sesión", async () => {
  const context = await site.browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(site.url);
    await logIn(page, first);
    await page.getByText("Movimiento sintético de Alicia", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Cerrar sesión" }).press("Enter");
    const intercepted = Promise.withResolvers();
    const release = Promise.withResolvers();
    await page.route("**/api/movements", async (route) => {
      intercepted.resolve();
      await release.promise;
      await route.continue();
    }, { times: 1 });
    try {
      await logIn(page, second);
      await intercepted.promise;
      assert.equal(await page.getByText("Movimiento sintético de Alicia", { exact: true }).count(), 0);
      assert.doesNotMatch(await page.locator(".dashboard-summary-column").innerText(), /987[.,]65/);
    } finally {
      release.resolve();
    }
    await page.getByText("Movimiento sintético de Bruno", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem("controla_auth") === null), true);
  } finally {
    await context.close();
  }
});

test("un 401 demorado de una sesión cerrada conserva la nueva sesión activa", async () => {
  const context = await site.browser.newContext();
  const release = Promise.withResolvers();
  try {
    const page = await context.newPage();
    await page.goto(site.url);
    const intercepted = Promise.withResolvers();
    await page.route("**/api/catalog", async (route) => {
      intercepted.resolve();
      await release.promise;
      await route.fulfill({ status: 401, json: { ok: false, message: "Sesión terminada" } });
    }, { times: 1 });
    await logIn(page, first);
    await intercepted.promise;
    await page.getByRole("button", { name: "Cerrar sesión" }).press("Enter");
    await logIn(page, second);
    await page.getByText("Movimiento sintético de Bruno", { exact: true }).waitFor();
    const rejected = page.waitForResponse((response) => response.url().endsWith("/api/catalog") && response.status() === 401);
    release.resolve();
    await (await rejected).finished();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assert.equal(await page.getByText("Movimiento sintético de Bruno", { exact: true }).isVisible(), true);
  } finally {
    release.resolve();
    await context.close();
  }
});
