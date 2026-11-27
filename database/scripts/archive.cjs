const { execFile, spawn } = require("node:child_process");
const { createCipheriv, createDecipheriv, randomBytes } = require("node:crypto");
const fs = require("node:fs");
const files = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const { promisify } = require("node:util");

const exec = promisify(execFile);
const magic = Buffer.from("CPG1");
const ivLength = 12;
const tagLength = 16;
const algorithm = "aes-256-gcm";

function pg(name) {
  const executable = process.platform === "win32" ? name + ".exe" : name;
  return process.env.PG_BINDIR ? path.resolve(process.env.PG_BINDIR, executable) : executable;
}

async function externalArchive(value) {
  const dir = await files.realpath(path.dirname(path.resolve(value)));
  const repo = await files.realpath(path.resolve(__dirname, "../.."));
  const relative = path.relative(repo, dir);
  const outside = relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative);
  if (!outside || !value.endsWith(".controla-backup")) {
    throw new Error("Elige un archivo .controla-backup fuera del repositorio.");
  }
  return path.join(dir, path.basename(value));
}

function start(name, args, stdout) {
  const child = spawn(pg(name), args, { stdio: ["ignore", stdout, "inherit"], windowsHide: true });
  const finished = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(name + " no terminó correctamente."));
    });
  });
  return { child, finished };
}

async function backup(database, archive, key) {
  const staging = await files.mkdtemp(path.join(path.dirname(archive), ".controla-"));
  try {
    const encrypted = path.join(staging, "archive");
    const iv = randomBytes(ivLength);
    const header = Buffer.concat([magic, iv]);
    await files.writeFile(encrypted, header, { flag: "wx", mode: 0o600 });
    const cipher = createCipheriv(algorithm, key, iv);
    cipher.setAAD(header);
    const { child, finished } = start("pg_dump", [
      "--format=custom", "--no-owner", "--no-acl", "--no-password", "--dbname", database,
    ], "pipe");
    try {
      await Promise.all([
        pipeline(child.stdout, cipher, fs.createWriteStream(encrypted, { flags: "a" })),
        finished,
      ]);
    } catch (error) {
      child.kill();
      await finished.catch(() => {});
      throw error;
    }
    await files.appendFile(encrypted, cipher.getAuthTag());
    // A hard link publishes the finished file without replacing an existing backup.
    await files.link(encrypted, archive);
  } finally {
    await files.rm(staging, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

async function decrypt(archive, destination, key) {
  const file = await files.open(archive, "r");
  try {
    const size = (await file.stat()).size;
    const header = Buffer.alloc(magic.length + ivLength);
    if (size <= header.length + tagLength) throw new Error("Formato de respaldo inválido.");
    await file.read(header, 0, header.length, 0);
    if (!header.subarray(0, magic.length).equals(magic)) throw new Error("Formato de respaldo inválido.");

    const tag = Buffer.alloc(tagLength);
    await file.read(tag, 0, tag.length, size - tagLength);
    const cipher = createDecipheriv(algorithm, key, header.subarray(magic.length));
    cipher.setAAD(header);
    cipher.setAuthTag(tag);
    await pipeline(
      file.createReadStream({ start: header.length, end: size - tagLength - 1, autoClose: false }),
      cipher,
      fs.createWriteStream(destination, { flags: "wx", mode: 0o600 }),
    );
  } finally {
    await file.close();
  }
}

async function restorativeTarget(database) {
  const { stdout } = await exec(pg("psql"), [
    "-X", "-w", "-A", "-t", "-d", database, "-v", "ON_ERROR_STOP=1", "-c",
    "SELECT NOT EXISTS (SELECT FROM pg_namespace WHERE nspname !~ '^pg_' AND nspname NOT IN ('public', 'information_schema'))"
    + " AND NOT EXISTS (SELECT FROM pg_class WHERE relnamespace = 'public'::regnamespace)"
    + " AND NOT EXISTS (SELECT FROM pg_proc WHERE pronamespace = 'public'::regnamespace)"
    + " AND NOT EXISTS (SELECT FROM pg_type WHERE typnamespace = 'public'::regnamespace)"
    + " AND NOT EXISTS (SELECT FROM pg_extension WHERE extname <> 'plpgsql');",
  ], { windowsHide: true, timeout: 20_000 });
  if (stdout.trim() !== "t") throw new Error("La base de restauración debe estar vacía.");
}

async function restore(database, archive, key) {
  if (!/^controla_restore_[a-z0-9_]+$/.test(database)) {
    throw new Error("Usa una base nueva cuyo nombre empiece por controla_restore_.");
  }
  const staging = await files.mkdtemp(path.join(os.tmpdir(), "controla-restore-"));
  try {
    const clear = path.join(staging, "archive");
    await decrypt(archive, clear, key);
    await restorativeTarget(database);
    const { finished } = start("pg_restore", [
      "--single-transaction", "--exit-on-error", "--no-owner", "--no-privileges",
      "--no-password", "--dbname", database, clear,
    ], "inherit");
    await finished;
  } finally {
    await files.rm(staging, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

async function main() {
  const [action, database, requestedArchive, extra] = process.argv.slice(2);
  if (!["backup", "restore"].includes(action) || !/^[a-z0-9_][a-z0-9_-]*$/i.test(database ?? "")
    || !requestedArchive || extra !== undefined || !process.env.PGHOST || !process.env.PGUSER) {
    throw new Error("Uso: node database/scripts/archive.cjs backup|restore NOMBRE_BASE ARCHIVO. Define PGHOST y PGUSER.");
  }
  const encoded = process.env.CONTROLA_BACKUP_KEY ?? "";
  if (!/^[a-f0-9]{64}$/i.test(encoded)) {
    throw new Error("Configura CONTROLA_BACKUP_KEY con 32 bytes aleatorios en hexadecimal.");
  }
  const key = Buffer.from(encoded, "hex");
  const archive = await externalArchive(requestedArchive);
  if (action === "backup") await backup(database, archive, key);
  else await restore(database, archive, key);
  console.log(action === "backup" ? "Respaldo cifrado creado." : "Restauración completada.");
}

main().catch((error) => {
  console.error(error.code === "EEXIST" ? "El archivo de respaldo ya existe." : error.message);
  process.exitCode = 1;
});
