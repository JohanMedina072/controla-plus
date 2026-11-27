const assert = require("node:assert/strict");
const path = require("node:path");

const prismaCli = path.resolve(__dirname, "../node_modules/prisma/build/index.js");

function databaseUrl(variable, database) {
  assert.equal(process.env.NODE_ENV, "test");
  const value = process.env[variable] ?? "";
  assert.ok(URL.canParse(value), "Ejecuta npm test para crear las bases temporales de Controla+.");
  const url = new URL(value);
  const isIsolated = url.protocol === "postgresql:"
    && url.hostname === "127.0.0.1"
    && url.port && url.port !== "5432"
    && url.pathname === `/${database}`
    && /^controla_test_[a-f0-9]{12}$/.test(url.username)
    && /^[a-f0-9]{48}$/.test(url.password)
    && !url.search && !url.hash;

  assert.ok(isIsolated, "Ejecuta npm test para crear las bases temporales de Controla+.");
  return url.href;
}

module.exports = { databaseUrl, prismaCli };
