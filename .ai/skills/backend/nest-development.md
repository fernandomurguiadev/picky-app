---
name: nest-development
description: Patrones NestJS para PickyApp — arquitectura hexagonal, SOLID, inyección de dependencias, estructura de módulo.
version: "1.0"
used_by:
  - backend-agent  # base de todo desarrollo en api
---

# 🚀 NestJS Development Patterns

Guía para el desarrollo de APIs robustas usando NestJS en el Monorepo.

## 📋 Reglas de Oro
1. **Arquitectura Hexagonal**: Mantener la lógica de negocio en servicios, desacoplada de los controladores.
2. **DTOs Estrictos**: Usar `class-validator` y `class-transformer` en todos los endpoints.
3. **Inyección de Dependencias**: Seguir el principio de inversión de dependencia (SOLID).

## 🛠️ Estructura de Módulo
- `*.controller.ts`: Orquestación de requests.
- `*.service.ts`: Lógica de negocio core.
- `*.module.ts`: Definición de providers e imports.
- `dto/*.dto.ts`: Contratos de entrada/salida.
