# Controla+

Aplicación de finanzas personales con React, Vite, Express, Prisma y PostgreSQL.

## Pruebas de integración en PostgreSQL aislado

Requisitos: Node.js 22.19 o posterior dentro de la rama 22, npm y los binarios de PostgreSQL 18. La suite necesita `initdb`, `pg_ctl`, `postgres` y `psql` de la misma instalación. Ejecuta con una cuenta local normal que pueda escribir en su carpeta temporal y escuchar en puertos de loopback.

Desde la raíz del repositorio, en PowerShell:

```powershell
$env:PG_BINDIR = 'C:\Program Files\PostgreSQL\18\bin'
npm.cmd --prefix backend ci
npm.cmd --prefix backend test
```

Ajusta `PG_BINDIR` a la instalación local. Si los ejecutables ya están en `PATH`, puedes omitir esa variable. En otros sistemas, usa `npm` en lugar de `npm.cmd` y agrega al `PATH` el directorio que devuelve `pg_config --bindir`, o indica ese directorio en `PG_BINDIR`.

El comando `test` crea un clúster temporal con autenticación SCRAM y credenciales aleatorias. PostgreSQL y Express escuchan solo en `127.0.0.1`, en puertos elegidos para la ejecución. Prisma recibe por proceso las URL del clúster recién creado y un secreto JWT temporal. No necesitas preparar un `.env`, iniciar un servicio de PostgreSQL existente ni ejecutar el seed de demostración.

La suite prepara tres bases:

- `controla_stage1_clean` aplica todas las migraciones desde cero y ejecuta las pruebas HTTP y de restricciones SQL.
- `controla_stage1_upgrade` aplica primero las cuatro migraciones anteriores al endurecimiento, inserta movimientos y un recordatorio sintéticos, aplica la migración pendiente y verifica que se conserven los datos, incluido un movimiento con `accountId = NULL`.
- `controla_stage1_preflight` reproduce el esquema anterior a las referencias compuestas y verifica el rechazo atómico ante un caso sintético incompatible.

La suite también comprueba el aislamiento de dos cuentas de aplicación, los saldos tras el CRUD, el vencimiento mensual de recordatorios, la conversión de una contraseña heredada sintética y los códigos SQLSTATE de integridad. Al terminar, el ejecutor detiene el clúster que creó y elimina su directorio temporal. Si la ejecución se interrumpe a la fuerza, verifica el directorio `controla-plus-test-*` correspondiente en la carpeta temporal del sistema antes de intervenir. Usa `pg_ctl -D <ruta-temporal>/postgres status` y detén únicamente ese clúster si sigue activo.

## Comprobaciones del frontend

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Lint y build comprueban el código fuente y la compilación.

Para probar el cambio de sesión en navegador, instala las dependencias de ambos proyectos y ejecuta `npx playwright install chromium` desde `backend`. Después, desde la raíz, ejecuta `npm.cmd --prefix backend test -- --browser`. Si ya tienes Microsoft Edge, puedes usarlo con `CONTROLA_BROWSER_CHANNEL=msedge`.

Consulta la [configuración de seguridad y el procedimiento para contraseñas heredadas](docs/seguridad.md).
Consulta también la [matriz de roles y el preflight de actualización](docs/roles-y-permisos.md).
