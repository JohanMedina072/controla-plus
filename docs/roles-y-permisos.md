# Roles y permisos de PostgreSQL

El rol de ejecución es una identidad de servicio de Express. Las personas que usan Controla+ se identifican con JWT y sus consultas se filtran por `userId`. Las claves foráneas compuestas impiden asociar movimientos con recursos de otro dueño, incluso al escribir por SQL. Una conexión directa del rol de aplicación puede leer las tablas que necesita Express y debe permanecer bajo control del backend.

| Grupo sin LOGIN | Permisos asignados |
|---|---|
| `controla_admin` | Administración de la base dedicada y acceso al grupo de migración. El aprovisionamiento inicial de grupos requiere un operador PostgreSQL con permisos suficientes sobre el clúster. |
| `controla_migrator` | Propietario de `public`, las seis tablas, los dos enums y `_prisma_migrations`. Ejecuta DDL y administra objetos de la aplicación. |
| `controla_app` | Conexión y uso del esquema. DML por tabla según las operaciones reales de la API. Carece de DDL, de borrado de usuarios y de acceso a `_prisma_migrations`. |
| `controla_backup` | Conexión, uso del esquema y lectura de objetos necesarios para `pg_dump`, incluidos los hashes y la historia de migraciones. Debe utilizarse con un canal y almacenamiento protegidos. |
| `controla_academic` | Conexión y lectura de la vista `controla_academic_counts` con conteos por tipo de movimiento. Para las demostraciones académicas, asigna este grupo únicamente sobre datos sintéticos. |

## Aprovisionamiento y despliegue

Con una conexión administrativa dedicada al entorno autorizado, ejecuta desde la raíz:

```powershell
psql -X -d controla_dev -v target_db=controla_dev -f database/roles.sql
```

El script comprueba el nombre real del destino, limita el alcance a los objetos conocidos y permite una nueva ejecución tras desplegar migraciones. Antes de usarlo sobre una base existente, revisa sus ACL, propietarios y usuarios, porque cambia el propietario de `public` y restringe los permisos de `PUBLIC`.

Crea un LOGIN independiente para cada tarea y concédele solo el grupo correspondiente. Usa `\password` en una consola protegida o el mecanismo de secretos del proveedor. Evita poner contraseñas en SQL, argumentos o historial. Para que las migraciones creen objetos con el propietario previsto, configura al LOGIN de migración con el rol efectivo `controla_migrator` al conectar a la base. En PostgreSQL nativo se puede configurar con `ALTER ROLE operador_migracion IN DATABASE controla_dev SET role TO 'controla_migrator';`, usando el nombre real del LOGIN. Verifica `SELECT session_user, current_user, current_database();` antes de migrar.

En una base vacía, aprovisiona grupos primero, ejecuta `npx prisma migrate deploy` desde `backend` con la URL del LOGIN de migración y ejecuta de nuevo el script para conceder los permisos a las tablas recién creadas. Para iniciar Express, provee en otro proceso la URL del LOGIN de aplicación mediante `DATABASE_URL`. El LOGIN de respaldo se usa únicamente desde las tareas de copia. Mantén las credenciales operativas separadas.

## Actualización conservadora

Antes de aplicar la nueva migración en un entorno autorizado, restaura un respaldo en una base aislada y ejecuta `database/preflight.sql`. Si hay referencias incompatibles, importes no numéricos o métodos duplicados, detén el despliegue y determina su origen. Los valores `accountId = NULL` se reportan y se conservan.

La migración toma un bloqueo con espera acotada y repite las comprobaciones dentro de la transacción. Si falla, inspecciona el error y el historial de Prisma. Cualquier corrección de pertenencia o cambio financiero requiere una decisión explícita del dueño de la información. La operación de borrado sigue devolviendo HTTP 409 al intentar eliminar una cuenta que conserva movimientos.
