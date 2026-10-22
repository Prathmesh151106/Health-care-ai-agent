/**
 * routes/reminders.ts
 * Reminders, occurrences, snooze, complete, and schedule-copy endpoints.
 *
 * IMPORTANT: /due and /copy-yesterday/* must be defined BEFORE /:id routes
 * so Express doesn't try to parse them as UUID params.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  UUIDParam,
  CreateReminderSchema,
  UpdateReminderSchema,
  RemindersQuerySchema,
  SnoozeSchema,
  CopyYesterdaySchema,
} from '../schemas';
import * as reminderService from '../services/reminderService';
import * as occurrenceService from '../services/occurrenceService';
import * as scheduleCopy from '../services/scheduleCopyService';

export const remindersRouter = Router();
remindersRouter.use(requireAuth);

// ── Static routes first ──────────────────────────────────────────────────────

// GET /api/v1/reminders/due
remindersRouter.get('/due', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const occurrences = await occurrenceService.getDueOccurrences(req.userId!);
    res.json({ data: occurrences });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reminders/copy-yesterday/preview
remindersRouter.get(
  '/copy-yesterday/preview',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const preview = await scheduleCopy.previewCopyYesterday(req.userId!);
      res.json({ data: preview });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/reminders/copy-yesterday
remindersRouter.post(
  '/copy-yesterday',
  validate(CopyYesterdaySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await scheduleCopy.confirmCopyYesterday(req.userId!);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ── Collection routes ────────────────────────────────────────────────────────

// GET /api/v1/reminders
remindersRouter.get(
  '/',
  validate(RemindersQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await reminderService.listReminders(req.userId!, req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/reminders
remindersRouter.post(
  '/',
  validate(CreateReminderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reminder = await reminderService.createReminder(req.userId!, req.body);
      res.status(201).json({ data: reminder });
    } catch (err) {
      next(err);
    }
  }
);

// ── Item routes ──────────────────────────────────────────────────────────────

// GET /api/v1/reminders/:id
remindersRouter.get(
  '/:id',
  validate(UUIDParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reminder = await reminderService.getReminder(req.userId!, req.params.id);
      res.json({ data: reminder });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/reminders/:id
remindersRouter.patch(
  '/:id',
  validate(UUIDParam, 'params'),
  validate(UpdateReminderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reminder = await reminderService.updateReminder(req.userId!, req.params.id, req.body);
      res.json({ data: reminder });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/reminders/:id
remindersRouter.delete(
  '/:id',
  validate(UUIDParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await reminderService.deleteReminder(req.userId!, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/reminders/:id/snooze
remindersRouter.post(
  '/:id/snooze',
  validate(UUIDParam, 'params'),
  validate(SnoozeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure occurrence exists for today, then snooze it
      const occurrence = await occurrenceService.getOrCreateTodayOccurrence(req.userId!, req.params.id);
      const prefs = await (await import('../repositories/preferencesRepo')).getOrCreatePreferences(req.userId!);
      const minutes = req.body.minutes ?? prefs.snooze_minutes;
      const snoozed = await occurrenceService.snoozeOccurrence(req.userId!, occurrence.id, minutes);
      res.json({ data: snoozed });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/reminders/:id/complete
remindersRouter.post(
  '/:id/complete',
  validate(UUIDParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const occurrence = await occurrenceService.getOrCreateTodayOccurrence(req.userId!, req.params.id);
      const completed = await occurrenceService.completeOccurrence(req.userId!, occurrence.id);
      res.json({ data: completed });
    } catch (err) {
      next(err);
    }
  }
);
