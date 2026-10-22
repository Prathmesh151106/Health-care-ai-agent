/**
 * routes/import.ts
 * Local data import: preview and confirmed import.
 *
 * Security rules enforced:
 * - Body size is limited in app.ts (10 KB for this route)
 * - All records are assigned the authenticated user's ID, never from the import payload
 * - No executable content or arbitrary SQL accepted
 * - Import happens in a transaction; failure rolls back all changes
 * - No duplicate logs are created (idempotent on occurred_at + category)
 * - Preview never writes to the database
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ImportPayloadSchema, ConfirmImportSchema } from '../schemas';
import { validateLogBody } from '../schemas';
import { withTransaction } from '../db/pool';
import * as logRepo from '../repositories/logRepo';
import * as reminderRepo from '../repositories/reminderRepo';
import { ValidationError } from '../utils/errors';

export const importRouter = Router();
importRouter.use(requireAuth);

// POST /api/v1/import/local/preview
importRouter.post(
  '/local/preview',
  validate(ImportPayloadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as { logs: unknown[]; reminders: unknown[] };

      const logErrors: string[] = [];
      let validLogs = 0;
      for (let i = 0; i < payload.logs.length; i++) {
        const result = validateLogBody(payload.logs[i]);
        if (result.success) validLogs++;
        else logErrors.push(`Log ${i}: ${result.error.issues.map((e) => e.message).join(', ')}`);
      }

      res.json({
        data: {
          logs: {
            total: payload.logs.length,
            valid: validLogs,
            errors: logErrors,
          },
          reminders: {
            total: payload.reminders.length,
          },
          message: `Preview: ${validLogs} logs and ${payload.reminders.length} reminders are ready to import.`,
          disclaimer: 'No data has been saved. Confirm the import to proceed.',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/import/local
importRouter.post(
  '/local',
  validate(ConfirmImportSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { payload } = req.body as {
        confirm: true;
        payload: { logs: unknown[]; reminders: unknown[] };
      };

      let createdLogs = 0;
      let createdReminders = 0;
      const logErrors: string[] = [];

      await withTransaction(async (client) => {
        // Import logs
        for (let i = 0; i < payload.logs.length; i++) {
          const result = validateLogBody(payload.logs[i]);
          if (!result.success) {
            logErrors.push(`Log ${i}: skipped (invalid data)`);
            continue;
          }
          await logRepo.createLog(
            req.userId!,
            {
              category:    result.data.category,
              data:        result.data.data as Record<string, unknown>,
              unit:        result.data.unit,
              note:        result.data.note,
              occurred_at: result.data.occurred_at,
            },
            client
          );
          createdLogs++;
        }

        // Import reminders – never copy completion state or occurrences
        for (const rem of payload.reminders as Array<{
          title: string; note?: string; time_of_day: string;
          start_date: string; timezone: string; repeat_rule: string;
        }>) {
          await reminderRepo.createReminder(
            req.userId!,
            {
              title:       rem.title,
              note:        rem.note,
              time_of_day: rem.time_of_day,
              start_date:  rem.start_date,
              timezone:    rem.timezone,
              repeat_rule: rem.repeat_rule as any,
            },
            client
          );
          createdReminders++;
        }
      });

      res.status(201).json({
        data: {
          createdLogs,
          createdReminders,
          skippedLogs:   logErrors.length,
          logErrors,
          message: `Import complete: ${createdLogs} logs and ${createdReminders} reminders created.`,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
