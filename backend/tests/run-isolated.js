const { spawnSync } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { prismaCli } = require("./test-database");

const backend = path.resolve(__dirname, "..");
const host = "127.0.0.1";
const integrityMigration = "20261023181837_harden_database_integrity";

function pg(command) {
  const executable = process.platform === "win32" ? `${command}.exe` : command;
  return process.env.PG_BINDIR ? path.resolve(process.env.PG_BINDIR, executable) : executable;
}

function run(executable, args, options) {
  const result = spawnSync(executable, args, {
    cwd: backend,
    encoding: "utf8",
    timeout: 180_000,
    windowsHide: true,
    ...options,
  });

  for (const output of [result.stdout, result.stderr]) {
    if (output) process.stdout.write(output);
  }

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${path.basename(executable)} terminó con código ${result.status ?? result.signal}`);
  }
}

function availablePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, host, () => {
      const { port } = probe.address();
      probe.close((error) => {
        if (error) return reject(error);
        if (port === 5432) return resolve(availablePort());
        resolve(port);
      });
    });
  });
}

function copyBaseline(target) {
  const source = path.join(backend, "prisma");
  const migrations = path.join(source, "migrations");
  const destination = path.join(target, "migrations");
  fs.mkdirSync(destination, { recursive: true });
  fs.copyFileSync(path.join(source, "schema.prisma"), path.join(target, "schema.prisma"));
  fs.copyFileSync(path.join(migrations, "migration_lock.toml"), path.join(destination, "migration_lock.toml"));

  for (const entry of fs.readdirSync(migrations, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name < integrityMigration) {
      fs.cpSync(path.join(migrations, entry.name), path.join(destination, entry.name), { recursive: true });
    }
  }
}

async function main() {
  run(pg("initdb"), ["--version"]);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "controla-plus-test-"));
  const data = path.join(root, "postgres");
  const passwordFile = path.join(root, "init-password");
  const postgresLog = path.join(root, "postgres.log");
  const username = `controla_test_${randomBytes(6).toString("hex")}`;
  const password = randomBytes(24).toString("hex");
  let startAttempted = false;

  try {
    fs.writeFileSync(passwordFile, `${password}\n`, { mode: 0o600, flag: "wx" });
    try {
      run(pg("initdb"), [
        "-D", data, "--username", username, "--pwfile", passwordFile,
        "--auth-host=scram-sha-256", "--auth-local=scram-sha-256", "--encoding=UTF8", "--locale=C",
      ]);
    } finally {
      fs.rmSync(passwordFile, { force: true });
    }

    const port = await availablePort();
    fs.appendFileSync(path.join(data, "postgresql.conf"), [
      "",
      `listen_addresses = '${host}'`,
      `port = ${port}`,
      "unix_socket_directories = ''",
      "timezone = 'UTC'",
      "",
    ].join("\n"));

    startAttempted = true;
    // On Windows the background server can keep pg_ctl's output pipes open.
    run(pg("pg_ctl"), ["-D", data, "-l", postgresLog, "-w", "-t", "30", "start"], {
      stdio: "ignore",
    });
    console.log("PostgreSQL temporal listo en loopback.");

    run(pg("psql"), [
      "-X", "-w", "-h", host, "-p", String(port), "-U", username, "-d", "postgres",
      "-v", "ON_ERROR_STOP=1", "-c", "CREATE DATABASE controla_stage1_clean",
      "-c", "CREATE DATABASE controla_stage1_upgrade",
    ], { env: { ...process.env, PGPASSWORD: password } });

    const clean = `postgresql://${username}:${password}@${host}:${port}/controla_stage1_clean`;
    const upgrade = new URL(clean);
    upgrade.pathname = "/controla_stage1_upgrade";
    const emptyDotenv = path.join(root, "empty.env");
    fs.writeFileSync(emptyDotenv, "");
    const env = {
      ...process.env,
      NODE_ENV: "test",
      DOTENV_CONFIG_PATH: emptyDotenv,
      DATABASE_URL: clean,
      CONTROLA_TEST_UPGRADE_URL: upgrade.href,
      JWT_SECRET: randomBytes(32).toString("hex"),
      JWT_EXPIRES_IN: "1h",
    };

    run(process.execPath, [prismaCli, "generate"], { env });
    run(process.execPath, [prismaCli, "migrate", "deploy"], { env });

    const baseline = path.join(root, "baseline");
    copyBaseline(baseline);
    run(process.execPath, [prismaCli, "migrate", "deploy", "--schema", "schema.prisma"], {
      cwd: baseline,
      env: { ...env, DATABASE_URL: upgrade.href },
    });

    run(process.execPath, [
      "--test", "--test-concurrency=1", "--test-reporter=spec",
      "tests/api.integration.test.js", "tests/upgrade.integration.test.js",
    ], { env });
  } catch (error) {
    if (fs.existsSync(postgresLog)) console.error(fs.readFileSync(postgresLog, "utf8"));
    throw error;
  } finally {
    if (startAttempted) {
      const status = spawnSync(pg("pg_ctl"), ["-D", data, "status"], {
        windowsHide: true,
        stdio: "ignore",
        timeout: 30_000,
      });
      if (status.status !== 3) {
        run(pg("pg_ctl"), ["-D", data, "-m", "fast", "-w", "-t", "30", "stop"]);
      }
    }
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 6, retryDelay: 150 });
    console.log("Directorio temporal de pruebas eliminado.");
  }
}

main().catch((error) => {
  if (error.code === "ENOENT") {
    console.error("No se encontró un ejecutable. Instala PostgreSQL y agrega su carpeta bin a PATH o indica PG_BINDIR.");
  }
  console.error(error.message);
  process.exitCode = 1;
});
