# Propuesta: Integración de Logger Estructurado con Rotación Diaria

Esta propuesta detalla la integración de **Pino** en el backend para mejorar el rendimiento de los logs y la observabilidad tanto en desarrollo local como en producción.

## Contexto y Motivación
El logger por defecto de NestJS escribe de forma síncrona a la consola estándar sin formato estructurado. Esto representa un cuello de botella de rendimiento en entornos de alta demanda y dificulta el parseo en sistemas de agregación de logs en la nube. 

Además, se requería almacenar logs en disco persistente divididos de forma diaria en producción para su posterior análisis.

## Solución Propuesta
1. Reemplazar el motor del logger global con **Pino** y `nestjs-pino`.
2. Habilitar la escritura a `stdout` (consola JSON) y a un archivo local de rotación diaria (`pino-roll`) en el directorio `./logs` en producción.
3. Usar el volumen persistente de Docker Compose en producción para conservar los logs en el host.
4. Usar `pino-pretty` para formateo coloreado interactivo en desarrollo local.

## Cambios Realizados
- Instalación de `pino`, `nestjs-pino`, `pino-roll` y `pino-pretty` (dev).
- Modificación de [app.module.ts](file:///c:/Users/ferna/Documents/Repositorios/picky-app/api/src/app.module.ts) para registrar `LoggerModule`.
- Modificación de [main.ts](file:///c:/Users/ferna/Documents/Repositorios/picky-app/api/src/main.ts) para usar `app.useLogger(app.get(Logger))`.
- Modificación de [http-exception.filter.ts](file:///c:/Users/ferna/Documents/Repositorios/picky-app/api/src/common/filters/http-exception.filter.ts) para inyectar el `Logger` de pino.
- Modificación de [docker-compose.prod.yml](file:///c:/Users/ferna/Documents/Repositorios/picky-app/docker-compose.prod.yml) para añadir volumen de logs `./logs:/app/logs`.
