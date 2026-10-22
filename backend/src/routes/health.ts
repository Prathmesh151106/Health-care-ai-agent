/**
 * routes/health.ts
 * Public health-check endpoint for Render.
 * Returns no sensitive data.
 */

import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status:  'ok',
    service: 'daily-health-companion-api',
    time:    new Date().toISOString(),
  });
});
