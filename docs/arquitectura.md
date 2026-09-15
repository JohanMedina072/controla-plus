# Arquitectura de Controla+

## 1. Tipo de arquitectura

Controla+ utilizará una arquitectura de aplicación monolítica modular.

Esto significa que tendremos un solo backend, pero cada función estará organizada en módulos independientes:

- Finanzas.
- Deudas.
- Recordatorios.
- Organización académica.
- Metas y presupuestos.

Esta arquitectura es adecuada para la primera versión porque es más sencilla de desarrollar, probar y mantener.

## 2. Componentes principales

### Frontend

Será la interfaz visual creada con React. Permitirá:

- Iniciar sesión.
- Registrar ingresos y gastos.
- Consultar movimientos.
- Ver gráficos.
- Administrar deudas.
- Revisar tareas y recordatorios.

### Backend

Será creado con Node.js y Express. Se encargará de:

- Recibir las solicitudes del frontend.
- Validar los datos.
- Aplicar las reglas del sistema.
- Comunicarse con PostgreSQL.
- Generar reportes.
- Gestionar recordatorios.
- Recibir mensajes de WhatsApp en una versión futura.

### Base de datos

PostgreSQL almacenará:

- Usuarios.
- Movimientos financieros.
- Categorías.
- Deudas.
- Pagos.
- Recordatorios.
- Cursos.
- Tareas.
- Metas.

### Integraciones externas

En versiones posteriores se conectará con:

- Google Sheets.
- WhatsApp Cloud API.
- Servicio de envío de correos o notificaciones.

## 3. Flujo general

```mermaid
flowchart TD
    A[Usuario] --> B[Frontend React]
    A --> C[WhatsApp]
    B --> D[Backend Node.js y Express]
    C --> E[Webhook de WhatsApp]
    E --> D
    D --> F[PostgreSQL]
    D --> G[Google Sheets]
    D --> H[Servicio de recordatorios]