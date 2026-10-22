/**
 * services/occurrenceService.ts
 * Creates or retrieves reminder occurrences and computes due_at.
 */

import { withTransaction } from '../db/pool';
import * as occurrenceRepo from '../repositories/occurrenceRepo';
import * as reminderRepo from '../repositories/reminderRepo';
import { buildDueAt, todayInTimezone } from '../utils/timezone';
import { NotFoundError } from '../utils/errors';
import { ReminderOccurrence, Reminder } from '../types';

/**
 * Ensure an occurrence exists for a reminder on a given date.
 * Idempotent: uses INSERT … ON CONFLICT DO NOTHING.
 */
export async function ensureOccurrence(
  reminder: Reminder,
  occurrenceDate: string
): Promise<ReminderOccurrence> {
  const dueAt = buildDueAt(occurrenceDate, reminder.time_of_day, reminder.timezone);
  return occurrenceRepo.upsertOccurrence({
    reminderId:     reminder.id,
    userId:         reminder.user_id,
    occurrenceDate,
    dueAt,
  });
}

/**
 * Fetch due reminders and mark them as alerted – atomically.
 * Returns only reminders that have not yet been alerted this occurrence.
 */
export async function getDueOccurrences(userId: string): Promise<ReminderOccurrence[]> {
  return withTransaction(async (client) => {
    return occurrenceRepo.fetchAndMarkDue(userId, client);
  });
}

/**
 * Snooze an occurrence. Resets last_alerted_at so it alerts again at snoozed_until.
 */
export async function snoozeOccurrence(
  userId: string,
  occurrenceId: string,
  minutes: number
): Promise<ReminderOccurrence> {
  const occ = await occurrenceRepo.getOccurrence(userId, occurrenceId);
  if (!occ) throw new NotFoundError('Occurrence not found');

  const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
  const updated = await occurrenceRepo.updateOccurrenceStatus(userId, occurrenceId, {
    status:          'snoozed',
    snoozed_until:   snoozedUntil,
    last_alerted_at: null,
  });
  return updated!;
}

/**
 * Mark an occurrence as completed.
 */
export async function completeOccurrence(
  userId: string,
  occurrenceId: string
): Promise<ReminderOccurrence> {
  const occ = await occurrenceRepo.getOccurrence(userId, occurrenceId);
  if (!occ) throw new NotFoundError('Occurrence not found');

  const updated = await occurrenceRepo.updateOccurrenceStatus(userId, occurrenceId, {
    status:       'completed',
    completed_at: new Date(),
  });
  return updated!;
}

/**
 * Get or create today's occurrence for a reminder, then snooze or complete it.
 */
export async function getOrCreateTodayOccurrence(
  userId: string,
  reminderId: string
): Promise<ReminderOccurrence> {
  const reminder = await reminderRepo.getReminder(userId, reminderId);
  if (!reminder) throw new NotFoundError('Reminder not found');

  const today = todayInTimezone(reminder.timezone);
  return ensureOccurrence(reminder, today);
}
