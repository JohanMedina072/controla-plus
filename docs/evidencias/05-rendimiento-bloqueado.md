# Etapa 5. Rendimiento con 1000 movimientos

**Estado: bloqueada.** Dos de siete mediciones del panel superaron el límite de 3000 ms. Las consultas HTTP de movimientos y cuentas cumplieron el objetivo en esta ejecución local.

## Método

- Ejecución del 27 de noviembre de 2026 en Windows x64, Ryzen 7 5700G, 16 procesadores lógicos y 14 GiB visibles. Node.js 22.19.0, PostgreSQL 18.3, Prisma 6.19.3, Vite 8.3.0 y Edge headless 158.0.4370.45.
- Clúster PostgreSQL temporal, API en loopback y frontend compilado. Se generaron 1000 movimientos para el usuario medido, repartidos entre dos cuentas y doce meses, y 25 para un usuario de control.
- Se midieron 10 solicitudes secuenciales por ruta, desde el inicio de la solicitud hasta leer el JSON completo. Cada respuesta devolvió solo recursos del propietario esperado.
- Se midieron siete aperturas del panel en una misma sesión de navegador, con cierre e inicio de sesión entre muestras. Cada cronómetro empezó inmediatamente antes de accionar el botón de acceso, con el formulario ya cargado, y terminó cuando se renderizaron los 1000 movimientos y transcurrieron dos cuadros de animación. Se comprobó la ausencia del movimiento del usuario de control.
- El p95 usa el método de rango más próximo en cada conjunto. La regla de aceptación utiliza el máximo observado. Las pruebas no predicen tiempos de red ni carga concurrente en producción.

## Resultados

| Escenario | Muestras | Primera (ms) | P95 (ms) | Máximo (ms) | Límite de 3000 ms |
|---|---:|---:|---:|---:|---|
| API de movimientos | 10 | 98,54 | 98,54 | 98,54 | Cumple |
| API de cuentas | 10 | 21,56 | 21,56 | 21,56 | Cumple |
| Panel en navegador | 7 | 1215,55 | 3871,64 | 3871,64 | **Incumple** |

Muestras del panel en orden, en ms: 1215,55 · 1145,63 · 1556,58 · 2226,29 · 2563,51 · 3871,64 · 3209,67.

`EXPLAIN (ANALYZE, BUFFERS)` de una consulta SQL representativa por propietario y fecha devolvió 1000 filas, con nodo superior `Sort`, 0,116 ms de planificación y 0,325 ms de ejecución. Es una consulta representativa, distinta de la medición HTTP completa.

La ejecución integrada terminó con **25 pruebas aprobadas, 1 fallida y 0 omitidas**. El caso que falló fue el límite temporal del panel. Lint y compilación del frontend terminaron con código 0. Vite informó un paquete JavaScript minificado de 945,75 kB.

## Prueba académica y alcance publicado

Los guiones DDL/DML en preparación se ejecutaron sobre una quinta base desechable. El DDL creó seis tablas y rechazó una segunda aplicación al destino ocupado. El DML rechazó una base con nombre ajeno a la demostración, obtuvo un saldo sintético de 250,00 tras actualizar, dejó un movimiento tras la eliminación de prueba y revirtió todas las filas de demostración. Ambos guiones y las actualizaciones de documentación de la Etapa 5 quedaron en la copia local tras aplicar el criterio de parada.

Las etapas 1 a 4, incluidas la migración, la separación de roles y la recuperación, están publicadas. Esta evidencia registra el incumplimiento sin presentar la Etapa 5 como finalizada.
