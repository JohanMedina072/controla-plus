const assert = require("node:assert/strict");
const { randomBytes, randomUUID } = require("node:crypto");
const express = require("express");
const { chromium } = require("playwright");
const { databaseUrl } = require("./test-database");

databaseUrl("DATABASE_URL", "controla_stage1_clean");
const api = require("../src/server");
const prisma = require("../src/config/prisma");

async function startTestSite() {
  assert.ok(process.env.CONTROLA_TEST_FRONTEND, "Ejecuta npm test -- --browser.");
  const app = express();
  app.use(express.static(process.env.CONTROLA_TEST_FRONTEND));
  app.use(api);
  const server = await new Promise((resolve, reject) => {
    const site = app.listen(0, "127.0.0.1", () => resolve(site));
    site.once("error", reject);
  });
  const url = "http://127.0.0.1:" + server.address().port;
  async function stop() {
    try {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    } finally {
      await prisma.$disconnect();
    }
  }
  try {
    const browser = await chromium.launch({ channel: process.env.CONTROLA_BROWSER_CHANNEL });
    return { url, browser, close: async () => {
      try { await browser.close(); } finally { await stop(); }
    } };
  } catch (error) {
    await stop();
    throw error;
  }
}

async function testPerson(url, name) {
  const email = randomUUID() + "@example.test";
  const password = randomBytes(24).toString("base64url");
  const response = await fetch(url + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  assert.equal(response.status, 201);
  const { data } = await response.json();
  const userId = data.user.id;
  const category = await prisma.category.findFirstOrThrow({ where: { userId, type: "INCOME" } });
  const method = await prisma.paymentMethod.findFirstOrThrow({ where: { userId } });
  const account = await prisma.account.create({ data: { userId, name, initialBalance: "0" } });
  return { name, email, password, token: data.token,
    references: { userId, type: "INCOME", categoryId: category.id, paymentMethodId: method.id, accountId: account.id } };
}

async function logIn(page, person) {
  await page.locator('input[name="email"]').fill(person.email);
  await page.locator('input[name="password"]').fill(person.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("button", { name: "Cerrar sesión" }).waitFor();
}

module.exports = { startTestSite, testPerson, logIn, prisma };
