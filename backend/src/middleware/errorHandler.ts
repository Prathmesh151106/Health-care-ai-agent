/**
 * middleware/errorHandler.ts
 * Centralized error handler. Must be registered last.
 * Sends a consistent JSON error format.
 * Never exposes stack traces, secrets, or internal details to the client.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not found',
    code:  'NOT_FOUND',
    path:  req.path,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Zod errors (should be handled by validate middleware, but catch any that escape)
  if (err instanceof ZodError) {
    res.status(400).json({
      error:   'Validation failed',
      code:    'VALIDATION_ERROR',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Server error', {
        code:   err.code,
        path:   req.path,
        method: req.method,
        error:  err.message,
      });
    }
    const body: Record<string, unknown> = {
      error: err.message,
      code:  err.code,
    };
    // Include validation details if available
    if ('details' in err && err.details !== undefined) {
      body.details = (err as { details: unknown }).details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown / unexpected errors – log full details server-side, return generic message
  logger.error('Unexpected error', {
    path:   req.path,
    method: req.method,
    error:  err instanceof Error ? err.message : String(err),
  });

  res.status(500).json({
    error: 'An unexpected error occurred',
    code:  'INTERNAL_ERROR',
  });
}
