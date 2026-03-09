## Archivos requeridos en control de versiones

Los siguientes archivos deben estar commiteados antes del primer deploy:

- [ ] router-agent.md
- [ ] supervisor-agent.md
- [ ] jira-reader-agent.md
- [ ] jira-writer-agent.md
- [ ] HANDSHAKE_PROTOCOL.md (con todas las correcciones aplicadas)
- [ ] AGENTS.md
- [ ] WORKSPACE_GUIDE.md
- [ ] COMMIT-CHECKLIST.md (este archivo)

### Por qué es obligatorio
Sin estos archivos en git:
- El equipo no puede hacer code review de cambios en el comportamiento de agentes
- No hay historial de por qué se tomó cada decisión de diseño
- No es posible hacer rollback a una versión anterior del comportamiento del sistema
