/**
 * routes/summaries.ts
 * Factual summary of the authenticated user's own health log entries.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { SummaryQuerySchema } from '../schemas';
import * as summaryService from '../services/summaryService';

export const summariesRouter = Router();
summariesRouter.use(requireAuth);

// GET /api/v1/summaries
summariesRouter.get(
  '/',
  validate(SummaryQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, date } = req.query as { type: 'daily'|'weekly'|'appointment'; date?: string };
      const summary = await summaryService.buildSummary(req.userId!, type, date);
      res.json({ data: summary });
    } catch (err) {
      next(err);
    }
  }
);
