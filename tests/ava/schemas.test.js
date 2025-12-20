import test from 'ava';
import { SchemaRegistry } from './apps/api/src/common/schema-registry';

// --- I18N_TEXT Tests ---
test('I18N_TEXT: valid data', (t) => {
  const valid = { vi: 'Chào', en: 'Hello', zh: '你好' };
  const result = SchemaRegistry.I18N_TEXT.safeParse(valid);
  t.true(result.success);
});

test('I18N_TEXT: missing key', (t) => {
  const invalid = { vi: 'Chào', en: 'Hello' };
  const result = SchemaRegistry.I18N_TEXT.safeParse(invalid);
  t.false(result.success);
});

test('I18N_TEXT: wrong type', (t) => {
  const invalid = { vi: 'Chào', en: 123, zh: '你好' };
  const result = SchemaRegistry.I18N_TEXT.safeParse(invalid);
  t.false(result.success);
});

// --- USER_METADATA Tests ---
test('USER_METADATA: valid minimal', (t) => {
  const valid = { displayName: 'John' };
  const result = SchemaRegistry.USER_METADATA.safeParse(valid);
  t.true(result.success);
});

test('USER_METADATA: valid full', (t) => {
  const valid = {
    displayName: 'John',
    avatar: 'https://example.com/a.png',
    preferences: { theme: 'dark' },
  };
  const result = SchemaRegistry.USER_METADATA.safeParse(valid);
  t.true(result.success);
});

test('USER_METADATA: invalid avatar URL', (t) => {
  const invalid = { avatar: 'not-a-url' };
  const result = SchemaRegistry.USER_METADATA.safeParse(invalid);
  t.false(result.success);
});

// --- BEHAVIOR_LOG_PAYLOAD Tests ---
test('BEHAVIOR_LOG_PAYLOAD: valid data', (t) => {
  const valid = {
    isMock: true,
    generatedAt: new Date().toISOString(),
    action: 'CLICK',
  };
  const result = SchemaRegistry.BEHAVIOR_LOG_PAYLOAD.safeParse(valid);
  t.true(result.success);
});

test('BEHAVIOR_LOG_PAYLOAD: invalid date format', (t) => {
  const invalid = { generatedAt: '2025-01-01' }; // Missing time/Z
  const result = SchemaRegistry.BEHAVIOR_LOG_PAYLOAD.safeParse(invalid);
  t.false(result.success);
});

test('BEHAVIOR_LOG_PAYLOAD: extra fields allowed via inference (if passthrough, but registry uses object)', (t) => {
  const data = { action: 'C', extra: 1 };
  const result = SchemaRegistry.BEHAVIOR_LOG_PAYLOAD.safeParse(data);
  // Zod object strips extra fields by default in parse(), but safeParse still succeeds if not .strict()
  t.true(result.success);
});

// --- CHAT_MESSAGE_METADATA Tests ---
test('CHAT_MESSAGE_METADATA: valid TEXT type', (t) => {
  const valid = { type: 'TEXT' };
  const result = SchemaRegistry.CHAT_MESSAGE_METADATA.safeParse(valid);
  t.true(result.success);
});

test('CHAT_MESSAGE_METADATA: valid ACTION_CARD with suggestions', (t) => {
  const valid = {
    type: 'ACTION_CARD',
    hasActionCard: true,
    suggestions: ['Option 1', 'Option 2'],
    customField: 'allowed via passthrough',
  };
  const result = SchemaRegistry.CHAT_MESSAGE_METADATA.safeParse(valid);
  t.true(result.success);
  t.is(result.data.customField, 'allowed via passthrough');
});

test('CHAT_MESSAGE_METADATA: invalid type enum', (t) => {
  const invalid = { type: 'UNKNOWN' };
  const result = SchemaRegistry.CHAT_MESSAGE_METADATA.safeParse(invalid);
  t.false(result.success);
});

// --- General Registry Integration ---
test('SchemaRegistry keys are correct', (t) => {
  const keys = Object.keys(SchemaRegistry);
  t.true(keys.includes('BEHAVIOR_LOG_PAYLOAD'));
  t.true(keys.includes('USER_METADATA'));
  t.true(keys.includes('I18N_TEXT'));
  t.true(keys.includes('CHAT_MESSAGE_METADATA'));
});
