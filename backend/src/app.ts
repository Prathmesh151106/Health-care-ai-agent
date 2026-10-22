/**
 * app.ts
 * Express application setup.
 * Middleware order is deliberate:
 *   request ID → secure headers → CORS → body limits → rate limits →
 *   routes → 404 → centralized error handler
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { corsMiddleware } from './middleware/cors';
import { generalRateLimit } from './middleware/rateLimit';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { healthRouter }    from './routes/health';
import { meRouter }        from './routes/me';
import { logsRouter }      from './routes/logs';
import { remindersRouter } from './routes/reminders';
import { summariesRouter } from './routes/summaries';
import { assistantRouter } from './routes/assistant';
import { importRouter }    from './routes/import';
import { logger }          from './utils/logger';
import { env }             from './config/env';

export function createApp(): express.Express {
  const app = express();

  // ── 1. Request ID ────────────────────────────────────────────────────────
  app.use((req: Request, res: Response, next: NextFunction) => {
    const id = uuidv4();
    req.headers['x-request-id'] = id;
    res.setHeader('X-Request-ID', id);
    next();
  });

  // ── 2. Security headers ──────────────────────────────────────────────────
  app.use(helmet());

  // ── 3. CORS ──────────────────────────────────────────────────────────────
  app.use(corsMiddleware);

  // ── 4. Body parsing with size limits ─────────────────────────────────────
  // Keep health data payloads small; import has a higher limit
  app.use('/api/v1/import', express.json({ limit: '500kb' }));
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));

  // ── 5. Request logging (no health data) ──────────────────────────────────
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (env.nodeEnv !== 'test') {
      logger.info('Request', {
        method:    req.method,
        path:      req.path,
        requestId: req.headers['x-request-id'],
      });
    }
    next();
  });

  // ── 6. General rate limiter ───────────────────────────────────────────────
  app.use(generalRateLimit);

  // ── 7. Routes ─────────────────────────────────────────────────────────────
  app.use('/health',              healthRouter);
  app.use('/api/v1/me',           meRouter);
  app.use('/api/v1/logs',         logsRouter);
  app.use('/api/v1/reminders',    remindersRouter);
  app.use('/api/v1/summaries',    summariesRouter);
  app.use('/api/v1/assistant',    assistantRouter);
  app.use('/api/v1/import',       importRouter);

  // ── 8. 404 handler ────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── 9. Centralized error handler ──────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
