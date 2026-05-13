#!/usr/bin/env node
/**
 * Agent Bridge Script
 * Helps different agents sync their context using Engram and the Packet Manager.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AI_DIR = path.join(process.cwd(), '.ai');
const PACKET_MANAGER = path.join(AI_DIR, 'scripts', 'packet-manager.js');

function getLatestPacket() {
  // En un entorno real, esto llamaría a mem_search via MCP.
  // Como este script corre en el shell, dependemos de lo que el agente le pase
  // o de archivos temporales si Engram no es accesible via CLI directamente.
  console.log("Requisito: El agente debe proveer el packet actual desde Engram.");
  console.log("Comando sugerido para el agente:");
  console.log("1. mem_search(query: 'sdd-init/PickyApp')");
  console.log("2. mem_get_observation(id: <latest_id>)");
}

function showStatus(packetJSON) {
  try {
    const packet = JSON.parse(packetJSON);
    const md = `
### 📊 Current Workflow Status
- **ID:** \`${packet.correlationId}\`
- **Stage:** \`${packet.stage}\`
- **Status:** \`${packet.status}\`

#### 🎯 Active Scope
${(packet.scope || []).map(s => `- ${s}`).join('\n') || '- None'}

#### ✅ Completed Tasks (${(packet.completed_tasks || []).length})
${(packet.completed_tasks || []).map(t => `- [x] ${t.name}`).join('\n') || '- None'}

#### 🔄 Current Task
${packet.current_task ? `- ${packet.current_task.name}` : '- None'}

#### ⚠️ Errors
${packet.error_code ? `- **Error Code:** ${packet.error_code}` : '- No errors'}
${packet.blocked_reason ? `- **Blocked:** ${packet.blocked_reason}` : ''}
    `;
    console.log(md);
  } catch (e) {
    console.error("Error parsing packet:", e.message);
  }
}

const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'status':
    showStatus(args[0]);
    break;
  default:
    console.log("Usage: node bridge.js status '<packetJSON>'");
}
