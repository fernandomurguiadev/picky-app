# Proposal: Custom QR and Flyer PDF Generator for Merchants

## Intent
Empower merchants to bridge the online-offline gap by generating premium, printable PDF flyers featuring their store's QR code and matched to their chosen brand colors.

## Problem Context
Local stores depend heavily on physical customers scanning a QR code at tables, counters, or shop windows to browse the digital menu. Currently, merchants must use third-party websites to generate raw QR codes and manually paste them onto flyers. This is tedious and leads to unprofessional-looking designs. A built-in flyer generator makes onboarding seamless and boosts store adoption.

## Proposed Solution
- **Backend API**: Implement an endpoint `/api/v1/admin/store/qr-flyer` that returns a generated PDF buffer. The PDF layout will be generated dynamically on the server:
  - Generate a vector QR code pointing to the store's public URL (e.g. `https://picky.app/slug`) using a library like `qrcode`.
  - Draw a high-quality PDF page using `pdfkit` or a canvas-based tool.
  - Apply the tenant's brand styling: primary color, accent color, store name, and logo (if uploaded).
  - Include call-to-action text (e.g., "¡Escaneá y hacé tu pedido!" / "Scan and Order here").
- **Admin Panel UI**: Add a new promotional card under `Settings > Business Info` or a new section `Promoción/QR`.
  - Provide a preview mockup of the flyer.
  - Allow merchants to customize the Call-to-Action text.
  - A button "Descargar Flyer PDF" that triggers the download of the generated PDF.

## Scope
- **Backend (api)**:
  - Add dependency for `pdfkit` and `qrcode` (or node-canvas if necessary).
  - Create `FlyerGeneratorService` to generate the layout with colors and brand parameters.
  - Add endpoint `GET /api/v1/admin/store/qr-flyer` protected by admin auth middleware.
- **Frontend (app)**:
  - Create a flyer settings view inside the admin panel.
  - Fetch and download the binary PDF stream.
  - Display a visual CSS-based mockup preview of the flyer so the merchant sees what they are downloading.

## Out of Scope
- Multiple templates or layouts for the MVP. We will design one clean, modern, high-converting template.
- Editable graphic elements (like dragging text/images). The layout structure is fixed; only text/colors/logo are dynamic.

## Impacto en Multi-tenancy
- **Critical Security**: The backend endpoint must restrict access to the authenticated user's tenant. The generated QR code must strictly point to the URL containing the authenticated user's store slug. There must be zero chance of generating a flyer pointing to another tenant's store.

## Target Area
- **Panel Admin** (Generation trigger & settings)
- **Backend API** (PDF rendering)
- **Tienda Pública** (Target of the printed QR codes)
