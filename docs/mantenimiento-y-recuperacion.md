# Mantenimiento, respaldo y recuperación

## Mantenimiento operativo

| Frecuencia propuesta | Responsable | Comprobación |
|---|---|---|
| Diaria | Operación | Verificar que la copia cifrada terminó con código cero, tiene tamaño razonable y llegó al almacenamiento externo. Revisar espacio, conexiones y fallos de autenticación o copia. |
| Semanal | DBA | Revisar tablas, filas muertas estimadas, uso de índices y actividad de autovacuum con `database/maintenance.sql`. Comparar tendencias y comprobar alertas de capacidad. |
| Antes de cada migración | DBA y responsable de despliegue | Crear una copia cifrada, comprobarla con una restauración aislada y ejecutar el preflight. Programar una ventana de mantenimiento si habrá bloqueos. |
| Mensual | DBA y responsable de la aplicación | Ensayar una restauración aislada, comprobar reglas, permisos y saldos, y registrar los tiempos y el resultado. |

```powershell
psql -X -d controla_dev -v target_db=controla_dev -f database/maintenance.sql
psql -X -d controla_dev -v target_db=controla_dev -v run_vacuum=true -f database/maintenance.sql
```

El primer comando muestra métricas. El segundo ejecuta `VACUUM (ANALYZE)` sobre las seis tablas. Usa el segundo solo si las métricas o una carga importante lo justifican y coordina el consumo de E/S. Mantén autovacuum habilitado. Revisa consultas lentas e índices con estadísticas y planes de ejecución antes de proponer cambios.

## Política de respaldo

Usa una copia lógica cifrada diaria y conserva inicialmente 14 copias diarias en almacenamiento con acceso restringido, separado de la base y del repositorio. Mantén la clave en un gestor de secretos separado de las copias. Registra versión de PostgreSQL, momento, código de salida, tamaño, ubicación y verificación. El sistema de almacenamiento y la programación automática se configuran en el entorno de destino.

Objetivos propuestos: **RPO de 24 horas** y **RTO de 2 horas**. El RPO depende de que la programación y la copia externa funcionen y de que la última copia se pueda descifrar. Mide el RTO desde el inicio del incidente hasta que el servicio recupere su operación. El tiempo de `pg_restore` es solo una parte.

## Crear una copia cifrada

Prepara los binarios `pg_dump`, `pg_restore` y `psql` de la versión compatible con el servidor y ajusta `PATH` o `PG_BINDIR`. Configura `PGHOST`, `PGPORT`, `PGUSER` y un `PGPASSFILE` protegido o el mecanismo de secretos autorizado. Para un servidor remoto configura TLS verificado. Usa el LOGIN de respaldo de la [matriz de roles](roles-y-permisos.md).

Provee `CONTROLA_BACKUP_KEY` mediante el gestor de secretos como 32 bytes aleatorios en hexadecimal. No reutilices `JWT_SECRET`. Desde la raíz y con la carpeta externa ya creada:

```powershell
node database/scripts/archive.cjs backup controla_dev D:\Respaldos\controla-diario.controla-backup
```

El script transmite el formato custom de `pg_dump` por AES-256-GCM y publica el archivo final sin reemplazar uno previo. Usa un volumen con enlaces duros, como NTFS. Utiliza un nombre distinto por fecha y valida la copia antes de considerarla recuperable.

## Restaurar y validar

1. Identifica la última copia recuperable y su clave con acceso autorizado. Registra el inicio del incidente.
2. Crea una base nueva a partir de `template0`, con un nombre que empiece por `controla_restore_`. Limita su acceso al operador durante la restauración. Cambia al LOGIN de administración designado para esa base.
3. Configura la clave de esa copia y ejecuta el comando siguiente desde la raíz:

```powershell
node database/scripts/archive.cjs restore controla_restore_ensayo D:\Respaldos\controla-diario.controla-backup
psql -X -d controla_restore_ensayo -v target_db=controla_restore_ensayo -f database/roles.sql
```

4. Verifica conteos e importes, movimientos históricos sin cuenta, restricciones, historial de migraciones y permisos. Inicia una instancia aislada de Express con la identidad de aplicación y ejecuta una comprobación funcional con cuentas autorizadas.
5. Registra tiempos y diferencias. Si la recuperación forma parte de un incidente real, el operador decide el cambio de conexión después de validar la base recuperada y conserva el origen según el protocolo del entorno.

El ejecutor verifica la autenticidad antes de abrir la restauración y usa una transacción de `pg_restore`, sin comandos de limpieza de la base original. Descifra en un directorio temporal del usuario que se elimina al final. Usa un volumen temporal cifrado y restringido, y revisa artefactos temporales si el proceso termina por la fuerza. La copia carece de propietarios y ACL. Reaplica `roles.sql` y provisiona los LOGIN por el mecanismo autorizado.

Consulta el [ensayo documentado](evidencias/04-mantenimiento-y-recuperacion.md).

## Evidencia y continuidad operativa

La suite aislada repite el ensayo de mantenimiento y recuperación junto con las pruebas de integridad. Conserva en un registro operativo los resultados de cada copia y de cada simulacro. Ante una ejecución incompleta, mide el tiempo transcurrido desde la última copia verificada e investiga su causa antes de cerrar la incidencia. Los resultados locales de la suite cubren la restauración de datos sintéticos y la reaplicación de permisos. La programación diaria, el almacenamiento externo y la conmutación de un servicio quedan a cargo del operador del entorno.
