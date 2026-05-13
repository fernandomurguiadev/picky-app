#!/usr/bin/env node
'use strict';

// ─── Inline implementation (mirrors packet-manager.js exactly) ────────────────

const CONTROL_FIELDS = ['correlationId', 'stage'];
const IRRECUPERABLE_CODES = new Set([
  'SCHEMA_VIOLATION', 'ENGRAM_WRITE_FAILURE',
  'AGENT_PROTOCOL_BREACH', 'UNRESOLVABLE_CONFLICT',
]);

function mergeById(existing = [], incoming = []) {
  const result = [...existing], warnings = [];
  for (const item of incoming) {
    if (item.id == null) { warnings.push(`rejected: no id`); continue; }
    const idx = result.findIndex(e => e.id === item.id);
    if (idx >= 0) result[idx] = { ...result[idx], ...item };
    else result.push(item);
  }
  return { result, warnings };
}

function merge(existingPacket, agentName, newFields) {
  const isRouter = agentName === 'router';
  const merged   = { ...existingPacket };
  const warnings = [];
  for (const [key, value] of Object.entries(newFields)) {
    if (!isRouter && CONTROL_FIELDS.includes(key)) {
      warnings.push(`AGENT_PROTOCOL_BREACH: '${agentName}' tried to write CONTROL '${key}'`);
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
    merged.error_code     = 'AGENT_PROTOCOL_BREACH';
    merged.blocked_reason = breaches[0];
  }
  return { packet: merged, warnings };
}

function preflight(userId) {
  const now   = new Date(), pad = n => String(n).padStart(2, '0');
  const ts    = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
  const rand4 = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return {
    correlationId:   `${userId || 'anon'}-${ts}-${rand4}`,
    stage:           'intake',
    status:          'ok',
    scope:           [],
    current_task:    null,
    completed_tasks: [],
    error_code:      null,
    blocked_reason:  null,
  };
}

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

console.log('\nPacket Manager Tests\n');

const base = preflight('test');

// ─── preflight ────────────────────────────────────────────────────────────────

test('preflight: correlationId con formato correcto', () => {
  assert(/^test-\d{12}-[0-9a-f]{4}$/.test(base.correlationId), `bad id: ${base.correlationId}`);
  assert(base.stage === 'intake');
  assert(base.status === 'ok');
  assert(Array.isArray(base.completed_tasks) && base.completed_tasks.length === 0);
  assert(base.current_task === null);
  assert(base.error_code === null);
});

test('preflight: schema simplificado — sin campos de supervisor ni workflow_turn', () => {
  assert(!('workflow_turn'               in base), 'workflow_turn no debería existir');
  assert(!('supervisor_status'           in base), 'supervisor_status no debería existir');
  assert(!('supervisor_expected_active'  in base), 'supervisor_expected_active no debería existir');
  assert(!('supervisor_last_turn'        in base), 'supervisor_last_turn no debería existir');
  assert(!('supervisor_pending_actions'  in base), 'supervisor_pending_actions no debería existir');
  assert(!('archived_turns'              in base), 'archived_turns no debería existir');
  assert(!('deep_archived_turns'         in base), 'deep_archived_turns no debería existir');
  assert(!('archive_fail_count'          in base), 'archive_fail_count no debería existir');
  assert(!('degraded_skips'              in base), 'degraded_skips no debería existir');
  assert(!('gate_blocked_at_turn'        in base), 'gate_blocked_at_turn no debería existir');
  assert(!('skill_statuses'              in base), 'skill_statuses no debería existir');
});

// ─── CONTROL protection ───────────────────────────────────────────────────────

test('merge: frontend no puede escribir stage (CONTROL breach)', () => {
  const { packet, warnings } = merge(base, 'frontend', { stage: 'done' });
  assert(packet.stage === 'intake', 'stage debería seguir en intake');
  assert(packet.error_code === 'AGENT_PROTOCOL_BREACH');
  assert(warnings.some(w => w.includes('AGENT_PROTOCOL_BREACH')));
});

test('merge: backend no puede escribir correlationId (CONTROL breach)', () => {
  const { packet, warnings } = merge(base, 'backend', { correlationId: 'hacked-id' });
  assert(packet.correlationId === base.correlationId, 'correlationId no debería cambiar');
  assert(packet.error_code === 'AGENT_PROTOCOL_BREACH');
});

test('merge: router SÍ puede escribir stage', () => {
  const { packet, warnings } = merge(base, 'router', { stage: 'executing' });
  assert(packet.stage === 'executing');
  assert(warnings.length === 0);
});

test('merge: router SÍ puede escribir correlationId', () => {
  const { packet } = merge(base, 'router', { correlationId: 'new-id-123' });
  assert(packet.correlationId === 'new-id-123');
});

// ─── completed_tasks union-by-id ──────────────────────────────────────────────

test('merge: completed_tasks usa union-by-id (no duplica)', () => {
  const p1 = { ...base, completed_tasks: [{ id: 't1', name: 'Task 1' }] };
  const { packet } = merge(p1, 'backend', { completed_tasks: [{ id: 't2', name: 'Task 2' }] });
  assert(packet.completed_tasks.length === 2);
  assert(packet.completed_tasks.find(t => t.id === 't1'));
  assert(packet.completed_tasks.find(t => t.id === 't2'));
});

test('merge: completed_tasks sobreescribe entry existente por id', () => {
  const p1 = { ...base, completed_tasks: [{ id: 't1', name: 'Old name' }] };
  const { packet } = merge(p1, 'backend', { completed_tasks: [{ id: 't1', name: 'New name' }] });
  assert(packet.completed_tasks.length === 1, 'no debería duplicar');
  assert(packet.completed_tasks[0].name === 'New name');
});

test('merge: completed_tasks rechaza item sin id', () => {
  const { packet, warnings } = merge(base, 'backend', { completed_tasks: [{ name: 'no id here' }] });
  assert(packet.completed_tasks.length === 0, 'item sin id no debería agregarse');
  assert(warnings.some(w => w.includes('rejected')));
});

test('merge: dos agentes aportan tasks distintas — ambas sobreviven', () => {
  const afterBackend   = merge(base, 'backend',  { completed_tasks: [{ id: 'api-1', name: 'Create endpoint' }] }).packet;
  const afterFrontend  = merge(afterBackend, 'frontend', { completed_tasks: [{ id: 'app-1', name: 'Create component' }] }).packet;
  assert(afterFrontend.completed_tasks.length === 2);
});

// ─── STATE fields last-write-wins ─────────────────────────────────────────────

test('merge: campos STATE se escriben con last-write-wins', () => {
  const { packet } = merge(base, 'frontend', {
    status: 'error',
    error_code: 'SOME_DOMAIN_ERROR',
    blocked_reason: 'component not found',
  });
  assert(packet.status === 'error');
  assert(packet.error_code === 'SOME_DOMAIN_ERROR');
  assert(packet.blocked_reason === 'component not found');
});

test('merge: current_task se sobreescribe (last-write-wins)', () => {
  const p1 = { ...base, current_task: { id: 't1', name: 'Task 1' } };
  const { packet } = merge(p1, 'backend', { current_task: { id: 't2', name: 'Task 2' } });
  assert(packet.current_task.id === 't2');
});

// ─── is-irrecuperable ─────────────────────────────────────────────────────────

test('is-irrecuperable: códigos conocidos son irrecuperables', () => {
  assert(IRRECUPERABLE_CODES.has('AGENT_PROTOCOL_BREACH'));
  assert(IRRECUPERABLE_CODES.has('SCHEMA_VIOLATION'));
  assert(IRRECUPERABLE_CODES.has('ENGRAM_WRITE_FAILURE'));
  assert(IRRECUPERABLE_CODES.has('UNRESOLVABLE_CONFLICT'));
});

test('is-irrecuperable: código desconocido NO es irrecuperable', () => {
  assert(!IRRECUPERABLE_CODES.has('SOME_RANDOM_ERROR'));
  assert(!IRRECUPERABLE_CODES.has(''));
  assert(!IRRECUPERABLE_CODES.has(undefined));
});

// ─── Resultado ────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
