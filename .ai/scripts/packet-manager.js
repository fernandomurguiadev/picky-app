#!/usr/bin/env node
/**
 * Packet Manager — Engram merge-write protocol implementation
 *
 * Usage:
 *   node packet-manager.js preflight <userId>
 *   node packet-manager.js merge <existingPacketJSON> <agentName> <fieldsJSON>
 *   node packet-manager.js validate <packetJSON>
 *   node packet-manager.js new-id <userId>
 *   node packet-manager.js is-irrecuperable <errorCode>
 *   node packet-manager.js list-workflows [userId]
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

// Only Router can write these fields
const CONTROL_FIELDS = ['correlationId', 'stage'];

const IRRECUPERABLE_CODES = new Set([
  'SCHEMA_VIOLATION',
  'ENGRAM_WRITE_FAILURE',
  'AGENT_PROTOCOL_BREACH',
  'UNRESOLVABLE_CONFLICT',
]);

// ─── Merge strategies ─────────────────────────────────────────────────────────

function mergeById(existing = [], incoming = []) {
  const result = [...existing];
  const warnings = [];
  for (const item of incoming) {
    if (item.id == null) {
      warnings.push(`merge rejected: item without id — ${JSON.stringify(item)}`);
      continue;
    }
    const idx = result.findIndex(e => e.id === item.id);
    if (idx >= 0) result[idx] = { ...result[idx], ...item };
    else result.push(item);
  }
  return { result, warnings };
}

// ─── Packet merge ─────────────────────────────────────────────────────────────

function merge(existingPacket, agentName, newFields) {
  const isRouter = agentName === 'router';
  const merged   = { ...existingPacket };
  const warnings = [];

  for (const [key, value] of Object.entries(newFields)) {
    if (!isRouter && CONTROL_FIELDS.includes(key)) {
      warnings.push(`AGENT_PROTOCOL_BREACH: agent '${agentName}' attempted to write CONTROL field '${key}' — rejected`);
      continue;
    }

    if (key === 'completed_tasks') {
      const { result, warnings: w } = mergeById(merged[key], value);
      merged[key] = result;
      warnings.push(...w);
    } else {
      merged[key] = value;
    }
  }

  const breaches = warnings.filter(w => w.startsWith('AGENT_PROTOCOL_BREACH'));
  if (breaches.length > 0) {
    merged.error_code    = 'AGENT_PROTOCOL_BREACH';
    merged.blocked_reason = breaches[0];
  }

  return { packet: merged, warnings };
}

// ─── Validate ─────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['correlationId', 'stage', 'status'];
const VALID_STAGES    = new Set(['intake', 'executing', 'done', 'error']);
const VALID_STATUSES  = new Set(['ok', 'error', 'blocked']);

function validate(packet) {
  const errors = [];

  for (const f of REQUIRED_FIELDS) {
    if (packet[f] == null) errors.push(`missing field: ${f}`);
  }
  if (packet.stage && !VALID_STAGES.has(packet.stage)) {
    errors.push(`invalid stage: '${packet.stage}'`);
  }
  if (packet.status && !VALID_STATUSES.has(packet.status)) {
    errors.push(`invalid status: '${packet.status}'`);
  }
  if (Array.isArray(packet.completed_tasks)) {
    packet.completed_tasks.forEach((t, i) => {
      if (!t.id)   errors.push(`completed_tasks[${i}] missing id`);
      if (!t.name) errors.push(`completed_tasks[${i}] missing name`);
    });
  }

  return errors;
}

// ─── Preflight ────────────────────────────────────────────────────────────────

function preflight(userId) {
  const now   = new Date();
  const pad   = n => String(n).padStart(2, '0');
  const ts    = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
  const rand4 = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');

  return {
    // CONTROL — solo Router escribe estos campos
    correlationId: `${userId || 'anon'}-${ts}-${rand4}`,
    stage:         'intake',
    // STATE — cualquier agente puede merge-escribir estos campos
    status:        'ok',
    scope:         [],
    current_task:  null,
    completed_tasks: [],
    error_code:    null,
    blocked_reason: null,
  };
}

// ─── New correlationId ────────────────────────────────────────────────────────

function newId(userId) {
  return preflight(userId).correlationId;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function main() {
  const [,, command, ...args] = process.argv;

  try {
    switch (command) {
      case 'preflight': {
        console.log(JSON.stringify(preflight(args[0]), null, 2));
        break;
      }
      case 'merge': {
        const [existingJSON, agentName, fieldsJSON] = args;
        if (!existingJSON || !agentName || !fieldsJSON) {
          console.error('Usage: merge <existingPacketJSON> <agentName> <fieldsJSON>');
          process.exit(1);
        }
        const existing = JSON.parse(existingJSON);
        const fields   = JSON.parse(fieldsJSON);
        const { packet, warnings } = merge(existing, agentName, fields);
        console.log(JSON.stringify({ packet, warnings }, null, 2));
        break;
      }
      case 'validate': {
        const packet = JSON.parse(args[0]);
        const errors = validate(packet);
        if (errors.length === 0) {
          console.log(JSON.stringify({ valid: true }));
        } else {
          console.log(JSON.stringify({ valid: false, errors }));
          process.exit(1);
        }
        break;
      }
      case 'new-id': {
        console.log(newId(args[0]));
        break;
      }
      case 'is-irrecuperable': {
        const code = args[0];
        console.log(JSON.stringify({ irrecuperable: IRRECUPERABLE_CODES.has(code) }));
        break;
      }
      case 'list-workflows': {
        const userId = args[0] || null;
        const query  = userId ? `sdd-${userId}` : 'sdd-';
        console.log(JSON.stringify({
          instructions:    'Run mem_search with the query below to find active workflows in Engram.',
          engram_query:    query,
          engram_project:  'PickyApp',
          topic_pattern:   'sdd/<correlationId>/packet',
          hint: userId
            ? `Searching workflows for user '${userId}'. Each result is an active ContextPacket.`
            : 'No userId provided — returns all active workflows. Pass a userId to filter.',
        }, null, 2));
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Commands: preflight | merge | validate | new-id | is-irrecuperable | list-workflows [userId]');
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
