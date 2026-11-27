# DDL y DML de Controla+

## DDL

Las seis migraciones de Prisma son la fuente del esquema. Crean las seis tablas y dos enums, definen claves primarias y foráneas, aplican restricciones de dominio y añaden índices. La última migración valida las referencias existentes antes de imponer la pertenencia mediante claves compuestas. El [modelo definitivo](../database/modelo.md) documenta columnas, claves y acciones referenciales.

`database/ddl-demo.sql` aplica ese mismo DDL en orden en una base desechable `controla_demo_*` con el esquema público vacío. Está destinado a la exposición académica. Para instalar o actualizar la aplicación, usa `prisma migrate deploy` con el rol de migración para conservar su historial. [Guion DDL](../database/ddl-demo.sql) · [Migraciones canónicas](../backend/prisma/migrations/)

## DML

`database/dml-demo.sql` abre una transacción y crea un usuario sintético sin acceso de aplicación, una cuenta, categorías, un método, dos movimientos y un recordatorio. Demuestra `INSERT`, un `SELECT` con unión y agregación, un `UPDATE` acotado al propietario y un `DELETE` sobre un movimiento de esa misma demostración. Después ejecuta `ROLLBACK` y verifica que el usuario sintético quedó fuera de la base. [Guion DML](../database/dml-demo.sql)

## Reproducción

La suite `npm.cmd --prefix backend test` crea una base temporal de demostración, ejecuta ambos guiones y verifica las salidas. En una instancia de PostgreSQL dedicada a la demostración, con `PGHOST`, `PGPORT` y `PGUSER` ya definidos para esa instancia, se pueden ejecutar desde la raíz:

```powershell
createdb -T template0 controla_demo_academico
psql -X -d controla_demo_academico -f database/ddl-demo.sql
psql -X -d controla_demo_academico -f database/dml-demo.sql
```

En el ensayo se crearon seis tablas, el saldo sintético tras actualizar fue 250,00, quedó un movimiento tras el borrado dentro de la transacción y el conteo de usuarios y movimientos al concluir fue cero. [Resultados de la entrega](evidencias/05-rendimiento-final.md)
