\set ON_ERROR_STOP on
BEGIN READ ONLY;

SELECT current_database() AS base,
       count(*) FILTER (WHERE m."accountId" IS NULL) AS movimientos_historicos_sin_cuenta,
       count(*) FILTER (
           WHERE c."userId" IS DISTINCT FROM m."userId"
              OR c."type"::text IS DISTINCT FROM m."type"::text
              OR p."userId" IS DISTINCT FROM m."userId"
              OR (m."accountId" IS NOT NULL AND a."userId" IS DISTINCT FROM m."userId")
       ) AS movimientos_incompatibles
FROM "Movement" m
LEFT JOIN "Category" c ON c.id = m."categoryId"
LEFT JOIN "PaymentMethod" p ON p.id = m."paymentMethodId"
LEFT JOIN "Account" a ON a.id = m."accountId";

SELECT (SELECT count(*) FROM "Movement" WHERE amount = 'NaN'::numeric)
     + (SELECT count(*) FROM "Account" WHERE "initialBalance" = 'NaN'::numeric)
     + (SELECT count(*) FROM "PaymentReminder" WHERE amount = 'NaN'::numeric) AS importes_nan;

SELECT count(*) AS grupos_de_metodos_duplicados
FROM (SELECT 1 FROM "PaymentMethod" GROUP BY name, "userId" HAVING count(*) > 1) AS duplicates;

COMMIT;
