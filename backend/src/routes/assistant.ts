/**
 * routes/assistant.ts
 * AI assistant endpoint.
 * Has stricter rate limiting. Returns draft proposals only – never auto-saves.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { aiRateLimit } from '../middleware/rateLimit';
import { AssistantRequestSchema } from '../schemas';
import * as aiService from '../services/ai/aiService';

export const assistantRouter = Router();

assistantRouter.post(
  '/',
  requireAuth,
  aiRateLimit,
  validate(AssistantRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, context, date } = req.body as {
        message: string;
        context: string;
        date?: string;
      };
      const response = await aiService.askAssistant(req.userId!, message, context, date);
      res.json({ data: response });
    } catch (err) {
      next(err);
    }
  }
);
