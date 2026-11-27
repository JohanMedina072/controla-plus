\set ON_ERROR_STOP on
\if :{?target_db}
\else
  \echo 'Indica -v target_db=NOMBRE_EXACTO'
  SELECT 1/0;
\endif

BEGIN;
SELECT pg_catalog.set_config('controla.role_target', :'target_db', true);

DO $setup$
DECLARE
    group_name text;
    existing pg_catalog.pg_roles%ROWTYPE;
BEGIN
    IF current_database() <> current_setting('controla.role_target') THEN
        RAISE EXCEPTION 'La base conectada no es el destino indicado';
    END IF;
    FOREACH group_name IN ARRAY ARRAY[
        'controla_admin', 'controla_migrator', 'controla_app', 'controla_backup', 'controla_academic'
    ] LOOP
        SELECT * INTO existing FROM pg_catalog.pg_roles WHERE rolname = group_name;
        IF NOT FOUND THEN
            EXECUTE format('CREATE ROLE %I NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS', group_name);
        ELSIF existing.rolcanlogin OR existing.rolsuper OR existing.rolcreatedb OR existing.rolcreaterole
            OR existing.rolreplication OR existing.rolbypassrls THEN
            RAISE EXCEPTION 'El grupo % ya existe con atributos incompatibles', group_name;
        END IF;
    END LOOP;
END
$setup$;

DO $membership$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_auth_members m
        JOIN pg_catalog.pg_roles child ON child.oid = m.member
        JOIN pg_catalog.pg_roles parent ON parent.oid = m.roleid
        WHERE child.rolname IN ('controla_admin', 'controla_migrator', 'controla_app', 'controla_backup', 'controla_academic')
          AND NOT (child.rolname = 'controla_admin' AND parent.rolname = 'controla_migrator')
    ) THEN
        RAISE EXCEPTION 'Un grupo Controla+ hereda permisos no previstos';
    END IF;
END
$membership$;

GRANT controla_migrator TO controla_admin;
REVOKE CONNECT, TEMPORARY, CREATE ON DATABASE :"target_db" FROM PUBLIC;
GRANT CONNECT, CREATE, TEMPORARY ON DATABASE :"target_db" TO controla_admin;
GRANT CONNECT ON DATABASE :"target_db" TO controla_migrator, controla_app, controla_backup, controla_academic;

ALTER SCHEMA public OWNER TO controla_migrator;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO controla_app, controla_backup, controla_academic;

DO $access$
DECLARE
    table_name text;
    type_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'User','Account','Category','PaymentMethod','Movement','PaymentReminder','_prisma_migrations'
    ] LOOP
        IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I OWNER TO controla_migrator', table_name);
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, controla_app, controla_backup, controla_academic', table_name);
            EXECUTE format('GRANT SELECT ON TABLE public.%I TO controla_backup', table_name);
        END IF;
    END LOOP;

    FOREACH type_name IN ARRAY ARRAY['MovementType', 'ReminderType'] LOOP
        IF to_regtype(format('public.%I', type_name)) IS NOT NULL THEN
            EXECUTE format('ALTER TYPE public.%I OWNER TO controla_migrator', type_name);
            EXECUTE format('REVOKE ALL ON TYPE public.%I FROM PUBLIC', type_name);
            EXECUTE format('GRANT USAGE ON TYPE public.%I TO controla_app, controla_backup, controla_academic', type_name);
        END IF;
    END LOOP;

    IF to_regclass('public."Movement"') IS NOT NULL THEN
        GRANT SELECT, INSERT, UPDATE ON TABLE public."User" TO controla_app;
        GRANT SELECT, INSERT ON TABLE public."Category", public."PaymentMethod" TO controla_app;
        GRANT SELECT, INSERT, DELETE ON TABLE public."Account" TO controla_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Movement", public."PaymentReminder" TO controla_app;

        CREATE OR REPLACE VIEW public.controla_academic_counts AS
            SELECT "type"::text AS tipo, count(*) AS movimientos
            FROM public."Movement"
            GROUP BY "type";
        ALTER VIEW public.controla_academic_counts OWNER TO controla_migrator;
        REVOKE ALL ON public.controla_academic_counts FROM PUBLIC, controla_app, controla_academic;
        GRANT SELECT ON public.controla_academic_counts TO controla_academic, controla_backup;
    END IF;
END
$access$;

COMMIT;
