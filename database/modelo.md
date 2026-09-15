# Modelo de base de datos de Controla+

## 1. Usuario

Representa a la persona que utiliza el sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| nombre | texto | Nombre del usuario |
| email | texto | Correo de acceso |
| password_hash | texto | Contraseña protegida |
| fecha_creacion | fecha | Fecha de registro |

## 2. Categoría

Permite clasificar los ingresos y gastos.

Ejemplos:

- Comida.
- Transporte.
- Salud.
- Estudios.
- Deudas.
- Entretenimiento.
- Mudanzas.
- Otros.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| nombre | texto | Nombre de la categoría |
| tipo | texto | ingreso o gasto |
| usuario_id | UUID | Usuario propietario |

## 3. Método de pago

Indica cómo se realizó un movimiento.

Ejemplos:

- Efectivo.
- Yape.
- BCP.
- Tarjeta BCP.
- Tarjeta IO.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| nombre | texto | Nombre del método |
| usuario_id | UUID | Usuario propietario |

## 4. Movimiento financiero

Representa un ingreso o un gasto.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| tipo | texto | ingreso o gasto |
| monto | decimal | Cantidad de dinero |
| descripción | texto | Detalle del movimiento |
| fecha | fecha | Fecha del movimiento |
| usuario_id | UUID | Usuario que lo registró |
| categoria_id | UUID | Categoría relacionada |
| metodo_pago_id | UUID | Método utilizado |

Ejemplos:

- Gasto de S/25 en comida.
- Ingreso de S/200 por una mudanza.
- Pago de S/300 a la tarjeta BCP.

## 5. Deuda

Representa una obligación financiera.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| nombre | texto | BCP, Yape, IO o familiar |
| monto_total | decimal | Monto original |
| saldo_pendiente | decimal | Monto que falta pagar |
| día_vencimiento | número | Día habitual de pago |
| estado | texto | pendiente, pagada o vencida |
| usuario_id | UUID | Usuario propietario |

## 6. Pago de deuda

Registra cada abono realizado a una deuda.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| monto | decimal | Cantidad abonada |
| fecha_pago | fecha | Fecha del pago |
| deuda_id | UUID | Deuda relacionada |

## 7. Recordatorio

Permite guardar pagos, clases, tareas y exámenes.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| título | texto | Nombre del recordatorio |
| tipo | texto | pago, clase, tarea, examen o cita |
| fecha_hora | fecha | Momento del evento |
| monto | decimal | Opcional para pagos |
| repetir | booleano | Si se repite |
| estado | texto | pendiente o completado |
| usuario_id | UUID | Usuario propietario |

## 8. Curso

Representa un curso académico.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| nombre | texto | Nombre del curso |
| modalidad | texto | presencial, virtual o asíncrono |
| usuario_id | UUID | Usuario propietario |

## 9. Tarea académica

Representa una tarea o examen.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| título | texto | Nombre de la actividad |
| tipo | texto | tarea, examen o proyecto |
| fecha_entrega | fecha | Fecha límite |
| prioridad | texto | baja, media o alta |
| estado | texto | pendiente, en proceso o terminada |
| curso_id | UUID | Curso relacionado |

## 10. Relaciones principales

- Un usuario puede tener muchos movimientos.
- Una categoría puede estar relacionada con muchos movimientos.
- Un método de pago puede utilizarse en muchos movimientos.
- Un usuario puede tener muchas deudas.
- Una deuda puede tener muchos pagos.
- Un usuario puede tener muchos recordatorios.
- Un usuario puede tener muchos cursos.
- Un curso puede tener muchas tareas.

## 11. Primera etapa de desarrollo

En la primera versión implementaremos solamente:

- Usuario.
- Categoría.
- Método de pago.
- Movimiento financiero.

Las deudas, recordatorios y cursos se agregarán después.