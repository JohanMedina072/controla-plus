\set ON_ERROR_STOP on

SELECT current_database() ~ '^controla_demo_[a-z0-9_]+$'
   AND NOT EXISTS (SELECT FROM pg_class WHERE relnamespace = 'public'::regnamespace)
   AND NOT EXISTS (SELECT FROM pg_type WHERE typnamespace = 'public'::regnamespace)
   AS allowed \gset
\if :allowed
\else
  \echo 'DDL de demostración: usa una base vacía llamada controla_demo_*'
  SELECT 1/0;
\endif

-- Canonical DDL ordered as in Prisma. Use migrate deploy for application databases.
\ir ../backend/prisma/migrations/20260916153255_init/migration.sql
\ir ../backend/prisma/migrations/20260928150000_add_accounts/migration.sql
\ir ../backend/prisma/migrations/20260928170000_add_payment_reminders/migration.sql
\ir ../backend/prisma/migrations/20260929090000_add_reminder_next_due_date/migration.sql
\ir ../backend/prisma/migrations/20261023181837_harden_database_integrity/migration.sql
\ir ../backend/prisma/migrations/20261127182000_enforce_movement_references/migration.sql

SELECT count(*) AS tablas_del_modelo FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('User', 'Category', 'PaymentMethod', 'Account', 'Movement', 'PaymentReminder');
