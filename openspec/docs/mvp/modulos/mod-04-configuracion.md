# MOD-04 — Configuración de la Tienda

> Origen: Frontend Admin + Backend Settings Module
> Rutas: `/admin/settings/*`

---

## 3.12 Tabla de funcionalidades

| ID | Funcionalidad | Descripción técnica | Ruta / Componente | Prio |
|----|--------------|---------------------|-------------------|------|
| S-001 | Información básica del negocio | Formulario RHF+Zod: nombre, descripción, logo, WhatsApp, teléfono, email, dirección. | /admin/settings/info | 🔴 |
| S-002 | Redes sociales | Links a Instagram, Facebook, TikTok. Validación de URL con Zod. | /admin/settings/info | 🟡 |
| S-003 | Horarios de atención | Configuración por día. Activo/inactivo. **2 turnos por día** (ver schema completo abajo). | /admin/settings/hours — HoursEditor | 🔴 |
| S-004 | Formas de entrega | Activar/desactivar: Delivery, Take Away, Consumir en el local. Configurar descripción, tiempo estimado, costo. | /admin/settings/delivery | 🔴 |
| S-005 | Métodos de pago | Activar/desactivar: Efectivo, Transferencia (CBU/alias), Otro. Recargo/descuento porcentual. | /admin/settings/payments | 🔴 |
| S-006 | Monto mínimo de pedido | Input numérico de monto mínimo. Por forma de entrega. | /admin/settings/delivery | 🔴 |
| S-007 | Tema visual | Color picker primario y acento. Preview en tiempo real. Aplica como CSS variables via TenantThemeService. | /admin/settings/theme — ThemeEditor | 🔴 |
| S-008 | Anuncios en tienda | CRUD de banners con texto y fondo configurable. | /admin/settings/announcements | 🟡 |
| S-009 | URL de la tienda | Mostrar URL pública. Copiar al portapapeles. Generar QR (PNG con qrcode npm package). | /admin/settings/store | 🟡 |
| S-010 | Vista previa de tienda | Botón 'Ver mi tienda' abre la URL pública en nueva pestaña. | Topbar del admin | 🟡 |

---

## 3.13 Schema de horarios — DaySchedule (NUEVO — gap crítico de v1)

Este schema no estaba definido en v1. El agente debe usarlo exactamente.

```typescript
// lib/types/settings.types.ts

export interface Shift {
  open: string   // formato "HH:mm" — ej: "09:00"
  close: string  // formato "HH:mm" — ej: "13:00"
}

export interface DaySchedule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
  isOpen: boolean
  shifts: Shift[]  // Máximo 2 turnos por día. Array vacío si isOpen = false.
}

export interface StoreHours {
  schedule: DaySchedule[]  // Siempre 7 elementos, uno por día
  timezone: string          // ej: "America/Argentina/Buenos_Aires"
}

// Ejemplo de datos para un comercio con horarios partido:
const exampleSchedule: StoreHours = {
  timezone: "America/Argentina/Buenos_Aires",
  schedule: [
    { dayOfWeek: 0, isOpen: false, shifts: [] },                                          // Domingo: cerrado
    { dayOfWeek: 1, isOpen: true,  shifts: [{ open: "09:00", close: "13:00" }, { open: "17:00", close: "21:00" }] }, // Lunes: partido
    { dayOfWeek: 2, isOpen: true,  shifts: [{ open: "09:00", close: "21:00" }] },         // Martes: corrido
    // ...etc
  ]
}
```

**Lógica de cálculo de estado abierto/cerrado:**

```typescript
// lib/utils/store-status.ts
import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

export function isStoreOpen(hours: StoreHours, now = new Date()): boolean {
  const zonedNow = toZonedTime(now, hours.timezone)
  const dayOfWeek = zonedNow.getDay()
  const currentTime = format(zonedNow, 'HH:mm')

  const today = hours.schedule.find(d => d.dayOfWeek === dayOfWeek)
  if (!today?.isOpen || today.shifts.length === 0) return false

  return today.shifts.some(shift => {
    return currentTime >= shift.open && currentTime <= shift.close
  })
}

export function getNextOpenTime(hours: StoreHours, now = new Date()): string | null {
  // Buscar el próximo turno de apertura en los próximos 7 días
  // Retorna string legible: "Hoy a las 17:00" / "Mañana a las 9:00" / "El lunes a las 9:00"
  // ... implementación
}
```

---

## 3.14 Manejo de sesión expirada durante operación (NUEVO — gap de v1)

Cuando el refresh token expira (7 días), el usuario puede estar editando un producto. Antes de redirigir al login, guardar el estado en localStorage.

```typescript
// lib/api/axios.ts
import axios from 'axios'
import { useAuthStore } from '@/lib/stores/auth.store'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true  // necesario para httpOnly cookie del refresh token
})

api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // Intentar renovar con refresh token (httpOnly cookie se envía automáticamente)
        const { data } = await axios.post('/auth/refresh', {}, { withCredentials: true })
        useAuthStore.getState().setAccessToken(data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch {
        // Refresh token expirado: guardar estado antes de redirigir
        const currentPath = window.location.pathname
        
        // Disparar evento para que los formularios guarden su estado
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
        
        // Guardar URL de retorno
        sessionStorage.setItem('auth:return-url', currentPath)
        
        useAuthStore.getState().clearAuth()
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// En ProductFormPage: escuchar el evento y guardar el borrador inmediatamente
useEffect(() => {
  const handler = () => {
    const values = form.getValues()
    localStorage.setItem(DRAFT_KEY(productId), JSON.stringify(values))
  }
  window.addEventListener('auth:session-expired', handler)
  return () => window.removeEventListener('auth:session-expired', handler)
}, [])
```
