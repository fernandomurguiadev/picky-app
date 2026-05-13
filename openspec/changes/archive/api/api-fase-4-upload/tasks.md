# Tasks — api-fase-4-upload

## Fase de implementación: FASE 4 — Módulo Upload

---

### B4.1 — Instalar dependencias

- [x] Ejecutar `npm install cloudinary multer` en `api/`
- [x] Ejecutar `npm install -D @types/multer` en `api/`

**Criterio de done:** `import multer from 'multer'` y `import { v2 as cloudinary } from 'cloudinary'` compilan sin errores.

---

### B4.2 — Variables de entorno

- [x] Agregar a `api/src/config/env.config.ts` las vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` como `z.string().min(1)`
- [x] Agregar las mismas vars al archivo `.env.example`

**Criterio de done:** App falla al iniciar si falta alguna de las tres vars.

---

### B4.3 — `CloudinaryProvider`

- [x] Crear `api/src/modules/upload/providers/cloudinary.provider.ts`
- [x] Token `CLOUDINARY` como constante exportada
- [x] `useFactory` inyecta `ConfigService`, llama a `cloudinary.config(...)` con las tres vars y retorna la instancia `v2`

**Criterio de done:** Provider tipado, inyectable con `@Inject(CLOUDINARY)`.

---

### B4.4 — `UploadService`

- [x] Crear `api/src/modules/upload/upload.service.ts`
- [x] Constante `ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']`
- [x] Constante `MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024`
- [x] Método privado `detectMime(buffer: Buffer): string | null` usando magic bytes (no Content-Type)
  - `ffd8ff` → `image/jpeg`
  - `89504e47` → `image/png`
  - `52494646` → `image/webp`
- [x] Método `uploadImage(file, tenantId)`:
  1. Valida tamaño → `PayloadTooLargeException` si > 5 MB
  2. Detecta MIME → `BadRequestException` si no es tipo permitido
  3. Sube a Cloudinary con `upload_stream` al folder `tenants/{tenantId}`
  4. Retorna `{ url: result.secure_url, publicId: result.public_id }`

**Criterio de done:** Un PNG de 1 MB sube y retorna URL. Un `.exe` renombrado lanza 400.

---

### B4.5 — `UploadController`

- [x] Crear `api/src/modules/upload/upload.controller.ts`
- [x] `@Controller('upload')` + `@UseGuards(JwtAuthGuard)` a nivel de clase
- [x] `POST /upload/image` con `@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))`
- [x] Parámetro `@UploadedFile() file: Express.Multer.File`
- [x] Parámetro `@TenantId() tenantId: string`
- [x] Guard: si `!file` → `BadRequestException('No se recibió ningún archivo.')`
- [x] Delega a `uploadService.uploadImage(file, tenantId)`

**Criterio de done:** `POST /upload/image` sin JWT → 401. Con JWT y PNG válido → `{ url, publicId }`.

---

### B4.6 — `UploadModule`

- [x] Crear `api/src/modules/upload/upload.module.ts`
- [x] Providers: `CloudinaryProvider`, `UploadService`
- [x] Controllers: `UploadController`

---

### B4.7 — Registrar en `AppModule`

- [x] Importar `UploadModule` en `api/src/app.module.ts`

**Criterio de done:** `npm run typecheck` sin errores. Ruta disponible en el servidor.
