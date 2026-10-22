/**
 * services/scheduleCopyService.ts
 * "Copy yesterday's schedule" feature.
 *
 * Preview: returns what would be created, does NOT write anything.
 * Confirm: copies in a transaction, skips duplicates, never copies
 *          completion state, occurrences, or health logs.
 */

import { withTransaction } from '../db/pool';
import * as reminderRepo from '../repositories/reminderRepo';
import { yesterdayInTimezone, todayInTimezone } from '../utils/timezone';
import { NotFoundError } from '../utils/errors';
import { Reminder } from '../types';

export interface CopyPreview {
  toCreate: Array<Omit<Reminder, 'id'|'user_id'|'created_at'|'updated_at'>>;
  alreadyExists: number;
  userTimezone: string;
}

export interface CopyResult {
  created: number;
  skipped: number;
}

async function getUserTimezone(userId: string): Promise<string> {
  const { pool } = await import('../db/pool');
  const result = await pool.query<{ timezone: string }>(
    'SELECT timezone FROM profiles WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.timezone ?? 'UTC';
}

export async function previewCopyYesterday(userId: string): Promise<CopyPreview> {
  const tz = await getUserTimezone(userId);
  const yesterday = yesterdayInTimezone(tz);
  const today = todayInTimezone(tz);

  const yesterdayReminders = await reminderRepo.getRemindersByDate(userId, yesterday);
  if (yesterdayReminders.length === 0) {
    return { toCreate: [], alreadyExists: 0, userTimezone: tz };
  }

  // Check which ones already exist today (by title + time_of_day)
  const toCreate: Array<Omit<Reminder, 'id'|'user_id'|'created_at'|'updated_at'>> = [];
  let alreadyExists = 0;

  for (const r of yesterdayReminders) {
    const duplicate = await reminderRepo.findDuplicateReminder(userId, r.title, r.time_of_day, today);
    if (duplicate) {
      alreadyExists++;
    } else {
      toCreate.push({
        title:       r.title,
        note:        r.note,
        time_of_day: r.time_of_day,
        start_date:  today,
        timezone:    r.timezone,
        repeat_rule: r.repeat_rule,
        enabled:     true,
      });
    }
  }

  return { toCreate, alreadyExists, userTimezone: tz };
}

export async function confirmCopyYesterday(userId: string): Promise<CopyResult> {
  const tz = await getUserTimezone(userId);
  const yesterday = yesterdayInTimezone(tz);
  const today = todayInTimezone(tz);

  const yesterdayReminders = await reminderRepo.getRemindersByDate(userId, yesterday);
  if (yesterdayReminders.length === 0) {
    return { created: 0, skipped: 0 };
  }

  return withTransaction(async (client) => {
    let created = 0;
    let skipped = 0;

    for (const r of yesterdayReminders) {
      const duplicate = await reminderRepo.findDuplicateReminder(
        userId, r.title, r.time_of_day, today, client
      );
      if (duplicate) {
        skipped++;
        continue;
      }
      await reminderRepo.createReminder(
        userId,
        {
          title:       r.title,
          note:        r.note ?? undefined,
          time_of_day: r.time_of_day,
          start_date:  today,
          timezone:    r.timezone,
          repeat_rule: r.repeat_rule,
        },
        client
      );
      created++;
    }

    return { created, skipped };
  });
}
