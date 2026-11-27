# Alcance de Controla+

Controla+ permite a cada usuario gestionar sus finanzas personales y consultar información de sus propios registros.

## Funciones implementadas

- Registro, inicio de sesión, cierre de sesión y edición de perfil.
- Alta, consulta y eliminación de cuentas vacías.
- Registro, consulta, actualización y eliminación de ingresos y gastos. Cada alta o edición requiere una cuenta activa del mismo propietario.
- Catálogos iniciales de categorías y métodos de pago por usuario.
- Recordatorios mensuales de pago con edición, eliminación y avance del vencimiento al confirmar el pago.
- Panel, búsqueda, filtros mensuales, gráficos, exportación a Excel y captura por voz con revisión en navegadores compatibles.

## Requisitos no funcionales

| Requisito | Criterio de verificación |
|---|---|
| Seguridad y aislamiento | JWT por sesión, bcrypt y límites de intentos. Verificar permisos efectivos y confirmar que los datos del usuario anterior desaparecen al cambiar de sesión. |
| Integridad | Probar pertenencia y tipo de referencias, SQLSTATE de restricciones y conservación de movimientos históricos con cuenta nula en una actualización. |
| Mantenibilidad | Ejecutar las migraciones versionadas desde cero y desde el esquema anterior. Reproducir lint, build y las pruebas en un PostgreSQL temporal. |
| Recuperación | Crear una copia cifrada, restaurarla en una base vacía y verificar importes, conteos, restricciones y permisos. Los objetivos operativos son RPO de 24 h y RTO de 2 h. |
| Rendimiento | Con 1000 movimientos propios, cada muestra de movimientos, cuentas y panel debe quedar dentro de 3000 ms. La medición del panel termina tras renderizar los 1000 elementos y transcurrir dos cuadros de animación. |
| Entrega reproducible | Ejecutar los guiones DDL y DML con datos sintéticos y conservar modelo, documentación de permisos, procedimiento de recuperación y resultados en GitHub. |

El [informe técnico de entrega](entrega-academica.md) vincula los requerimientos con sus guiones y evidencias.
