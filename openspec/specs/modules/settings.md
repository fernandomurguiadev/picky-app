# Módulo MOD-04: Configuración de la Tienda

## 1. Visión General
El módulo de Configuración de la Tienda permite al administrador personalizar la identidad visual, horarios, formas de entrega y métodos de pago de su comercio.

## 2. Funcionalidades (Back-office)

| ID | Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **S-001** | **Información básica** | Nombre, logo, WhatsApp, teléfono, dirección. | Alta |
| **S-002** | **Redes sociales** | Links a Instagram, Facebook, TikTok. | Media |
| **S-003** | **Horarios de atención** | Configuración por día, activo/inactivo, 2 turnos por día. | Alta |
| **S-004** | **Formas de entrega** | Delivery, Take Away, Consumir local, costo fijo de envío. | Alta |
| **S-005** | **Métodos de pago** | Efectivo, Transferencia, Otro, recargo/descuento porcentual. | Alta |
| **S-006** | **Monto mínimo** | Input numérico de monto mínimo para realizar pedidos. | Media |
| **S-007** | **Tema visual** | Selector de color primario y acento con preview. | Alta |
| **S-008** | **Anuncios en tienda** | Crear/editar/eliminar anuncios tipo banner. | Media |
| **S-009** | **URL de la tienda** | Mostrar la URL pública, botón copiar, botón generar QR. | Alta |
| **S-010** | **Vista previa** | Botón 'Ver mi tienda' que abre la URL pública. | Alta |

## 3. Modelo de Datos (Dominio)

### StoreSettings
```typescript
export interface StoreSettings {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  logoUrl: string;
  whatsapp: string;
  phone: string;
  email?: string;
  address?: StoreAddress;
  socialLinks: SocialLinks;
  hours: BusinessHours;
  deliveryConfig: DeliveryConfig;
  paymentMethods: PaymentMethodConfig[];
  theme: ThemeConfig;
  announcements: Announcement[];
}
```

## 4. Especificaciones Técnicas (Next.js 15)

### Arquitectura de Rutas (`app/`)
- `(admin)/dashboard/settings/page.tsx`: Formulario centralizado dividido por pestañas (`tabs` de shadcn/ui).
- `(admin)/dashboard/settings/theme/page.tsx`: Editor de temas interactivo con previsualización integrada iframe.

### Componentes de Interfaz (RCC)
- `StoreInfoForm`: Formulario controlado de React Hook Form con inputs de texto y textarea.
- `HoursScheduler`: Matriz interactiva para activar/desactivar días e ingresar rangos temporales (Horas:Minutos).
- `ThemeColorPicker`: Integra una paleta y genera variables HSL dinámicas.
- `TenantLivePreview`: Componente iframe que renderiza temporalmente `/(store)/[slug]?preview=true` con los colores en memoria sin impactar BD.

### Mecanismo de Inyección de Tema (SSR / CSS Variables)
- La tienda pública consume `StoreSettings.theme` en `layout.tsx` (Server Component).
- Se renderiza un bloque `<style>` embebido en el `<head>` mapeando el color primario a variables Tailwind CSS v4 (`--color-primary`, `--color-primary-foreground`).
- Esto garantiza **cero parpadeo (no-FOUC)** al cargar en el cliente móvil.


## 5. Criterios de Aceptación
- CA-001: Al guardar un cambio en la configuración, este persiste en la base de datos.
- CA-002: El color primario configurado se aplica correctamente en la tienda pública.
- CA-003: El estado de la tienda (abierto/cerrado) es correcto según los horarios.
- CA-004: El QR generado es válido y apunta a la URL correcta.
