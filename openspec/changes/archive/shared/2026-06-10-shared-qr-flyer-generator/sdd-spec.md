# SDD Spec: QR Flyer PDF Generator

## Identificador
`2026-06-10-shared-qr-flyer-generator`

## Objetivo
Permitir que cada dueño de tenant genere y descargue un flyer PDF premium con el QR de su tienda, nombre del comercio, colores de marca y texto CTA personalizable.

## Decisiones técnicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| Generación PDF | `pdfkit` | Liviano, sin dependencias de sistema, API imperativa suficiente para 1 template fijo |
| Generación QR | `qrcode` (ya instalado) | Ya presente en el backend (MFA), evita nueva dependencia |
| Preview frontend | `qrcode` browser build | Mismo paquete, funciona en cliente via webpack |
| Endpoint | `GET /api/v1/stores/me/qr-flyer` | Sigue convención `/stores/me/*` del módulo tenants |
| Módulo | `api/src/modules/qr-flyer/` separado | No contamina TenantsModule; reutiliza sus entities via import |
| Descarga binaria | `@Res()` Express directo | Evita que TransformInterceptor envuelva el buffer en `{ data, meta }` |

## API Endpoint

```
GET /api/v1/stores/me/qr-flyer
Authorization: Bearer <access-token> (JwtAuthGuard)
```

**Response:**
```
HTTP 200
Content-Type: application/pdf
Content-Disposition: attachment; filename="flyer-qr.pdf"
Content-Length: <bytes>
Body: <PDF binario A5>
```

**Error:** 404 si el tenant no existe; 500 si pdfkit falla.

## Seguridad (Multi-tenancy)

- `@UseGuards(JwtAuthGuard)` obliga JWT válido.
- `@TenantId()` inyecta el tenantId del token — nunca viene del body/query.
- `@RlsRunner()` propaga el contexto RLS para las queries de Tenant y StoreSettings.
- El QR apunta a `https://picky.app/{tenant.slug}` obtenido de la BD con el tenantId del JWT. Zero chance de generar QR de otro tenant.

## Layout PDF (A5 portrait — 419.5 × 595.3 pt)

```
┌─────────────────────────────────┐
│  [fondo primaryColor]           │
│  ┌─────────────────────────┐    │
│  │  [card accentColor]     │    │  ← margen 30pt, border-radius 16
│  │                         │    │
│  │  [LOGO 72×72 centrado]  │    │  ← si logoUrl no nulo
│  │  [NOMBRE TIENDA 22pt]   │    │
│  │  ┌───────────────────┐  │    │
│  │  │    QR CODE        │  │    │  ← 200×200, primaryColor dark / #fff light
│  │  │    200 × 200      │  │    │
│  │  └───────────────────┘  │    │
│  │  [CTA TEXT 13pt bold]   │    │  ← customCtaText o default
│  │  [picky.app/slug 9pt]   │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Datos usados:**
- `Tenant.slug` → URL del QR y hint inferior
- `Tenant.name` → nombre de la tienda
- `StoreSettings.primaryColor` → fondo exterior + color QR dark
- `StoreSettings.accentColor` → fondo card + color QR light (`#ffffff` siempre para legibilidad)
- `StoreSettings.logoUrl` → logo (fetch remoto; si falla o null, se omite)
- `StoreSettings.customCtaText` → CTA (default: `¡Escaneá y hacé tu pedido!`)

## Archivos del backend

```
api/src/modules/qr-flyer/
├── qr-flyer.module.ts
├── qr-flyer.controller.ts
└── qr-flyer.service.ts
```

**Dependencias instaladas:**
- `pdfkit` + `@types/pdfkit` → `api/package.json`

## Archivos del frontend

```
app/src/
├── lib/hooks/admin/use-qr-flyer.ts          ← hook de descarga
└── app/(admin)/admin/settings/qr-flyer/
    └── page.tsx                              ← preview + botón descarga
```

**Dependencias instaladas:**
- `qrcode` + `@types/qrcode` → `app/package.json`

**Nav:** `layout.tsx` de settings agrega `{ href: "/admin/settings/qr-flyer", label: "QR / Flyer" }`.

## Preview frontend

Componente CSS que replica el diseño del PDF en pantalla:
- Outer div con `backgroundColor: primaryColor`
- Inner card con `backgroundColor: accentColor`, border-radius, shadow
- `<img>` con `src` generado por `QRCode.toDataURL()` client-side
- Logo del comercio si disponible
- Botón "Descargar Flyer PDF" → `fetch('/api/backend/api/v1/stores/me/qr-flyer')` → Blob → `<a download>`

## Out of scope (MVP)

- Múltiples templates
- Edición del layout (drag & drop)
- Vista previa del PDF renderizado (se hace en CSS)
- Selección de formato de papel
