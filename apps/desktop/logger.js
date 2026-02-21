function write(level, event, details) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    details: details || {}
  };

  process.stderr.write(`${JSON.stringify(payload)}\n`);
}

const desktopLogger = {
  error(event, details) {
    write("error", event, details);
  },
  warn(event, details) {
    write("warn", event, details);
  },
  info(event, details) {
    write("info", event, details);
  }
};

module.exports = { desktopLogger };
