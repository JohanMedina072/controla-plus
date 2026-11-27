\set ON_ERROR_STOP on

SELECT current_database() ~ '^controla_demo_[a-z0-9_]+$' AS allowed \gset
\if :allowed
\else
  \echo 'DML de demostración: usa una base desechable llamada controla_demo_*'
  SELECT 1/0;
\endif

BEGIN;

SELECT gen_random_uuid() AS demo_user, gen_random_uuid() AS demo_account,
       gen_random_uuid() AS demo_income, gen_random_uuid() AS demo_expense,
       gen_random_uuid() AS demo_method, gen_random_uuid() AS movement_in,
       gen_random_uuid() AS movement_out, gen_random_uuid() AS demo_reminder
\gset

-- The synthetic SQL-only user cannot sign in. No application password is stored.
INSERT INTO "User" (id, name, email, "passwordHash")
VALUES (:'demo_user', 'Persona de SQL', :'demo_user' || '@example.test', 'cuenta_sintetica_sin_acceso');
INSERT INTO "Account" (id, name, "initialBalance", "userId")
VALUES (:'demo_account', 'Cuenta de SQL', 100.00, :'demo_user');
INSERT INTO "Category" (id, name, "type", "userId") VALUES
  (:'demo_income', 'Ingresos de SQL', 'INCOME', :'demo_user'),
  (:'demo_expense', 'Gastos de SQL', 'EXPENSE', :'demo_user');
INSERT INTO "PaymentMethod" (id, name, "userId")
VALUES (:'demo_method', 'Efectivo', :'demo_user');
INSERT INTO "Movement" (id, "type", amount, description, "userId", "categoryId", "paymentMethodId", "accountId") VALUES
  (:'movement_in', 'INCOME', 200.00, 'Ingreso sintético', :'demo_user', :'demo_income', :'demo_method', :'demo_account'),
  (:'movement_out', 'EXPENSE', 40.00, 'Gasto sintético', :'demo_user', :'demo_expense', :'demo_method', :'demo_account');
INSERT INTO "PaymentReminder" (id, "type", name, "dueDay", "nextDueDate", amount, "userId")
VALUES (:'demo_reminder', 'CREDIT', 'Crédito BCP', 15, DATE '2027-01-15', 80.00, :'demo_user');

SELECT c.name AS categoria, m."type", count(*) AS movimientos, sum(m.amount) AS total
FROM "Movement" m JOIN "Category" c ON (c.id, c."userId", c."type") = (m."categoryId", m."userId", m."type")
WHERE m."userId" = :'demo_user'
GROUP BY c.name, m."type"
ORDER BY m."type";

UPDATE "Movement" SET amount = 50.00
WHERE id = :'movement_out' AND "userId" = :'demo_user';

SELECT a."initialBalance"
       + coalesce(sum(CASE WHEN m."type" = 'INCOME' THEN m.amount ELSE -m.amount END), 0)
       AS saldo_tras_actualizar
FROM "Account" a LEFT JOIN "Movement" m ON (m."accountId", m."userId") = (a.id, a."userId")
WHERE a.id = :'demo_account' AND a."userId" = :'demo_user'
GROUP BY a.id;

DELETE FROM "Movement" WHERE id = :'movement_out' AND "userId" = :'demo_user';
SELECT count(*) AS movimientos_tras_borrar FROM "Movement" WHERE "userId" = :'demo_user';

ROLLBACK;

SELECT count(*) AS usuarios_de_demo_persistidos FROM "User" WHERE id = :'demo_user';
