const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");
const { databaseUrl } = require("./test-database");

const url = new URL(databaseUrl("CONTROLA_TEST_DEMO_URL", "controla_demo_etapa5"));

function psql(database, ...args) {
  const tool = process.platform === "win32" ? "psql.exe" : "psql";
  const executable = process.env.PG_BINDIR ? path.resolve(process.env.PG_BINDIR, tool) : tool;
  const result = spawnSync(executable, [
    "-X", "-w", "-h", url.hostname, "-p", url.port, "-U", url.username, "-d", database,
    "-v", "ON_ERROR_STOP=1", ...args,
  ], { env: { ...process.env, PGPASSWORD: url.password }, encoding: "utf8", timeout: 15_000, windowsHide: true });
  if (result.error) throw result.error;
  return result;
}

test("el DDL crea seis tablas y el DML demuestra operaciones sin persistir fixtures", () => {
  const base = "controla_demo_etapa5";
  const ddlFile = path.resolve(__dirname, "../../database/ddl-demo.sql");
  const dmlFile = path.resolve(__dirname, "../../database/dml-demo.sql");
  assert.equal(psql("controla_stage1_clean", "-f", dmlFile).status, 3);
  const ddl = psql(base, "-f", ddlFile);
  assert.equal(ddl.status, 0, ddl.stderr);
  assert.match(ddl.stdout, /tablas_del_modelo[\s\S]*\n\s*6\s*\n/);
  assert.equal(psql(base, "-f", ddlFile).status, 3);
  const dml = psql(base, "-f", dmlFile);
  assert.equal(dml.status, 0, dml.stderr);
  assert.match(dml.stdout, /saldo_tras_actualizar[\s\S]*\n\s*250\.00\s*\n/);
  assert.match(dml.stdout, /movimientos_tras_borrar[\s\S]*\n\s*1\s*\n/);
  assert.match(dml.stdout, /usuarios_de_demo_persistidos[\s\S]*\n\s*0\s*\n/);
  const counts = psql(base, "-A", "-t", "-c", 'SELECT (SELECT count(*) FROM "User"), (SELECT count(*) FROM "Movement");');
  assert.equal(counts.status, 0, counts.stderr);
  assert.equal(counts.stdout.trim(), "0|0");
});
