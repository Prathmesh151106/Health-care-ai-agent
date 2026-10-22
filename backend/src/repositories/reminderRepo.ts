/**
 * repositories/reminderRepo.ts
 * Reminder SQL – all queries scoped by user_id.
 */

import { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { Reminder, RepeatRule, PaginatedResult } from '../types';

interface ReminderFilters {
  enabled?: boolean;
  page: number;
  pageSize: number;
}

export async function listReminders(
  userId: string,
  filters: ReminderFilters
): Promise<PaginatedResult<Reminder>> {
  const conditions = ['user_id = $1'];
  const values: unknown[] = [userId];
  let idx = 2;

  if (filters.enabled !== undefined) {
    conditions.push(`enabled = $${idx++}`);
    values.push(filters.enabled);
  }

  const where = conditions.join(' AND ');
  const offset = (filters.page - 1) * filters.pageSize;

  const [countResult, dataResult] = await Promise.all([
    pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM reminders WHERE ${where}`,
      values
    ),
    pool.query<Reminder>(
      `SELECT * FROM reminders WHERE ${where}
       ORDER BY start_date ASC, time_of_day ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, filters.pageSize, offset]
    ),
  ]);

  return {
    data:     dataResult.rows,
    total:    parseInt(countResult.rows[0].total, 10),
    page:     filters.page,
    pageSize: filters.pageSize,
  };
}

export async function getReminder(userId: string, id: string): Promise<Reminder | null> {
  const result = await pool.query<Reminder>(
    'SELECT * FROM reminders WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function createReminder(
  userId: string,
  data: {
    title: string;
    note?: string;
    time_of_day: string;
    start_date: string;
    timezone: string;
    repeat_rule: RepeatRule;
  },
  client?: PoolClient
): Promise<Reminder> {
  const q = client ?? pool;
  const result = await q.query<Reminder>(
    `INSERT INTO reminders (user_id, title, note, time_of_day, start_date, timezone, repeat_rule)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, data.title, data.note ?? null, data.time_of_day, data.start_date, data.timezone, data.repeat_rule]
  );
  return result.rows[0];
}

export async function updateReminder(
  userId: string,
  id: string,
  updates: Partial<Pick<Reminder, 'title'|'note'|'time_of_day'|'start_date'|'timezone'|'repeat_rule'|'enabled'>>
): Promise<Reminder | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const fields: Array<keyof typeof updates> = ['title','note','time_of_day','start_date','timezone','repeat_rule','enabled'];
  for (const field of fields) {
    if (updates[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      values.push(updates[field]);
    }
  }

  if (sets.length === 0) return getReminder(userId, id);

  sets.push('updated_at = NOW()');
  values.push(id, userId);

  const result = await pool.query<Reminder>(
    `UPDATE reminders SET ${sets.join(', ')}
     WHERE id = $${idx} AND user_id = $${idx + 1}
     RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteReminder(userId: string, id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM reminders WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

/** Fetch reminders that were active (enabled) on a specific date for a user. */
export async function getRemindersByDate(
  userId: string,
  date: string
): Promise<Reminder[]> {
  const result = await pool.query<Reminder>(
    `SELECT * FROM reminders
     WHERE user_id = $1
       AND enabled = TRUE
       AND start_date <= $2
     ORDER BY time_of_day ASC`,
    [userId, date]
  );
  return result.rows;
}

/** Check if a reminder with the same title+time_of_day exists for a user on a start_date. */
export async function findDuplicateReminder(
  userId: string,
  title: string,
  timeOfDay: string,
  startDate: string,
  client?: PoolClient
): Promise<boolean> {
  const q = client ?? pool;
  const result = await q.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM reminders
     WHERE user_id = $1 AND title = $2 AND time_of_day = $3 AND start_date = $4`,
    [userId, title, timeOfDay, startDate]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}
