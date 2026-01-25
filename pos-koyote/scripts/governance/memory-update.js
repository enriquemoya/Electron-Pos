const message = process.argv.slice(2).join(' ').trim();
if (!message) {
  console.error('Usage: npm run gov:memory:update -- "<message>"');
  process.exit(1);
}
console.log('Memory update command:');
console.log(`npm run memory:update "${message}"`);
