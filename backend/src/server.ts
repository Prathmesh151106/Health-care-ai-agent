/**
 * server.ts
 * HTTP server startup and graceful shutdown.
 * Validates environment first (via config/env import), then starts.
 */

import './config/env'; // validates env at import time
import { createApp } from './app';
import { closePgPool } from './db/pool';
import { logger } from './utils/logger';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info('Server started', {
    port:    env.port,
    env:     env.nodeEnv,
    aiMode:  env.isDemoMode ? 'demo' : 'live',
  });
});

// Request timeout
server.setTimeout(env.requestTimeoutMs);

// ── Graceful shutdown ────────────────────────────────────────────────────────

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info('Shutdown initiated', { signal });

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await closePgPool();
    } catch (err) {
      logger.error('Error closing database pool', {
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message });
  shutdown('uncaughtException');
});

export default server;
