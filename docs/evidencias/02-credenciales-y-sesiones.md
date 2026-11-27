# Etapa 2. Credenciales y sesiones

Ejecución aislada del 27 de noviembre de 2026 con Node.js 22.19.0, PostgreSQL 18.3, Prisma 6.19.3 y Microsoft Edge en modo headless. Se compiló el frontend con Vite y se sirvió junto a la API real solo en loopback.

## Resultados observados

| Comprobación | Resultado |
|---|---|
| Suite completa con `npm --prefix backend test -- --browser` | 16 aprobadas, 0 fallidas, 0 omitidas |
| `npm --prefix frontend run lint` | Código de salida 0 |
| Cambio de usuario con carga demorada | El panel de la sesión siguiente no mostró movimientos ni saldo de la anterior antes de recibir los datos nuevos |
| Respuesta 401 demorada de una sesión anterior | La sesión actual quedó activa y pudo mostrar su propio movimiento |
| Cambio de contraseña y expiración | Los dos JWT previos se rechazaron y un JWT nuevo de vigencia breve expiró según lo configurado |
| Contraseña heredada sintética | La API la rechazó antes de convertirla. El escaneo fue de solo lectura. Un valor de revisión bloqueó la escritura. Al convertir y recontar, la autenticación con bcrypt funcionó |
| Seed | Rechazó ejecución sin activación. Dos ejecuciones autorizadas crearon una sola cuenta sintética |
| Límite de solicitudes | El inicio de sesión devolvió HTTP 429 con `Retry-After` al alcanzar el límite |

Los cambios se validaron con usuarios efímeros y credenciales generadas en cada ejecución. El primer ensayo de navegador agotó el tiempo al intentar pulsar el botón lateral fuera del viewport de la prueba. Las dos comprobaciones llegaron al flujo previsto tras activar el mismo botón con teclado. La salida del ejecutor confirma que PostgreSQL se detuvo y se retiró su directorio temporal.

El procedimiento con cuentas existentes y la rotación de cualquier credencial utilizada por el seed anterior deben coordinarse con el operador del entorno. Estas pruebas no evaluaron una base personal ni un despliegue detrás de proxy.
