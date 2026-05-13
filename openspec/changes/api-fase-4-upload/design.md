# Design — api-fase-4-upload

## Estructura de archivos resultante

```
api/
└── src/
    └── modules/
        └── upload/
            ├── dto/
            │   └── upload-response.dto.ts     ← NUEVO
            ├── providers/
            │   └── cloudinary.provider.ts     ← NUEVO
            ├── upload.controller.ts           ← NUEVO
            ├── upload.service.ts              ← NUEVO
            └── upload.module.ts               ← NUEVO
```

---

## Dependencias a instalar

```bash
npm install cloudinary multer
npm install -D @types/multer
```

---

## Constantes de validación

```typescript
// upload.service.ts
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Magic bytes para detección real del tipo MIME
const MAGIC_BYTES: Record<string, string> = {
  'ffd8ff': 'image/jpeg',       // JPEG
  '89504e47': 'image/png',      // PNG
  '52494646': 'image/webp',     // WEBP (RIFF....WEBP)
};
```

---

## `cloudinary.provider.ts`

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => {
    cloudinary.config({
      cloud_name: cfg.getOrThrow('CLOUDINARY_CLOUD_NAME'),
      api_key:    cfg.getOrThrow('CLOUDINARY_API_KEY'),
      api_secret: cfg.getOrThrow('CLOUDINARY_API_SECRET'),
    });
    return cloudinary;
  },
};
```

---

## `upload.service.ts`

```typescript
@Injectable()
export class UploadService {
  constructor(@Inject(CLOUDINARY) private readonly cloudinary: typeof v2) {}

  async uploadImage(
    file: Express.Multer.File,
    tenantId: string,
  ): Promise<{ url: string; publicId: string }> {
    // 1. Validar tamaño
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException('La imagen supera el límite de 5 MB.');
    }

    // 2. Detectar MIME real desde magic bytes
    const detectedMime = this.detectMime(file.buffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Se aceptan: jpg, png, webp.`,
      );
    }

    // 3. Subir a Cloudinary desde buffer (stream)
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: `tenants/${tenantId}`,
          resource_type: 'image',
          allowed_formats: ['jpg', 'png', 'webp'],
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  private detectMime(buffer: Buffer): string | null {
    const hex = buffer.subarray(0, 4).toString('hex');
    for (const [magic, mime] of Object.entries(MAGIC_BYTES)) {
      if (hex.startsWith(magic)) return mime;
    }
    return null;
  }
}
```

---

## `upload.controller.ts`

```typescript
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @TenantId() tenantId: string,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo.');
    return this.uploadService.uploadImage(file, tenantId);
  }
}
```

---

## `upload.module.ts`

```typescript
@Module({
  providers: [CloudinaryProvider, UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
```

---

## Variables de entorno (agregar a `env.config.ts`)

```typescript
CLOUDINARY_CLOUD_NAME: z.string().min(1),
CLOUDINARY_API_KEY:    z.string().min(1),
CLOUDINARY_API_SECRET: z.string().min(1),
```

---

## Respuesta exitosa

```json
{
  "data": {
    "url": "https://res.cloudinary.com/demo/image/upload/v1234/tenants/abc-123/xyz.webp",
    "publicId": "tenants/abc-123/xyz"
  },
  "meta": { "timestamp": "2026-05-13T12:00:00.000Z" }
}
```

---

## Errores posibles

| Caso | Status | Code |
|------|--------|------|
| Sin JWT | 401 | `UNAUTHORIZED` |
| Sin archivo en el body | 400 | `BAD_REQUEST` |
| Tipo MIME inválido | 400 | `BAD_REQUEST` |
| Tamaño > 5 MB | 413 | `PAYLOAD_TOO_LARGE` |
| Error Cloudinary | 500 | `INTERNAL_SERVER_ERROR` |
