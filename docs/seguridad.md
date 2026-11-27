# Seguridad y credenciales

## Configuración de la aplicación

Completa las variables de `backend/.env.example` en el sistema de secretos del entorno. En desarrollo se puede utilizar `backend/.env`, que Git ignora. Genera 32 bytes aleatorios y configura `JWT_SECRET` como 64 dígitos hexadecimales. Usa HTTPS fuera de loopback y configura `CORS_ORIGINS` con los orígenes HTTPS exactos del frontend. El tiempo de sesión predeterminado es de ocho horas y se puede ajustar hasta siete días.

La API firma JWT con HS256 y valida emisor, vigencia y versión de la contraseña. Cambiar la contraseña invalida todos los tokens anteriores y pide iniciar sesión de nuevo en el navegador. El despliegue de este cambio también requiere iniciar sesión de nuevo, debido al formato de token actualizado. Cerrar sesión borra el token de la pestaña. Si una copia del token salió de esa pestaña, permanece válida hasta su expiración, un cambio de contraseña o una rotación del secreto.

El navegador conserva el token en `sessionStorage` y reinicia el panel al cambiar de sesión. Las respuestas sensibles llevan `Cache-Control: no-store`. Los límites de registro y autenticación cuentan por IP y por proceso, con una ventana de 15 minutos. Si se despliega tras un proxy, revisa los límites con la topología real antes de confiar encabezados de IP reenviados.

## Contraseñas heredadas

1. En una ventana de mantenimiento, confirma el destino autorizado y prepara un respaldo cifrado cuya restauración se haya comprobado. Repite primero el procedimiento con datos sintéticos.
2. Desde `backend`, con una credencial restringida a la tarea, ejecuta `node scripts/legacy-passwords.js --scan NOMBRE_EXACTO`. El informe contiene solo totales.
3. Si `needsReview` es mayor que cero, pausa el cambio. Los valores vacíos, de formato ambiguo o mayores a 72 bytes requieren recuperación individual con identidad verificada y una clave nueva por un canal seguro. Evita truncar, copiar o enviar el valor original. El modo de escritura se bloquea ante esos casos.
4. Si el recuento es revisable y la intervención fue aprobada, ejecuta `node scripts/legacy-passwords.js --apply NOMBRE_EXACTO`. Cada actualización comprueba que el valor siga siendo el observado. Si hay cambios concurrentes, vuelve a revisar antes de habilitar el acceso.
5. Ejecuta el escaneo de nuevo y confirma `legacy = 0` antes de desplegar. La API acepta hashes bcrypt y limita las contraseñas nuevas a 72 bytes UTF-8. Si una cuenta antigua se creó con bcrypt a partir de una clave más larga, verifica su identidad y solicita el cambio de clave. El hash histórico no permite deducir la longitud original.

Los respaldos históricos anteriores a la conversión pueden contener valores en texto plano. Conserva su acceso restringido y aplica la política de retención. Si la cuenta del seed anterior llegó a crearse, coordina su rotación con el operador. Eliminar el literal del código actual no revoca la credencial histórica.

## Demostración aislada

Usa una base dedicada de desarrollo o pruebas. Desde `backend`, ejecuta `node prisma/seed.js` con `NODE_ENV` en `development` o `test`, `DEMO_SEED=1`, un `DEMO_EMAIL` con dominio `example.test` y una `DEMO_PASSWORD` aleatoria de al menos 16 caracteres y hasta 72 bytes. Inyecta esos valores en el entorno. El usuario y sus datos sintéticos se pueden preparar de nuevo con los mismos valores sin duplicarlos.
