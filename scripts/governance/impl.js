const spec = process.argv[2];
if (!spec) {
  console.error('Usage: npm run gov:impl -- "<spec-name>"');
  process.exit(1);
}
console.log('Implementation workflow');
console.log('- Follow .agent/workflows/impl.md');
console.log(`- Target spec: ${spec}`);
console.log('- Output: code changes + list of files');
console.log(`- Next: npm run gov:impl:audit -- "${spec}"`);
