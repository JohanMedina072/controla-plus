\set ON_ERROR_STOP on
\if :{?target_db}
\else
  \echo 'Indica -v target_db=NOMBRE_EXACTO'
  SELECT 1/0;
\endif
\if :{?run_vacuum}
\else
  \set run_vacuum false
\endif

SELECT current_database() = :'target_db' AS allowed \gset
\if :allowed
\else
  \echo 'La base conectada no es el destino indicado'
  SELECT 1/0;
\endif

SELECT current_database() AS base,
       current_setting('server_version') AS version,
       current_setting('autovacuum') AS autovacuum,
       pg_database_size(current_database()) AS bytes_base,
       (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) AS conexiones;

SELECT relname AS tabla, n_live_tup AS filas_estimadas, n_dead_tup AS filas_muertas_estimadas,
       last_autovacuum, last_autoanalyze, last_vacuum, last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public' AND relname IN (
    'User', 'Account', 'Category', 'PaymentMethod', 'Movement', 'PaymentReminder'
)
ORDER BY relname;

SELECT relname AS tabla, indexrelname AS indice, idx_scan AS usos,
       pg_relation_size(indexrelid) AS bytes_indice
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND relname IN (
    'User', 'Account', 'Category', 'PaymentMethod', 'Movement', 'PaymentReminder'
)
ORDER BY relname, indexrelname;

\if :run_vacuum
  VACUUM (ANALYZE) public."User", public."Account", public."Category",
                   public."PaymentMethod", public."Movement", public."PaymentReminder";
\endif
