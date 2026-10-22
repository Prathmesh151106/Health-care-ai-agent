/**
 * middleware/cors.ts
 * Strict CORS allow-list. No wildcard origins with credentials.
 * Reads allowed origins from environment variables.
 */

import cors from 'cors';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const allowedOrigins = new Set<string>(
  [
    env.frontendUrl,
    env.localFrontendUrl,
    ...env.extraAllowedOrigins,
  ].filter(Boolean)
);

logger.info('CORS allow-list configured', {
  count: allowedOrigins.size,
});

export const corsMiddleware = cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (e.g. server-to-server, curl during dev)
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin not allowed: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400,
});
