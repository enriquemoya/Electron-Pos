const spec = process.argv[2];
if (!spec) {
  console.error('Usage: npm run gov:spec:create -- "<spec-name>"');
  process.exit(1);
}
console.log('Spec create workflow');
console.log('- Follow .agent/workflows/spec-create.md');
console.log(`- Target spec: ${spec}`);
console.log('- Output: .specs/<spec>/requirements.md, design.md, tasks.md');
console.log(`- Next: npm run gov:spec:audit -- "${spec}"`);
