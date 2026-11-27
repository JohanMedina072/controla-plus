# Controla+

Aplicación de finanzas personales con React, Vite, Express, Prisma y PostgreSQL.

## Pruebas de integración en PostgreSQL aislado

Requisitos: Node.js 22.19 o posterior dentro de la rama 22, npm y los binarios de PostgreSQL 18. La suite necesita `initdb`, `pg_ctl`, `postgres`, `psql`, `pg_dump` y `pg_restore` de la misma instalación. Ejecuta con una cuenta local normal que pueda escribir en su carpeta temporal y escuchar en puertos de loopback.

Desde la raíz del repositorio, en PowerShell:

```powershell
$env:PG_BINDIR = 'C:\Program Files\PostgreSQL\18\bin'
npm.cmd --prefix backend ci
npm.cmd --prefix backend test
```

Ajusta `PG_BINDIR` a la instalación local. Si los ejecutables ya están en `PATH`, puedes omitir esa variable. En otros sistemas, usa `npm` en lugar de `npm.cmd` y agrega al `PATH` el directorio que devuelve `pg_config --bindir`, o indica ese directorio en `PG_BINDIR`.

El comando `test` crea un clúster temporal con autenticación SCRAM y credenciales aleatorias. PostgreSQL y Express escuchan solo en `127.0.0.1`, en puertos elegidos para la ejecución. Prisma recibe por proceso las URL del clúster recién creado y un secreto JWT temporal. No necesitas preparar un `.env`, iniciar un servicio de PostgreSQL existente ni ejecutar el seed de demostración.

La suite prepara cinco bases:

- `controla_stage1_clean` aplica todas las migraciones desde cero y ejecuta las pruebas HTTP y de restricciones SQL.
- `controla_stage1_upgrade` aplica primero las cuatro migraciones anteriores al endurecimiento, inserta movimientos y un recordatorio sintéticos, aplica las migraciones pendientes y verifica que se conserven los datos, incluido un movimiento con `accountId = NULL`.
- `controla_stage1_preflight` reproduce el esquema anterior a las referencias compuestas y verifica el rechazo atómico ante un caso sintético incompatible.
- `controla_restore_stage4` recibe un respaldo cifrado de los datos sintéticos para verificar su recuperación y los permisos.
- `controla_demo_etapa5` ejecuta los guiones DDL y DML académicos. Las filas de demostración se revierten.

La suite también comprueba el aislamiento de dos cuentas de aplicación, los saldos tras el CRUD, el vencimiento mensual de recordatorios, la conversión de una contraseña heredada sintética y los códigos SQLSTATE de integridad. Al terminar, el ejecutor detiene el clúster que creó y elimina su directorio temporal. Si la ejecución se interrumpe a la fuerza, verifica el directorio `controla-plus-test-*` correspondiente en la carpeta temporal del sistema antes de intervenir. Usa `pg_ctl -D <ruta-temporal>/postgres status` y detén únicamente ese clúster si sigue activo.

## Comprobaciones del frontend

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Lint y build comprueban el código fuente y la compilación.

Para ejecutar las pruebas de navegador, instala las dependencias de ambos proyectos. Usa Microsoft Edge con `CONTROLA_BROWSER_CHANNEL=msedge` o instala el Chromium de Playwright con `npx playwright install chromium` desde `backend`.

```powershell
$env:CONTROLA_BROWSER_CHANNEL = 'msedge'
npm.cmd --prefix backend test -- --browser
npm.cmd --prefix backend test -- --performance
npm.cmd --prefix backend test -- --profile
```

`--browser` añade las pruebas de sesión y uso del panel. `--performance` añade la aceptación con 1000 movimientos y un máximo de 3000 ms por escenario. `--profile` ejecuta un diagnóstico separado mediante CDP y reporta CPU, DOM, memoria y creación de formateadores.

## Ejecutar la aplicación en desarrollo

1. Instala las dependencias con `npm.cmd --prefix backend ci` y `npm.cmd --prefix frontend ci`.
2. Prepara PostgreSQL en una base dedicada de desarrollo. Usa la conexión de migración para ejecutar `npx prisma migrate deploy` desde `backend` y aplica los permisos de ejecución según la guía de roles.
3. Configura la conexión del rol de aplicación y la clave JWT en el entorno de Express. Usa `backend/.env.example` como referencia de variables y `frontend/.env.example` para la URL de la API.
4. Desde la raíz, inicia `npm.cmd --prefix backend run dev` y `npm.cmd --prefix frontend run dev` en terminales separadas. Abre la dirección que indique Vite.

Consulta la [configuración de seguridad y el procedimiento para contraseñas heredadas](docs/seguridad.md).
Consulta también la [matriz de roles y el preflight de actualización](docs/roles-y-permisos.md).
La [guía de mantenimiento y recuperación](docs/mantenimiento-y-recuperacion.md) documenta las comprobaciones SQL, el respaldo y el ensayo de restauración.
El [informe de entrega académica](docs/entrega-academica.md) reúne el modelo, los guiones y las evidencias de cada etapa.
