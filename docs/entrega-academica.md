# Entrega técnica de Controla+

Controla+ es una aplicación web para gestionar cuentas, movimientos y recordatorios de finanzas personales. La entrega reúne el modelo PostgreSQL, los guiones de demostración, la separación de roles y pruebas reproducibles con datos sintéticos.

## Matriz de cumplimiento

| Requerimiento académico | Implementación y evidencia |
|---|---|
| Documentación DDL | [Seis migraciones versionadas](../backend/prisma/migrations/), [modelo físico](../database/modelo.md) y [guion de demostración](../database/ddl-demo.sql). Instalación limpia y actualización verificadas. |
| Documentación DML | [Guía DDL y DML](ddl-y-dml.md) y [guion transaccional](../database/dml-demo.sql). La prueba comprueba inserción, consulta, actualización, borrado y reversión de datos sintéticos. |
| Gestión de seguridad | [Configuración y procedimiento para contraseñas heredadas](seguridad.md). Se verifican expiración, revocación, límites de acceso y cambio de usuario en navegador. |
| Roles y permisos | [Matriz por objeto](roles-y-permisos.md) y [aprovisionamiento SQL](../database/roles.sql). Los ensayos comprueban DML de aplicación, DDL de migración, lectura de respaldo y consulta académica restringida. |
| Plan de mantenimiento | [Guía de frecuencias y responsabilidades](mantenimiento-y-recuperacion.md) y [guion de diagnóstico y VACUUM](../database/maintenance.sql). |
| Backup y recuperación de fallos | [Herramienta de copia cifrada y restauración](../database/scripts/archive.cjs) y [ensayo aislado](evidencias/04-mantenimiento-y-recuperacion.md). |
| Herramientas y metodologías | [Arquitectura](arquitectura.md), [requisitos](requisitos.md), protocolos de pruebas y versiones por etapa. |
| Resultados y conclusiones | [Resultados por etapa](evidencias/README.md), [medición inicial](evidencias/05-rendimiento-bloqueado.md) y [perfilado y aceptación final](evidencias/05-rendimiento-final.md). |

## Herramientas y metodología

- React y Vite para la interfaz. Node.js, Express y Prisma para la API y la gestión de migraciones SQL. PostgreSQL almacena los datos y aplica las restricciones.
- Git y GitHub para controlar versiones, revisar cambios y consultar evidencia por etapa.
- `node:test`, Playwright y Edge headless para regresiones de API, integridad y navegador. Chrome DevTools Protocol permite medir actividad de CPU, layout, DOM y memoria del renderizador.
- `psql`, `pg_dump` y `pg_restore` para aprovisionar y demostrar el esquema, verificar restricciones y ensayar recuperación. Cada ejecución crea un clúster local temporal con credenciales efímeras.
- El DDL histórico se mantuvo versionado y la integridad adicional se incorporó con una migración nueva. La validación de cada etapa usó instalaciones limpias, actualizaciones controladas y fixtures de casos válidos e inválidos.

## Conclusiones y limitaciones

El aislamiento se comprueba en las operaciones de API y en el cambio de sesión del navegador. PostgreSQL refuerza la pertenencia y el tipo de las referencias de cada movimiento. La recuperación restableció los datos sintéticos y permitió reaplicar los permisos. El ensayo de rendimiento reproduce siete aperturas del panel con las 1000 filas renderizadas y diez solicitudes por ruta de API. [Evidencia consolidada](evidencias/05-rendimiento-final.md)

La prueba temporal caracteriza un solo equipo, un navegador y un usuario en loopback. La latencia de redes externas, la concurrencia de varios usuarios y la compatibilidad de micrófono y servicio de voz por dispositivo quedan fuera de esa medición. La integración por voz se comprueba con una transcripción simulada.

Los límites de autenticación se mantienen por proceso. La comprobación de permisos se hizo sobre PostgreSQL nativo con roles efectivos. En el despliegue, el operador debe provisionar los LOGIN separados y verificar sus concesiones y conectividad. La retención de copias, la programación y los objetivos completos de RPO y RTO se validan en operación.
