const assert = require("node:assert/strict");
const { randomBytes, randomUUID } = require("node:crypto");
const { after, before, test } = require("node:test");
const bcrypt = require("bcryptjs");
const { databaseUrl } = require("./test-database");

databaseUrl("DATABASE_URL", "controla_stage1_clean");
const app = require("../src/server");
const prisma = require("../src/config/prisma");

let server;
let baseUrl;
let alice;
let bob;

async function api(method, route, { token, payload, status = 200 } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (payload !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json();
  assert.equal(response.status, status, `${method} ${route} devolvió un estado inesperado`);
  assert.equal(result.ok, status < 400);
  return result.data;
}

async function createPerson(name) {
  const email = `${name.toLowerCase()}-${randomUUID()}@example.test`;
  const password = randomBytes(24).toString("base64url");
  const session = await api("POST", "/auth/register", {
    payload: { email, name, password }, status: 201,
  });
  const { token, user } = session;
  const catalog = await api("GET", "/catalog", { token });
  const account = await api("POST", "/accounts", {
    token, payload: { name: "Cuenta de pruebas", initialBalance: "100.00" }, status: 201,
  });
  return {
    email,
    password,
    token,
    user,
    catalog,
    account,
    expense: catalog.categories.find(({ type }) => type === "EXPENSE"),
    income: catalog.categories.find(({ type }) => type === "INCOME"),
    method: catalog.paymentMethods[0],
  };
}

function movementPayload(person) {
  return {
    type: "EXPENSE",
    amount: "25.20",
    description: "Movimiento de la suite",
    date: "2026-05-10T12:00:00.000Z",
    categoryId: person.expense.id,
    paymentMethodId: person.method.id,
    accountId: person.account.id,
  };
}

before(async () => {
  const [database] = await prisma.$queryRaw`SELECT current_database() AS name`;
  assert.equal(database.name, "controla_stage1_clean");

  await new Promise((resolve, reject) => {
    server = app.listen(0, "127.0.0.1", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  alice = await createPerson("Alicia");
  bob = await createPerson("Bruno");
});

after(async () => {
  try {
    if (server?.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  } finally {
    await prisma.$disconnect();
  }
});

test("la API y la conexión responden y las rutas privadas exigen sesión", async () => {
  await api("GET", "/health");
  await api("GET", "/db-test");
  for (const route of ["/auth/me", "/catalog", "/accounts", "/movements", "/reminders"]) {
    await api("GET", route, { status: 401 });
  }
});

test("registro, inicio de sesión y perfil devuelven solo el usuario público", async () => {
  await api("POST", "/auth/login", {
    payload: { email: alice.email, password: randomBytes(24).toString("base64url") }, status: 401,
  });
  const session = await api("POST", "/auth/login", {
    payload: { email: alice.email.toUpperCase(), password: alice.password },
  });
  assert.equal(session.user.id, alice.user.id);
  assert.deepEqual(Object.keys(session.user).sort(), ["email", "id", "name"]);
  const user = await api("GET", "/auth/me", { token: session.token });
  assert.deepEqual(Object.keys(user).sort(), ["email", "id", "name"]);
  assert.equal(user.id, alice.user.id);
});

test("un inicio de sesión correcto convierte una contraseña heredada sintética en bcrypt", async () => {
  const password = randomBytes(24).toString("base64url");
  const legacy = await prisma.user.create({
    data: { name: "Usuario heredado", email: `${randomUUID()}@example.test`, passwordHash: password },
  });
  await api("POST", "/auth/login", {
    payload: { email: legacy.email, password: randomBytes(24).toString("base64url") }, status: 401,
  });
  const afterFailure = await prisma.user.findUniqueOrThrow({ where: { id: legacy.id } });
  assert.ok(afterFailure.passwordHash === password, "Un intento inválido no debe modificar el valor");

  await api("POST", "/auth/login", { payload: { email: legacy.email, password } });
  const afterLogin = await prisma.user.findUniqueOrThrow({ where: { id: legacy.id } });
  assert.ok(afterLogin.passwordHash !== password, "La contraseña de prueba debe quedar hasheada");
  assert.ok(await bcrypt.compare(password, afterLogin.passwordHash));
});

test("el CRUD de movimientos actualiza el saldo y protege cuentas con historial", async () => {
  const { token } = alice;
  const payload = movementPayload(alice);
  const created = await api("POST", "/movements", { token, payload, status: 201 });
  const route = `/movements/${created.id}`;
  assert.equal(created.accountId, alice.account.id);
  let accounts = await api("GET", "/accounts", { token });
  assert.equal(accounts.find(({ id }) => id === alice.account.id).currentBalance, "74.80");
  await api("DELETE", `/accounts/${alice.account.id}`, { token, status: 409 });

  const edited = await api("PUT", route, { token, payload: { ...payload, amount: "30.00" } });
  assert.equal(Number(edited.amount), 30);
  accounts = await api("GET", "/accounts", { token });
  assert.equal(accounts.find(({ id }) => id === alice.account.id).currentBalance, "70.00");
  const movements = await api("GET", "/movements", { token });
  assert.ok(movements.some(({ id }) => id === created.id));
  await api("DELETE", route, { token });
  const remaining = await api("GET", "/movements", { token });
  assert.ok(!remaining.some(({ id }) => id === created.id));
  accounts = await api("GET", "/accounts", { token });
  assert.equal(accounts.find(({ id }) => id === alice.account.id).currentBalance, "100.00");
});

test("el propietario puede eliminar una cuenta sin movimientos", async () => {
  const { token } = alice;
  const account = await api("POST", "/accounts", {
    token, payload: { name: "Cuenta vacía", initialBalance: "0.00" }, status: 201,
  });
  await api("DELETE", `/accounts/${account.id}`, { token });
  const accounts = await api("GET", "/accounts", { token });
  assert.ok(!accounts.some(({ id }) => id === account.id));
});

test("dos usuarios conservan movimientos, catálogos y cuentas separados en la API", async () => {
  const foreignMovement = await api("POST", "/movements", {
    token: bob.token, payload: movementPayload(bob), status: 201,
  });
  const { token } = alice;
  const catalog = await api("GET", "/catalog", { token });
  const accounts = await api("GET", "/accounts", { token });
  const movements = await api("GET", "/movements", { token });
  assert.ok(catalog.categories.length > 0 && catalog.categories.every(({ userId }) => userId === alice.user.id));
  assert.ok(catalog.paymentMethods.length > 0 && catalog.paymentMethods.every(({ userId }) => userId === alice.user.id));
  assert.ok(accounts.some(({ id }) => id === alice.account.id));
  assert.ok(!accounts.some(({ id }) => id === bob.account.id));
  assert.ok(!movements.some(({ id }) => id === foreignMovement.id));
  await api("PUT", `/movements/${foreignMovement.id}`, {
    token, payload: movementPayload(alice), status: 404,
  });
  await api("DELETE", `/movements/${foreignMovement.id}`, { token, status: 404 });
  await api("DELETE", `/accounts/${bob.account.id}`, { token, status: 404 });

  const ownerMovements = await api("GET", "/movements", { token: bob.token });
  const owned = ownerMovements.find(({ id }) => id === foreignMovement.id);
  assert.equal(owned?.accountId, bob.account.id);
  assert.equal(Number(owned?.amount), 25.20);
});

test("la API exige cuenta propia activa y rechaza referencias incompatibles en altas y ediciones", async () => {
  const { token } = alice;
  const payload = movementPayload(alice);
  const inactive = await prisma.account.create({
    data: { name: "Cuenta inactiva de pruebas", userId: alice.user.id, initialBalance: "0", isActive: false },
  });
  const movement = await api("POST", "/movements", { token, payload, status: 201 });
  const incompatible = [
    { accountId: null },
    { accountId: inactive.id },
    { accountId: bob.account.id },
    { categoryId: bob.expense.id },
    { categoryId: alice.income.id },
    { paymentMethodId: bob.method.id },
  ];
  for (const reference of incompatible) {
    const rejected = { token, payload: { ...payload, ...reference }, status: 400 };
    await api("POST", "/movements", rejected);
    await api("PUT", `/movements/${movement.id}`, rejected);
  }
  const saved = await prisma.movement.findUniqueOrThrow({ where: { id: movement.id } });
  assert.equal(saved.accountId, alice.account.id);
  assert.equal(saved.categoryId, alice.expense.id);
  assert.equal(saved.paymentMethodId, alice.method.id);
});

test("recordatorios de pago conservan su propietario y funcionan al cierre de mes", async () => {
  const payload = { type: "CREDIT", name: "Crédito BCP", nextDueDate: "2026-01-31", amount: "80.00" };
  const { token } = bob;
  const reminder = await api("POST", "/reminders", { token, payload, status: 201 });
  const route = `/reminders/${reminder.id}`;
  const visibleToAlice = await api("GET", "/reminders", { token: alice.token });
  assert.ok(!visibleToAlice.some(({ id }) => id === reminder.id));
  await api("PUT", route, { token: alice.token, payload, status: 404 });
  await api("PATCH", `${route}/complete`, { token: alice.token, status: 404 });
  await api("DELETE", route, { token: alice.token, status: 404 });

  const completed = await api("PATCH", `${route}/complete`, { token });
  assert.equal(completed.nextDueDate, "2026-02-28");
  assert.equal(completed.dueDay, 31);
  const edited = await api("PUT", route, { token, payload: { ...payload, nextDueDate: "2026-03-15" } });
  assert.equal(edited.nextDueDate, "2026-03-15");
  assert.equal(edited.dueDay, 15);
  await api("DELETE", route, { token });
  const remaining = await api("GET", "/reminders", { token });
  assert.ok(!remaining.some(({ id }) => id === reminder.id));
});

test("PostgreSQL aplica CHECK, unicidad y claves foráneas del esquema actual", async () => {
  const insertMovement = (amount, accountId) => prisma.$executeRaw`
    INSERT INTO "Movement" ("id", "type", "amount", "userId", "categoryId", "paymentMethodId", "accountId")
    VALUES (${randomUUID()}::uuid, 'EXPENSE', ${amount}::numeric, ${alice.user.id}::uuid,
      ${alice.expense.id}::uuid, ${alice.method.id}::uuid, ${accountId}::uuid)
  `;
  const insertReminder = (day, amount) => prisma.$executeRaw`
    INSERT INTO "PaymentReminder" ("id", "type", "name", "dueDay", "nextDueDate", "amount", "userId")
    VALUES (${randomUUID()}::uuid, 'CREDIT', 'Crédito BCP', ${day}::integer, DATE '2026-01-31',
      ${amount}::numeric, ${alice.user.id}::uuid)
  `;
  const checks = [
    ["23514", "monto de movimiento positivo", () => insertMovement("0", alice.account.id)],
    ["23514", "saldo inicial no negativo", () => prisma.$executeRaw`
      UPDATE "Account" SET "initialBalance" = -1 WHERE "id" = ${alice.account.id}::uuid`],
    ["23514", "tipo de categoría válido", () => prisma.$executeRaw`
      UPDATE "Category" SET "type" = 'INVALID' WHERE "id" = ${alice.expense.id}::uuid`],
    ["23514", "día de recordatorio válido", () => insertReminder(32, "10")],
    ["23514", "monto de recordatorio positivo", () => insertReminder(31, "-5")],
    ["23505", "nombre de método único por usuario", () => prisma.$executeRaw`
      INSERT INTO "PaymentMethod" ("id", "name", "userId")
      VALUES (${randomUUID()}::uuid, ${alice.method.name}, ${alice.user.id}::uuid)`],
    ["23503", "referencia a una cuenta existente", () => insertMovement("25", randomUUID())],
  ];
  for (const [code, label, statement] of checks) {
    await assert.rejects(async () => statement(), (error) => error.meta?.code === code, label);
  }
});
