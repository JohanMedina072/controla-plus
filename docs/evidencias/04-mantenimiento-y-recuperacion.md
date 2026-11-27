# Etapa 4. Mantenimiento y recuperación

Ensayo aislado del 27 de noviembre de 2026 con PostgreSQL 18.3 y Node.js 22.19.0. El origen contenía exclusivamente fixtures y el destino se creó vacío con `template0`.

| Comprobación | Resultado observado |
|---|---|
| Suite con navegador | 23 pruebas aprobadas, 0 fallidas, 0 omitidas |
| Mantenimiento | Se rechazó el destino incorrecto. Se obtuvieron las métricas y se ejecutó `VACUUM (ANALYZE)` sobre las seis tablas |
| Respaldo cifrado con rol efectivo de respaldo | 21 451 bytes, 386 ms. Un segundo intento con el mismo nombre se rechazó y la primera copia conservó sus bytes |
| Restauración transaccional | 325 ms. Una clave distinta produjo un error y el destino siguió vacío. La segunda restauración sobre el destino ocupado también se rechazó |
| Validación de contenido | Coincidieron los conteos, el importe total y el historial de migraciones. El saldo de la cuenta de prueba fue 455,50 y el movimiento histórico conservó su cuenta nula |
| Restricciones y permisos | Se comprobaron las tres claves foráneas compuestas y se reaplicaron los privilegios. El rol de aplicación pudo leer movimientos y careció de acceso a la tabla de migraciones |

Los tiempos miden las operaciones locales de copia y restauración del conjunto sintético. El RPO de 24 h y el RTO de 2 h siguen siendo objetivos operativos. El ensayo no ejercitó un cambio de conexión en un servicio real. El archivo cifrado y los temporales se retiraron después de verificar el resultado.
