const spec = process.argv[2];
if (!spec) {
  console.error('Usage: npm run gov:impl:audit -- "<spec-name>"');
  process.exit(1);
}
console.log('Implementation audit workflow');
console.log('- Follow .agent/workflows/impl-audit.md');
console.log(`- Target spec: ${spec}`);
console.log('- Output: audit report and verdict');
