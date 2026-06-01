# Despliegue en Producción: Picky App

Siguiendo tus lineamientos estrictos de infraestructura en Hostinger, aquí tenés todo lo necesario para montar el proyecto en `/root/picky-app/`.

## 1. Archivo `docker-compose.prod.yml`

Creá la carpeta `/root/picky-app/` en tu VPS y asegurate de tener este archivo y el `.env`. 

> [!WARNING]
> Asegurate de reemplazar los valores como `AQUI_TU_SECRET_KEY` o `AQUI_N8N_URL` con los datos reales en el `.env` antes de levantar los contenedores.

## 2. Comandos SQL (PostgreSQL Compartido)

Antes de levantar el stack, necesitás crear el usuario y la base de datos en tu contenedor `postgres` existente.

Ejecutá en la terminal de tu VPS:
```bash
docker exec -it postgres psql -U postgres
```

Y pegá estos comandos en la consola de PostgreSQL:
```sql
CREATE DATABASE picky_db;
CREATE USER picky_user WITH ENCRYPTED PASSWORD '#PickyPass2026';
GRANT ALL PRIVILEGES ON DATABASE picky_db TO picky_user;
-- Dar permisos sobre el schema public conectado a la DB
\c picky_db
GRANT ALL ON SCHEMA public TO picky_user;
```

## 3. Instrucciones para Nginx Proxy Manager

Ingresá al panel de Nginx Proxy Manager (puerto `81`) y configurá los siguientes dos Proxy Hosts:

### A) Frontend (La aplicación)
- **Domain Names**: `picky.orbitech.cloud`
- **Scheme**: `http`
- **Forward Hostname / IP**: `picky_app`
- **Forward Port**: `2000`
- **Cache Assets**: Activo
- **Block Common Exploits**: Activo
- **Websockets Support**: Desactivado
- **SSL**: Solicitar un nuevo certificado con Let's Encrypt, forzar SSL.

### B) Backend (La API)
- **Domain Names**: `api.picky.orbitech.cloud`
- **Scheme**: `http`
- **Forward Hostname / IP**: `picky_api`
- **Forward Port**: `1000`
- **Cache Assets**: Desactivado
- **Block Common Exploits**: Activo
- **Websockets Support**: Activo (crucial si usás WebSockets/Socket.io en NestJS)
- **SSL**: Solicitar un nuevo certificado con Let's Encrypt, forzar SSL.

## 4. Registros DNS en Hostinger

En el panel de dominios de Hostinger, agregá estos dos registros A:

| Tipo | Nombre (Subdominio) | Apunta a (IP) | TTL |
|------|---------------------|---------------|-----|
| A    | picky               | 72.60.251.126 | Auto |
| A    | api.picky           | 72.60.251.126 | Auto |

---
**Flujo de despliegue sugerido:**
1. Hacé `git clone` de tu proyecto en `/root/picky-app/` (o subí los archivos por FTP/SSH).
2. Asegurate de tener `docker-compose.prod.yml` y `.env` listos.
3. Ejecutá `docker compose -f docker-compose.prod.yml up -d --build` para compilar las imágenes directamente en el VPS y dejarlas corriendo.
