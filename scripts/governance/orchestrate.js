const spec = process.argv[2];
if (!spec) {
  console.error('Usage: npm run gov:orchestrate -- "<spec-name>"');
  process.exit(1);
}
console.log('Orchestrated workflow');
console.log('- Follow .agent/workflows/spec-create.md');
console.log('- Follow .agent/workflows/spec-audit.md');
console.log('- Follow .agent/workflows/impl.md');
console.log('- Follow .agent/workflows/impl-audit.md');
console.log('- Follow .agent/workflows/memory-update.md');
console.log(`- Target spec: ${spec}`);
console.log('- Gates: after spec audit, after implementation plan, after impl audit');
console.log('- Next: npm run gov:spec:create -- "' + spec + '"');
