# Etapa 3. Integridad y mínimo privilegio

Ejecución aislada del 27 de noviembre de 2026 en PostgreSQL 18.3, Prisma 6.19.3, Node.js 22.19.0 y Edge headless.

| Comprobación | Resultado observado |
|---|---|
| `prisma validate` | Esquema válido |
| `npm --prefix backend test -- --browser` | 21 aprobadas, 0 fallidas, 0 omitidas |
| Instalación limpia | Se aplicaron las seis migraciones |
| Actualización con datos compatibles | Se conservaron dos movimientos, uno con cuenta y otro con `accountId = NULL`, y el recordatorio de prueba |
| Preflight con dato incompatible | PostgreSQL rechazó la migración. La categoría siguió como texto, no se instaló la FK nueva y el movimiento sintético mantuvo su importe y sus referencias |
| SQL directo | Tres referencias de otro dueño y una categoría de tipo distinto se rechazaron con SQLSTATE `23503`. Un importe `NaN` se rechazó con `23514`. Se rechazó el borrado de una cuenta con historial |
| Aprovisionamiento de roles | Un nombre de destino incorrecto se rechazó. Dos aplicaciones al destino correcto completaron el aprovisionamiento |
| Permisos efectivos | Con `SET LOCAL ROLE`, la aplicación pudo ejecutar su DML y se le denegaron DDL y acceso a migraciones. Respaldo pudo leer y se le denegó DML. El rol académico pudo consultar la vista y se le denegó el acceso a hashes. Migración ejecutó DDL y quedó separada de los privilegios de administración de la base |

Los permisos se comprobaron con roles efectivos en el PostgreSQL temporal. La prueba no creó cuentas de acceso operativas en un entorno real. El bloqueo de la migración es una comprobación de seguridad esperada sobre fixtures, sin corrección automática de registros.
