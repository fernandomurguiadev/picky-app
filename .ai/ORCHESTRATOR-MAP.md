graph TB

    %% =====================================
    %% ENTRY POINTS
    %% =====================================

    subgraph ENTRIES ["Entry Points por IDE"]

        direction TB

        CLAUDE["CLAUDE.md<br/>Claude Code"]

        TRAE[".trae/BRIDGE.md<br/>project-config.json<br/>Trae"]

        COPILOT[".github/copilot-instructions.md<br/>GitHub Copilot"]

        CURSOR[".cursor/<br/>No configurado"]

    end

    %% =====================================
    %% SHARED INFRA
    %% =====================================

    subgraph SHARED ["Infraestructura compartida"]

        direction TB

        REGISTRY[".atl/skill-registry.md<br/>Compact rules"]

        ENGRAM[("Engram MCP<br/>Persistencia ContextPacket")]

        PM["packet-manager.js<br/>merge + validate<br/>145 líneas | 14 tests"]

    end

    %% =====================================
    %% CORE
    %% =====================================

    subgraph CORE [".ai/ — Núcleo IDE-agnóstico"]

        direction TB

        BRIDGE["BRIDGE.md<br/>Handshake + Recovery"]

        %% =================================
        %% ORCHESTRATOR
        %% =================================

        subgraph ORCH ["Orquestador"]

            direction TB

            ROUTER["router-agent.md v3.0.0<br/>Owner: CONTROL fields"]

            EW["engram-write.md<br/>Safe write protocol"]

            ROUTER --> EW

        end

        %% =================================
        %% AGENTS
        %% =================================

        subgraph AGENTS ["Sub-agentes"]

            direction TB

            BE["Backend Agent<br/>v2.1.0"]

            FE["Frontend Agent"]

            DB["DB Agent<br/>v2.0.0"]

            OS["OpenSpec Agent<br/>v1.0.0"]

            SEC["Security Agent<br/>v1.0.0"]

        end

        %% =================================
        %% BACKEND SKILLS
        %% =================================

        subgraph SKILLS_BACK [".ai/skills/backend/"]

            direction TB

            SB1["nest-development<br/>dto-patterns<br/>auth-patterns"]

            SB2["tenant-patterns<br/>error-patterns<br/>code-review"]

            SB3["security-patterns"]

        end

        %% =================================
        %% FRONTEND SKILLS
        %% =================================

        subgraph SKILLS_FRONT [".ai/skills/frontend/"]

            direction TB

            SF1["create-component<br/>create-page<br/>create-hook<br/>create-form<br/>create-endpoint"]

            SF2["code-reviewer<br/>lint-verifier<br/>pr-review"]

            SF3["security-patterns"]

            SF4["jira-ticket-to<br/>sync-editor-skills"]

        end

        %% =================================
        %% DB SKILLS
        %% =================================

        subgraph SKILLS_DB [".ai/skills/database/"]

            direction TB

            SD["database-patterns"]

        end

        %% =================================
        %% OPENSPEC SKILLS
        %% =================================

        subgraph SKILLS_OS [".ai/skills/openspec/"]

            direction TB

            SO["openspec-explore<br/>openspec-propose<br/>openspec-apply-change<br/>openspec-archive-change<br/>openspec-commit"]

        end

    end

    %% =====================================
    %% ENTRY → CORE
    %% =====================================

    CLAUDE --> BRIDGE
    TRAE --> BRIDGE
    COPILOT -.-> BRIDGE
    CURSOR -.-> BRIDGE

    CLAUDE --> REGISTRY
    TRAE --> REGISTRY

    %% =====================================
    %% ORCHESTRATION
    %% =====================================

    BRIDGE --> ROUTER

    ROUTER -->|"scope: api"| BE

    ROUTER -->|"scope: app"| FE

    ROUTER -->|"scope: migration/entity/sql"| DB

    ROUTER -->|"scope: openspec"| OS

    ROUTER -->|"scope: security"| SEC

    %% =====================================
    %% AGENT → SKILLS
    %% =====================================

    BE --> SB1
    BE --> SB2
    BE --> SB3

    FE --> SF1
    FE --> SF2
    FE --> SF3
    FE --> SF4

    DB --> SD

    OS --> SO

    %% =====================================
    %% CROSS-AGENT COORDINATION
    %% =====================================

    OS -->|"dispatch implementation"| BE

    OS -->|"dispatch implementation"| FE

    SEC -->|"security implementation api"| BE

    SEC -->|"security implementation app"| FE

    %% =====================================
    %% STATE MANAGEMENT
    %% =====================================

    ROUTER <-->|"mem_search<br/>mem_save"| ENGRAM

    BE <-->|"merge STATE"| ENGRAM

    FE <-->|"merge STATE"| ENGRAM

    DB <-->|"merge STATE"| ENGRAM

    OS <-->|"merge STATE"| ENGRAM

    SEC <-->|"merge STATE"| ENGRAM

    ROUTER -->|"preflight<br/>merge<br/>validate"| PM

    %% =====================================
    %% STYLES
    %% =====================================

    style CURSOR fill:#f9f9f9,stroke-dasharray:5 5