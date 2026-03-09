# [KAN-28] Permisos por Rol y Casino

**Estado**: Por hacer  
**Prioridad**: High  
**Tipo**: Historia  
**Creado**: 2026-03-09  

## 📝 Descripción (Historias de Usuario)

### 🎯 Objetivo de Negocio
Prevenir escalada de privilegios horizontal (entre casinos) y vertical (entre roles).

### 📦 Alcance
- Matriz de Permisos (ACL).
- Guards en Backend.

### ✅ Criterios de Aceptación
- [ ] Test: Admin Casino A intenta ver usuarios de Casino B -> 403 Forbidden.
- [ ] Test: Agente intenta crear Admin Casino -> 403 Forbidden.

### 🧩 Desglose Técnico
| ID | Título | Capa |
|----|--------|------|
| BE-1.04 | Matriz de Permisos y Guards | Backend |

---

## 🔗 Sub-tareas Relacionadas

- [KAN-29] Matriz de Permisos y Guards

---

## ⚙️ Detalles de Sincronización
- **Jira Key**: KAN-28
- **Reporter**: Cristian Almendras
- **Sincronizado por**: Jira Agent (Trae AI)
- **Fecha de Sincronización**: 2026-03-09 02:45

> ### 📎 Context Packet [KAN-28]
> - **Decisión Crítica**: La sincronización se realizó exitosamente desde Jira Cloud. Se ha identificado que esta tarea es puramente de Backend (Guards y ACL).
> - **Bloqueo Detectado**: Ninguno. La tarea está lista para planificación técnica.
> - **Siguiente Acción Sugerida**: @TechAgent, inicia la creación del Master Plan enfocándote en la integración con el sistema multi-tenant actual.
