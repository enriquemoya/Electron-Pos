type LogMeta = Record<string, unknown>;

function safeStringify(meta: LogMeta | undefined) {
  if (!meta) {
    return "";
  }
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return "";
  }
}

export const appLogger = {
  debug(message: string, meta?: LogMeta) {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    process.stderr.write(`[debug] ${message}${safeStringify(meta)}\n`);
  },
  info(message: string, meta?: LogMeta) {
    process.stdout.write(`[info] ${message}${safeStringify(meta)}\n`);
  },
  warn(message: string, meta?: LogMeta) {
    process.stderr.write(`[warn] ${message}${safeStringify(meta)}\n`);
  },
  error(message: string, meta?: LogMeta) {
    process.stderr.write(`[error] ${message}${safeStringify(meta)}\n`);
  }
};
