# Etapa 5. Perfilado y aceptación final

## Entorno y protocolo

Ejecuciones en Windows x64, AMD Ryzen 7 5700G, 16 procesadores lógicos y 14 GiB visibles, con Node.js 22.19.0, PostgreSQL 18.3, Prisma 6.19.3, Vite 8.3.0 y Edge headless 158.0.4370.45. La aplicación compilada y la base temporal se comunicaron por loopback.

La aceptación mantuvo el mismo archivo de prueba, con 1000 movimientos de un propietario y 25 de otro. Para cada ruta se realizaron diez solicitudes y se validó que el JSON contuviera solo los recursos esperados. Cada ejecución del panel hizo siete aperturas en la misma pestaña. El cronómetro comenzó antes de confirmar el acceso y terminó tras renderizar las 1000 filas y esperar dos cuadros de animación. El límite se comprobó contra el máximo de todas las muestras. El blob Git del archivo de aceptación que se conservó es `ff0ab4369d302ccf5c43c8a9df2d9f343c3c6792`.

## Diagnóstico de CPU, DOM y memoria

`--profile` mide un escenario sintético equivalente. Usa Chrome DevTools Protocol para muestrear CPU, medir tiempos de ejecución de scripts y layout, y consultar el heap de JavaScript y los contadores DOM. Instrumenta las construcciones de `Intl` en la página de pruebas. En Windows también suma los bytes privados de los renderizadores del navegador temporal. Este diagnóstico tiene su propia instrumentación y sus tiempos no se usan para aceptar el umbral.

| Métrica del perfil | Antes | Después |
|---|---:|---:|
| Construcciones de `Intl.DateTimeFormat` por apertura medida | 3014 | 14 |
| Construcciones de `Intl.NumberFormat` por apertura medida | 1021 | 0 |
| Tiempo de construcción de formateadores de fecha por apertura | 187,50–253,90 ms | 0,90–1,50 ms |
| Tiempo máximo de scripts de la ventana medida | 1839,44 ms | 616,91 ms |
| Máximo de nodos registrados por el renderizador | 126 085 | 80 497 |
| Pico de memoria privada de los renderizadores | 594,75 MiB | 403,88 MiB |
| Memoria privada tras salir y solicitar GC al final | 175,48 MiB | 139,27 MiB |

Antes del ajuste, las 1000 filas provocaban tres construcciones de fecha por fila y un formateador de moneda por importe. El número de construcciones se mantuvo constante entre aperturas. En cambio, el costo nativo de montar el DOM creció con los nodos pendientes de recolección. Al pasar de la primera a la quinta apertura, el tiempo de scripts subió de 380,38 a 1839,44 ms y el perfil de la quinta atribuyó aproximadamente 746 ms a `setAttribute` y 738 ms a `appendChild`. Al salir quedaron cero filas conectadas. El contador de nodos del renderizador llegó a 126 085 y descendió a 25 466 tras solicitar GC al final. El comportamiento muestra presión transitoria de memoria y trabajo creciente al reconstruir el DOM. La medición no atribuye la retención residual a una fuga permanente.

Un control diagnóstico solicitó GC después de cada cierre de sesión en la versión optimizada, fuera del intervalo de cada apertura. El contador después de cada salida se estabilizó en 25 466 nodos y el pico de memoria privada fue 184,03 MiB. Las seis aperturas posteriores a la primera tardaron entre 830,14 y 871,78 ms, con 226,25–235,87 ms de scripts. El control respalda que la acumulación entre recolecciones influye en el aumento entre aperturas. El producto y la aceptación funcionan con la recolección normal del navegador.

El ajuste reutiliza tres formateadores de fecha en `MovementItem.jsx` y uno de moneda en `formatMoney.js`. Conserva locale, moneda, opciones de fecha y contenido de cada fila. Los agregados del panel ya usan `useMemo` y los gráficos reciben resultados agrupados por mes o categoría. Se mantuvieron los gráficos, el estado por sesión y la presentación de las 1000 filas.

## Aceptación sin instrumentación

| Escenario | Inicial, máximo (ms) | Optimizada 1, p95 y máximo (ms) | Optimizada 2, p95 y máximo (ms) |
|---|---:|---:|---:|
| API de movimientos | 98,54 | 73,54 | 107,17 |
| API de cuentas | 21,56 | 16,11 | 21,22 |
| Panel de 1000 filas | **3871,64** | **2879,25** | **2548,99** |

El máximo del panel bajó un 25,6 % respecto al máximo inicial. Las 14 mediciones optimizadas quedaron dentro de 3000 ms. Las aperturas consecutivas todavía mostraron variación y el margen de la muestra más lenta fue de 120,75 ms. [Registro inicial](05-rendimiento-bloqueado.md)

| Serie | Mediciones en orden (ms) |
|---|---|
| Panel inicial | 1215,55 · 1145,63 · 1556,58 · 2226,29 · 2563,51 · 3871,64 · 3209,67 |
| Panel optimizado 1 | 1059,62 · 678,70 · 1048,71 · 1606,16 · 1951,14 · 2522,37 · 2879,25 |
| Panel optimizado 2 | 1606,36 · 867,08 · 1124,83 · 1665,85 · 1997,47 · 2204,04 · 2548,99 |
| API movimientos optimizada 1 | 68,96 · 59,73 · 61,68 · 57,09 · 59,21 · 73,54 · 62,22 · 55,91 · 56,59 · 52,71 |
| API movimientos optimizada 2 | 93,61 · 78,78 · 78,21 · 103,99 · 107,17 · 70,79 · 79,71 · 68,14 · 92,75 · 71,81 |
| API cuentas optimizada 1 | 13,26 · 16,11 · 12,32 · 11,48 · 11,43 · 11,16 · 11,49 · 10,52 · 10,47 · 13,85 |
| API cuentas optimizada 2 | 18,76 · 21,22 · 19,41 · 17,59 · 12,90 · 14,22 · 12,90 · 11,92 · 12,47 · 20,35 |

En la última ejecución, la consulta SQL representativa ordenó 1000 filas en 0,294 ms de ejecución, con 0,130 ms de planificación. Los tiempos HTTP incluyen además Express, Prisma, serialización y lectura del cuerpo.

## Regresión y guiones académicos

- Dos ejecuciones de `npm.cmd --prefix backend test -- --performance` terminaron con 29 aprobadas, 0 fallidas y 0 omitidas cada una. Se repitieron las comprobaciones de credenciales, sesiones, integridad referencial, roles, migraciones, mantenimiento y recuperación.
- Las nuevas pruebas en Edge compararon fecha y moneda con los formatos previos, comprobaron filtros, gráficos y el contenido de Excel, y ejecutaron el alta, edición y borrado de movimientos sintéticos. También probaron la revisión por voz con una transcripción simulada.
- Los guiones DDL y DML crearon seis tablas y verificaron que las operaciones de demostración se revirtieran. El saldo tras el ejemplo de actualización fue 250,00.
- `npm.cmd --prefix frontend run lint` y `npm.cmd --prefix frontend run build` salieron con código 0. Vite mantuvo un aviso de tamaño del paquete JavaScript, de 945,77 kB minificado.

El resultado se refiere al entorno ensayado. El acceso por redes externas, la concurrencia de varios usuarios y el reconocimiento de voz con un micrófono real quedan fuera de estas pruebas. [Comandos de reproducción](../../README.md) · [Informe académico](../entrega-academica.md)

Para repetir el control, configura `CONTROLA_PROFILE_COLLECT=1` únicamente en el proceso de diagnóstico y ejecuta `npm.cmd --prefix backend test -- --profile`.
