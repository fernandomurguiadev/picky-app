# Proposal — api-fase-4-upload

## Resumen

Módulo de upload de imágenes para logos de tienda y fotos de productos.
Endpoint autenticado que recibe `multipart/form-data`, valida tipo MIME y tamaño,
y sube el archivo a Cloudinary (o S3) devolviendo la URL pública y el `publicId`.

## Motivación

Categorías y productos tienen campo `imageUrl`. Sin un endpoint de upload ese campo
sólo puede setearse con URLs externas. El upload propio permite al admin subir imágenes
directamente desde el panel sin depender de servicios de terceros para hosting.

## Alcance

### Backend (`api/`)

- `modules/upload/upload.controller.ts` — `POST /upload/image` con Multer + JWT
- `modules/upload/upload.service.ts` — validación y upload a provider
- `modules/upload/upload.module.ts` — módulo NestJS
- `modules/upload/dto/upload-response.dto.ts` — respuesta tipada `{ url, publicId }`
- `modules/upload/providers/cloudinary.provider.ts` — configuración del SDK
- `config/env.config.ts` — agregar vars de Cloudinary/S3
- `app.module.ts` — registrar `UploadModule`

### No incluido

- UI de upload en frontend (FASE posterior)
- Eliminación de imágenes antiguas al reemplazar (mejora futura)

## Rutas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/upload/image` | JWT | Sube una imagen, retorna `{ url, publicId }` |

## Restricciones de seguridad

- Validar tipo MIME inspeccionando los primeros bytes del buffer (magic bytes) — NO confiar en la extensión ni en el `Content-Type` del request
- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
- Tamaño máximo: 5 MB
- Carpeta en Cloudinary: `tenants/{tenantId}/` — aislación por tenant
- Solo usuarios autenticados pueden subir (JWT requerido)

## Variables de entorno necesarias

```
STORAGE_PROVIDER=cloudinary   # cloudinary | s3
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Criterios de aceptación

- `POST /upload/image` sin JWT retorna 401
- Subir un `.exe` renombrado como `.jpg` retorna 400 (MIME inválido)
- Subir un PNG de 6 MB retorna 413
- Upload exitoso retorna `{ url: "https://res.cloudinary.com/...", publicId: "tenants/xxx/..." }`
