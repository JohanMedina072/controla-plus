-- One atomic PostgreSQL statement, including the preflight and the DDL.
DO $migration$
DECLARE
    invalid_movements bigint;
    invalid_amounts bigint;
    invalid_category_types bigint;
BEGIN
    PERFORM set_config('lock_timeout', '5s', true);
    LOCK TABLE "Account", "Category", "Movement", "PaymentMethod", "PaymentReminder"
        IN SHARE ROW EXCLUSIVE MODE;

    SELECT count(*) INTO invalid_movements
    FROM "Movement" m
    LEFT JOIN "Category" c ON c.id = m."categoryId"
    LEFT JOIN "PaymentMethod" p ON p.id = m."paymentMethodId"
    LEFT JOIN "Account" a ON a.id = m."accountId"
    WHERE c."userId" IS DISTINCT FROM m."userId"
       OR c."type" IS DISTINCT FROM m."type"::text
       OR p."userId" IS DISTINCT FROM m."userId"
       OR (m."accountId" IS NOT NULL AND a."userId" IS DISTINCT FROM m."userId");

    SELECT (SELECT count(*) FROM "Movement" WHERE amount = 'NaN'::numeric)
         + (SELECT count(*) FROM "Account" WHERE "initialBalance" = 'NaN'::numeric)
         + (SELECT count(*) FROM "PaymentReminder" WHERE amount = 'NaN'::numeric)
    INTO invalid_amounts;

    SELECT count(*) INTO invalid_category_types
    FROM "Category" WHERE "type" NOT IN ('INCOME', 'EXPENSE');

    IF invalid_movements + invalid_amounts + invalid_category_types > 0 THEN
        RAISE EXCEPTION 'Controla+ detuvo la migración: referencias incompatibles %, importes NaN %, tipos de categoría inválidos %',
            invalid_movements, invalid_amounts, invalid_category_types;
    END IF;
    ALTER TABLE "Category" DROP CONSTRAINT "Category_type_valid_check";
    ALTER TABLE "Category" ALTER COLUMN "type" TYPE "MovementType" USING "type"::"MovementType";

    CREATE UNIQUE INDEX "Account_id_userId_key" ON "Account" ("id", "userId");
    CREATE UNIQUE INDEX "Category_id_userId_type_key" ON "Category" ("id", "userId", "type");
    CREATE UNIQUE INDEX "PaymentMethod_id_userId_key" ON "PaymentMethod" ("id", "userId");

    ALTER TABLE "Movement"
    DROP CONSTRAINT "Movement_categoryId_fkey",
    DROP CONSTRAINT "Movement_paymentMethodId_fkey",
    DROP CONSTRAINT "Movement_accountId_fkey",
    ADD CONSTRAINT "Movement_category_owner_type_fkey" FOREIGN KEY ("categoryId", "userId", "type")
        REFERENCES "Category" ("id", "userId", "type") ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT "Movement_payment_method_owner_fkey" FOREIGN KEY ("paymentMethodId", "userId")
        REFERENCES "PaymentMethod" ("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT "Movement_account_owner_fkey" FOREIGN KEY ("accountId", "userId")
        REFERENCES "Account" ("id", "userId") MATCH SIMPLE ON DELETE NO ACTION ON UPDATE NO ACTION;

    ALTER TABLE "Movement" ADD CONSTRAINT "Movement_amount_finite_check" CHECK (amount <> 'NaN'::numeric);
    ALTER TABLE "Account" ADD CONSTRAINT "Account_initialBalance_finite_check" CHECK ("initialBalance" <> 'NaN'::numeric);
    ALTER TABLE "PaymentReminder" ADD CONSTRAINT "PaymentReminder_amount_finite_check" CHECK (amount <> 'NaN'::numeric);
END
$migration$;
