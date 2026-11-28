# Evidencias visuales de Controla+

Capturas y figuras para el capítulo V y los anexos del informe universitario. Se ejecutó el código de `main` en el commit [`0f39fed`](https://github.com/JohanMedina072/controla-plus/commit/0f39fed64c7d0b40c4331621d5654ac8b2b66ac0) el 28 de noviembre de 2026. El entorno usó Node.js 22, PostgreSQL 18 y Playwright con Microsoft Edge.

Las capturas de la aplicación muestran una misma persona ficticia, tres cuentas, ocho movimientos y tres recordatorios. Los importes están en soles peruanos. Las capturas se obtuvieron en loopback con un clúster temporal. El archivo de respaldo, las claves temporales y los registros internos se excluyeron de la entrega.

## Capítulo V

| Archivo | Qué muestra y cómo se obtuvo | Qué respalda |
|---|---|---|
| [Figura_06_Migraciones.png](Figura_06_Migraciones.png) | Captura de la salida real de `prisma migrate status` y de una consulta a `_prisma_migrations`. | Seis migraciones aplicadas y esquema al día. |
| [Figura_07_Tablas_PostgreSQL.png](Figura_07_Tablas_PostgreSQL.png) | Captura del resultado real de `psql` sobre `information_schema.columns`. | Las seis tablas principales y su número de columnas. |
| [Figura_08_DDL_DML.png](Figura_08_DDL_DML.png) | Extractos de la ejecución real de `ddl-demo.sql` y `dml-demo.sql` en una base desechable. | Creación de seis tablas, saldo sintético de **S/ 250,00** después de actualizar y reversión de los datos de demostración. |
| [Figura_09_Roles_Permisos.png](Figura_09_Roles_Permisos.png) | Captura de privilegios consultados en PostgreSQL después de aplicar `roles.sql`. | Permisos de administración, migración, aplicación, respaldo y lectura académica, con operaciones permitidas y denegadas. |
| [Figura_10_Backup.png](Figura_10_Backup.png) | Salida de `archive.cjs backup` y metadatos calculados del archivo cifrado que se generó. | El rol de respaldo creó la copia. Se verificaron el tamaño, la cabecera del archivo y la huella SHA-256. |
| [Figura_11_Flujo_Recuperacion.png](Figura_11_Flujo_Recuperacion.png) | Diagrama elaborado a partir del procedimiento operativo. Incluye la decisión ante una restauración válida o inconsistente. | Flujo desde la generación y custodia de la copia hasta la validación y la recuperación del servicio. [Fuente editable en HTML](Figura_11_Flujo_Recuperacion.html). |
| [Figura_12_Restauracion.png](Figura_12_Restauracion.png) | Captura de la restauración real y de las consultas en el origen sintético y el destino aislado. | Coincidencia de conteos e importes, seis migraciones y tres claves foráneas compuestas validadas después de restaurar. |
| [Figura_13_Rendimiento.png](Figura_13_Rendimiento.png) | Gráfico elaborado con los máximos de la medición histórica antes y después del ajuste. | Comparación de **3871,64 ms** y **2879,25 ms** con el umbral de **3000 ms** y 1000 movimientos. [Medición original](https://github.com/JohanMedina072/controla-plus/blob/0f39fed64c7d0b40c4331621d5654ac8b2b66ac0/docs/evidencias/05-rendimiento-final.md). |
| [Figura_14_Dashboard.png](Figura_14_Dashboard.png) | Composición de recortes de una misma captura real en Edge. Reúne la cabecera y los resúmenes, los gráficos y la primera fila de movimientos. | Visualización del panel con registros sintéticos, conservando los estilos y datos de la aplicación. |
| [Figura_15_Pruebas_Finales.png](Figura_15_Pruebas_Finales.png) | Extracto de la salida real de `npm --prefix backend test -- --performance` y resumen emitido por `node:test`. | La ejecución confirmó **29 aprobadas, 0 fallidas y 0 omitidas**. |

Las salidas reales se capturaron en un visor en Edge con encabezados de contexto. Las figuras 11 y 13 son elaboraciones gráficas y se identifican como tales. Las figuras 10 y 12 documentan el ensayo local de recuperación de datos. El cambio de conexión de un servicio en producción forma parte del procedimiento del diagrama.

## Anexos

| Archivo | Qué muestra y cómo se obtuvo | Qué respalda |
|---|---|---|
| [Anexo_A_Repositorio.png](Anexo_A_Repositorio.png) | Captura real de GitHub en Edge con la rama `main` seleccionada antes de publicar este paquete. | Ubicación pública y versión integrada del proyecto usado para las capturas. |
| [Anexo_G01_Login.png](Anexo_G01_Login.png) | Captura de la tarjeta de acceso antes de introducir datos. | Inicio de sesión con los campos vacíos. |
| [Anexo_G02_Formulario.png](Anexo_G02_Formulario.png) | Composición de dos capturas reales del formulario. Una muestra el tipo Gasto y la otra el tipo Ingreso. | Selección del tipo, monto, categoría, método y cuenta. Los ejemplos del formulario quedaron sin enviar. |
| [Anexo_G03_Movimientos.png](Anexo_G03_Movimientos.png) | Captura de la sección de movimientos después de iniciar sesión. | Listado de ocho movimientos con fecha, tipo, cuenta e importe. |
| [Anexo_G04_Cuentas.png](Anexo_G04_Cuentas.png) | Captura del módulo de cuentas con el saldo inicial y actual de cada cuenta. | Saldos calculados sobre los mismos movimientos de la demostración. |
| [Anexo_G05_Recordatorios.png](Anexo_G05_Recordatorios.png) | Captura del módulo de recordatorios con un vencido, un próximo y un pendiente. | Estado, vencimiento e importe sintético de cada recordatorio. |
| [Anexo_G06_Excel.png](Anexo_G06_Excel.png) | Rango de la hoja Movimientos renderizado por Microsoft Excel a partir del archivo descargado con el botón de exportación. El formato S/ se aplicó en memoria para la captura. | La exportación generó ocho registros y conservó sus importes. Se incluye el [XLSX original](Anexo_G06_Excel_exportado.xlsx). |
