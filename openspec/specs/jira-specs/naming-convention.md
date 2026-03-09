# Functional Requirements Naming Convention

Functional requirement identification follows this format:
`[Module]-[Number]`

Where:

### [Module]
A three-letter code identifying the functional module.
Examples:
- **USR** → Users
- **AUT** → Authentication
- **CAT** → Catalog
- **ORD** → Orders
- **SET** → Settings

### [Number]
A three-digit sequential number.
Example: `USR-001`, `USR-002`, `USR-003`.

---

## Sub-requirements (Optional)
Sub-requirements are identified as:
`[Module]-[Number].[Sub-number]`

Example: `USR-001.1`, `USR-001.2`.

---

# Jira Structure

The agent must build the following hierarchy:

**EPIC (Module)**
   └── **User Story (Functional Requirement)**
           └── **Technical Tasks by Profile**

Example:
- **EPIC**: User Module (USR)
- **Story**: USR-001 Create User Account
- **Tasks**:
  - FE-USR-001 (Frontend)
  - BE-USR-001 (Backend)
  - INF-USR-001 (Infrastructure)
  - DES-USR-001 (UX/UI Design)

---

# Technical Task Naming Convention
Each functional requirement generates tasks based on the technical profile.

Format: `[PROFILE]-[REQUIREMENT_ID]`

Profiles:
- **FE** → Frontend
- **BE** → Backend
- **INF** → Infrastructure
- **DES** → UX/UI Design

Examples:
- `FE-USR-001`
- `BE-USR-001`
- `INF-USR-001`
- `DES-USR-001`
