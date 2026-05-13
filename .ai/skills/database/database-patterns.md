---
name: database-patterns
description: Patrones de persistencia TypeORM en PickyApp — migraciones, diseño de entidades, optimización de queries y Redis.
version: "1.0"
used_by:
  - db-agent       # gestión de migraciones, entidades y queries
  - backend-agent  # diseño de entidades dentro de módulos de dominio
---

# 🗄️ Database & TypeORM Skills

Instrucciones para la gestión de persistencia en PickyApp.

## 📋 Reglas de Oro
1. **Migrations First**: Nunca modificar la DB manualmente. Usar siempre migraciones de TypeORM.
2. **Entity Design**: Definir relaciones claras y usar decoradores de validación.
3. **Query Optimization**: Evitar N+1 queries. Usar `relations` o `queryBuilder` de forma consciente.

## 🛠️ Flujo de Migración
1. Crear la entidad o modificarla.
2. `npm run migration:generate --name=Name`
3. Revisar el SQL generado antes de aplicar.
