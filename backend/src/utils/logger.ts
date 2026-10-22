/**
 * utils/logger.ts
 * Structured logger that redacts sensitive fields from log output.
 * Health data, tokens, keys, and passwords are never logged.
 */

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'api_key',
  'apikey',
  'secret',
  'jwt',
  'access_token',
  'refresh_token',
  'data',        // health log payload – keep out of logs
  'note',        // may contain health details
  'prompt',      // AI prompt content
  'content',     // AI response content
]);

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => redact(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redact(value, depth + 1);
    }
  }
  return result;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: unknown): void {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta !== undefined ? { meta: redact(meta) } : {}),
  };

  const output = JSON.stringify(entry);
  if (level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => log('info', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  error: (message: string, meta?: unknown) => log('error', message, meta),
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      log('debug', message, meta);
    }
  },
};
