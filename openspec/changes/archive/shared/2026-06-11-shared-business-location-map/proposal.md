# Proposal: Mapa de Ubicación del Negocio (via URL de embed)

## Intent

Permitir que el comerciante pegue una URL de embed de Google Maps (o cualquier otro servicio) para mostrar su ubicación en la tienda pública. Si el enlace cambia, el comerciante lo actualiza él mismo desde Settings.

## Solución

Un campo de texto simple en `Settings > Información general` donde el comerciante pega la URL de embed de su mapa. La tienda pública renderiza esa URL dentro de un `<iframe>`.

Sin librerías externas. Sin geocoding. Sin API keys.

## Cómo obtener la URL de embed en Google Maps

1. Buscar el negocio en `maps.google.com`
2. Click en **Compartir** → pestaña **Insertar un mapa**
3. Copiar solo el valor del atributo `src="..."` del código HTML generado
4. Pegar ese valor en el campo de Settings

La URL resultante tiene la forma:
```
https://www.google.com/maps/embed?pb=!1m18!1m12!...
```

Esta URL es pública, gratuita, no requiere API key y funciona indefinidamente en iframes.

## Scope

### Backend (`api/`)
- Agregar columna `mapsEmbedUrl: varchar(2000)` nullable a `TenantSettings` entity → **requiere migration:generate**
- Incluir en el DTO y mapper del endpoint existente `GET/PATCH /api/v1/admin/store/settings`

### Frontend Admin (`app/`)
- Agregar campo `mapsEmbedUrl` al formulario de `Settings > Información general`
- Input de tipo `url` con placeholder de ejemplo y texto de ayuda explicando cómo obtener la URL desde Google Maps
- Preview inline del iframe al pegar una URL válida (opcional para MVP)

### Frontend Tienda Pública (`app/`)
- Mostrar sección **"Dónde encontrarnos"** al final de la página del negocio solo cuando `mapsEmbedUrl` esté configurado
- Renderizar un `<iframe>` con `src={mapsEmbedUrl}` y atributos de seguridad (`referrerpolicy`, `loading="lazy"`)

## Fuera de Scope
- Validación del dominio de la URL (el comerciante es responsable de pegar una URL válida)
- Geocoding automático
- Librería de mapas (Leaflet, Mapbox, etc.)

## Target Area
- **Panel Admin** — `Settings > Información general` (nuevo campo en formulario existente)
- **API** — extensión del endpoint existente de settings (un campo nuevo)
- **Tienda Pública** — sección de ubicación condicional al final del store
