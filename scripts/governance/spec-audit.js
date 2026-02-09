const spec = process.argv[2];
if (!spec) {
  console.error('Usage: npm run gov:spec:audit -- "<spec-name>"');
  process.exit(1);
}
console.log('Spec audit workflow');
console.log('- Follow .agent/workflows/spec-audit.md');
console.log(`- Target spec: ${spec}`);
console.log('- Output: audit report and verdict');
console.log('- Next: fix spec or proceed to implementation');
