### ⚠️ CRÍTICO — Formato de descripción: ADF obligatorio

**Jira Cloud NO renderiza Markdown en el campo `description`.**
Siempre construir la descripción como **Atlassian Document Format (ADF)** — JSON estructurado.

**Nunca hacer esto:**
```json
{ "description": "## Criterios\n- [ ] item" }
```

**Siempre hacer esto:**
```json
{
  "description": {
    "version": 1,
    "type": "doc",
    "content": [...]
  }
}
```

#### Construcción del ADF por sección

**Encabezado h2:**
```json
{
  "type": "heading",
  "attrs": { "level": 2 },
  "content": [{ "type": "text", "text": "✅ Criterios de Aceptación" }]
}
```

**Texto con negrita inline:**
```json
{
  "type": "paragraph",
  "content": [
    { "type": "text", "text": "Endpoint: ",
      "marks": [{ "type": "strong" }] },
    { "type": "text", "text": "POST /api/v1/auth/login",
      "marks": [{ "type": "code" }] }
  ]
}
```

**Checklist de criterios de aceptación (nativo Jira):**
```json
{
  "type": "taskList",
  "attrs": { "localId": "ac-list-1" },
  "content": [
    {
      "type": "taskItem",
      "attrs": { "localId": "ac-1", "state": "TODO" },
      "content": [{ "type": "text",
        "text": "Dado email válido, cuando POST /login, entonces retorna JWT" }]
    }
  ]
}
```

**Bloque de código con syntax highlighting:**
```json
{
  "type": "codeBlock",
  "attrs": { "language": "json" },
  "content": [{ "type": "text", "text": "{\n  \"email\": \"user@example.com\"\n}" }]
}
```

**Tabla con encabezados en negrita:**
```json
{
  "type": "table",
  "attrs": { "isNumberColumnEnabled": false, "layout": "default" },
  "content": [
    {
      "type": "tableRow",
      "content": [
        {
          "type": "tableHeader",
          "attrs": {},
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Campo",
              "marks": [{ "type": "strong" }] }]
          }]
        }
      ]
    },
    {
      "type": "tableRow",
      "content": [
        {
          "type": "tableCell",
          "attrs": {},
          "content": [{ "type": "paragraph",
            "content": [{ "type": "text", "text": "email" }] }]
        }
      ]
    }
  ]
}
```

**Línea divisora entre secciones:**
```json
{ "type": "rule" }
```

#### Estructura ADF completa de una tarea

```json
{
  "version": 1,
  "type": "doc",
  "content": [
    { "type": "heading", "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "📝 Historia de Usuario" }] },
    { "type": "paragraph", "content": [
        { "type": "text", "text": "Como " },
        { "type": "text", "text": "usuario registrado",
          "marks": [{ "type": "strong" }] },
        { "type": "text", "text": " quiero iniciar sesión para acceder al sistema." }
    ]},
    { "type": "rule" },
    { "type": "heading", "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "✅ Criterios de Aceptación" }] },
    {
      "type": "taskList",
      "attrs": { "localId": "ac-1" },
      "content": [
        { "type": "taskItem",
          "attrs": { "localId": "ac-1-1", "state": "TODO" },
          "content": [{ "type": "text",
            "text": "Dado email y password válidos → retorna JWT + 200" }] },
        { "type": "taskItem",
          "attrs": { "localId": "ac-1-2", "state": "TODO" },
          "content": [{ "type": "text",
            "text": "Dado credenciales inválidas → retorna 401" }] }
      ]
    },
    { "type": "rule" },
    { "type": "heading", "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "⚙️ Detalles Técnicos" }] },
    { "type": "paragraph", "content": [
        { "type": "text", "text": "Endpoint: ",
          "marks": [{ "type": "strong" }] },
        { "type": "text", "text": "POST /api/v1/auth/login",
          "marks": [{ "type": "code" }] }
    ]},
    { "type": "rule" },
    { "type": "heading", "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "💻 Contrato de API" }] },
    { "type": "codeBlock", "attrs": { "language": "json" },
      "content": [{ "type": "text",
        "text": "// Request\n{\n  \"email\": \"user@example.com\",\n  \"password\": \"SecurePass123\"\n}\n\n// Response 200\n{\n  \"data\": { \"accessToken\": \"eyJ...\", \"expiresIn\": 900 },\n  \"error\": null,\n  \"meta\": {}\n}" }]
    }
  ]
}
```

---

### Llamada a la API de Jira — PowerShell

```powershell
# Paso 1: Crear el RF como Story
$headers = @{
  Authorization  = "Basic $([Convert]::ToBase64String(
    [Text.Encoding]::ASCII.GetBytes("$env:JIRA_EMAIL:$env:JIRA_API_TOKEN")))"
  "Content-Type" = "application/json"
}

# El $adfDescription es el JSON ADF construido como objeto PowerShell
$rfBody = @{
  fields = @{
    project     = @{ key = $env:JIRA_PROJECT_KEY }
    summary     = "RF-001: [Título del requerimiento]"
    description = $adfDescription   # objeto ADF, NO string Markdown
    issuetype   = @{ name = "Story" }
    priority    = @{ name = "Medium" }
  }
} | ConvertTo-Json -Depth 20

$rf = Invoke-RestMethod `
  -Uri "$env:JIRA_HOST/rest/api/3/issue" `
  -Method Post -Headers $headers -Body $rfBody
$rfKey = $rf.key  # ej: KAN-42

# Paso 2: Crear cada tarea con el RF como parent
$taskBody = @{
  fields = @{
    project     = @{ key = $env:JIRA_PROJECT_KEY }
    summary     = "BE-001: [Título de la tarea]"
    description = $adfTaskDescription
    issuetype   = @{ name = "Task" }
    priority    = @{ name = "Medium" }
    parent      = @{ key = $rfKey }
  }
} | ConvertTo-Json -Depth 20

$task = Invoke-RestMethod `
  -Uri "$env:JIRA_HOST/rest/api/3/issue" `
  -Method Post -Headers $headers -Body $taskBody
$taskKey = $task.key  # ej: KAN-43
```

### Llamada a la API de Jira — Bash

```bash
# Construir header de autenticación
AUTH=$(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)
HEADERS='-H "Authorization: Basic '$AUTH'" -H "Content-Type: application/json"'

# Paso 1: Crear RF como Story
RF_RESPONSE=$(curl -s -X POST \
  "$JIRA_HOST/rest/api/3/issue" \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d "$RF_ADF_BODY")

RF_KEY=$(echo "$RF_RESPONSE" | jq -r '.key')
echo "✅ RF creado: $RF_KEY"

# Paso 2: Crear tarea con parent = RF
TASK_BODY=$(echo "$TASK_ADF_BODY" | \
  jq --arg parent "$RF_KEY" '.fields.parent = {key: $parent}')

TASK_RESPONSE=$(curl -s -X POST \
  "$JIRA_HOST/rest/api/3/issue" \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d "$TASK_BODY")

TASK_KEY=$(echo "$TASK_RESPONSE" | jq -r '.key')
echo "✅ Tarea creada: $TASK_KEY"
```