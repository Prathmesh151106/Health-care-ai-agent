/**
 * routes/logs.ts
 * Health log CRUD endpoints.
 * All routes require a verified auth token.
 * Category-specific validation in logService.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { UUIDParam, UpdateLogSchema, LogsQuerySchema } from '../schemas';
import * as logService from '../services/logService';

export const logsRouter = Router();
logsRouter.use(requireAuth);

// GET /api/v1/logs
logsRouter.get(
  '/',
  validate(LogsQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await logService.listLogs(req.userId!, req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/logs
logsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await logService.createLog(req.userId!, req.body);
    res.status(201).json({ data: log });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/logs/:id
logsRouter.get(
  '/:id',
  validate(UUIDParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const log = await logService.getLog(req.userId!, req.params.id);
      res.json({ data: log });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/logs/:id
logsRouter.patch(
  '/:id',
  validate(UUIDParam, 'params'),
  validate(UpdateLogSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const log = await logService.updateLog(req.userId!, req.params.id, req.body);
      res.json({ data: log });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/logs/:id
logsRouter.delete(
  '/:id',
  validate(UUIDParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await logService.deleteLog(req.userId!, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
