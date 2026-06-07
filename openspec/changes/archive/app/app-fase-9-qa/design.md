# Design — app-fase-9-qa

## Checklist de verificación

### Seguridad (QA-5, QA-6, QA-8)

```bash
# QA-5: Buscar tokens en localStorage/sessionStorage
grep -r "localStorage.setItem" app/src --include="*.tsx" --include="*.ts"
grep -r "sessionStorage.setItem" app/src --include="*.tsx" --include="*.ts"
# Resultado esperado: solo 'cart-storage' — ningún 'token', 'access_token', etc.

# QA-6: dangerouslySetInnerHTML (solo debe existir en store layout)
grep -r "dangerouslySetInnerHTML" app/src --include="*.tsx" --include="*.ts"
# Resultado esperado: solo app/(store)/[slug]/layout.tsx (CSS variables del servidor)

# QA-8: Formularios con noValidate
grep -r "<form" app/src --include="*.tsx" | grep -v "noValidate"
# Resultado esperado: 0 líneas (todos los forms deben tener noValidate)
```

---

### Performance (QA-3)

1. Ejecutar `npm run build` en `app/`
2. Levantar con `npm start`
3. Abrir Chrome → DevTools → Lighthouse
4. Auditar `/[slug]` (home de tienda) en modo Mobile
5. Verificar LCP < 2.5s

Posibles causas de LCP alto y soluciones:
- Imagen del hero sin `priority` prop → agregar `priority` al primer `Image`
- Fuentes sin `preconnect` → agregar en `layout.tsx`
- Fetch waterfall en layout → asegurar `Promise.all` en lugar de secuencial

---

### Anti-FOUC (QA-2)

1. Ir a `/admin/settings/theme` y cambiar el color primario
2. Recargar la tienda pública (`/[slug]`)
3. Usar Chrome DevTools → Performance → grabación de carga
4. Verificar que el primer frame tiene el color correcto

Si hay FOUC: verificar que el `<style dangerouslySetInnerHTML>` está antes que cualquier
stylesheet externo en el `<head>`.

---

### Viewport 360px (QA-1)

Checklist por pantalla:

| Pantalla | Verificar |
|----------|-----------|
| `/auth/login` | Formulario completo visible, sin overflow |
| `/[slug]` | Grilla 2 cols, sin scroll horizontal |
| `/[slug]/checkout` | Pasos accesibles, botones con tamaño táctil ≥ 44px |
| `/admin/catalog/categories` | Cards completas, DnD accesible |
| `/admin/orders` | Columnas del kanban accesibles por scroll horizontal |
| `/admin/settings` | Tabs scrolleables, formularios funcionales |

---

### Tiempo real Kanban (QA-4)

1. Abrir `/admin/orders` en una pestaña
2. Abrir la tienda pública en otra pestaña
3. Completar un checkout
4. Medir tiempo hasta que el pedido aparece en el kanban
5. Objetivo: < 500ms en red local

Si el tiempo es alto: verificar que `useWebSocket` invalida correctamente la query.
