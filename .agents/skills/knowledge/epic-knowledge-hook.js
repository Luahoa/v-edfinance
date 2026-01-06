#!/usr/bin/env node

/**
 * Epic Knowledge Documentation Hook
 * 
 * Triggers knowledge extraction after epic completion.
 * Can be integrated into Ralph CLI or called manually.
 * 
 * Usage:
 *   node epic-knowledge-hook.js <epic-id>
 *   node epic-knowledge-hook.js ved-jgea
 */

const epicId = process.argv[2];

if (!epicId) {
  console.error('❌ Usage: node epic-knowledge-hook.js <epic-id>');
  process.exit(1);
}

console.log(`\n📚 Knowledge Extraction Hook Triggered`);
console.log(`Epic: ${epicId}`);
console.log(`Timestamp: ${new Date().toISOString()}\n`);

console.log('📋 Checklist:');
console.log('  1. Epic closed in beads system');
console.log('  2. Quality gates passed');
console.log('  3. Code changes committed and pushed\n');

console.log('🤖 Next Steps:');
console.log('  Ask your AI agent:');
console.log(`  "Document epic ${epicId} using the knowledge skill"\n`);

console.log('📖 The agent will:');
console.log('  - Find all threads for this epic');
console.log('  - Extract topics, decisions, patterns');
console.log('  - Verify against code');
console.log('  - Update AGENTS.md and docs/');
console.log('  - Create diagrams with citations\n');

console.log('📁 Expected Documentation Updates:');
console.log('  - AGENTS.md (new patterns/commands)');
console.log('  - docs/behavioral-design/ (if applicable)');
console.log('  - .agents/skills/ (if new patterns)');
console.log('  - Mermaid diagrams with code links\n');

console.log('✅ Hook complete - waiting for AI agent execution');
