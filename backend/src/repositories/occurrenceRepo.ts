/**
 * repositories/occurrenceRepo.ts
 * Reminder occurrence SQL – all queries scoped by user_id.
 * The unique constraint on (reminder_id, occurrence_date) is enforced at the DB level.
 */

import { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { ReminderOccurrence, OccurrenceStatus } from '../types';

/** Get or create an occurrence idempotently (INSERT … ON CONFLICT DO NOTHING). */
export async function upsertOccurrence(
  params: {
    reminderId: string;
    userId: string;
    occurrenceDate: string;
    dueAt: Date;
  },
  client?: PoolClient
): Promise<ReminderOccurrence> {
  const q = client ?? pool;
  await q.query(
    `INSERT INTO reminder_occurrences (reminder_id, user_id, occurrence_date, due_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (reminder_id, occurrence_date) DO NOTHING`,
    [params.reminderId, params.userId, params.occurrenceDate, params.dueAt]
  );
  const result = await q.query<ReminderOccurrence>(
    `SELECT * FROM reminder_occurrences
     WHERE reminder_id = $1 AND occurrence_date = $2`,
    [params.reminderId, params.occurrenceDate]
  );
  return result.rows[0];
}

/**
 * Fetch due, un-alerted occurrences for a user in a single transaction.
 * Marks last_alerted_at atomically to prevent duplicate alerts.
 */
export async function fetchAndMarkDue(
  userId: string,
  client: PoolClient
): Promise<ReminderOccurrence[]> {
  const now = new Date();
  // Lock the rows to prevent concurrent duplicate alerts
  const result = await client.query<ReminderOccurrence>(
    `SELECT o.* FROM reminder_occurrences o
     JOIN reminders r ON r.id = o.reminder_id
     WHERE o.user_id = $1
       AND o.status = 'pending'
       AND o.due_at <= $2
       AND o.last_alerted_at IS NULL
       AND (o.snoozed_until IS NULL OR o.snoozed_until <= $2)
       AND r.enabled = TRUE
     FOR UPDATE OF o SKIP LOCKED`,
    [userId, now]
  );

  if (result.rows.length === 0) return [];

  const ids = result.rows.map((r) => r.id);
  await client.query(
    `UPDATE reminder_occurrences SET last_alerted_at = $1
     WHERE id = ANY($2::uuid[])`,
    [now, ids]
  );

  return result.rows;
}

export async function getOccurrence(
  userId: string,
  id: string
): Promise<ReminderOccurrence | null> {
  const result = await pool.query<ReminderOccurrence>(
    'SELECT * FROM reminder_occurrences WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function getOccurrenceByReminderAndDate(
  reminderId: string,
  occurrenceDate: string
): Promise<ReminderOccurrence | null> {
  const result = await pool.query<ReminderOccurrence>(
    'SELECT * FROM reminder_occurrences WHERE reminder_id = $1 AND occurrence_date = $2',
    [reminderId, occurrenceDate]
  );
  return result.rows[0] ?? null;
}

export async function updateOccurrenceStatus(
  userId: string,
  id: string,
  update: {
    status: OccurrenceStatus;
    snoozed_until?: Date | null;
    completed_at?: Date | null;
    last_alerted_at?: Date | null;
  },
  client?: PoolClient
): Promise<ReminderOccurrence | null> {
  const q = client ?? pool;
  const sets: string[] = ['status = $1'];
  const values: unknown[] = [update.status];
  let idx = 2;

  if ('snoozed_until' in update) { sets.push(`snoozed_until = $${idx++}`); values.push(update.snoozed_until); }
  if ('completed_at' in update)  { sets.push(`completed_at = $${idx++}`);  values.push(update.completed_at); }
  if ('last_alerted_at' in update) { sets.push(`last_alerted_at = $${idx++}`); values.push(update.last_alerted_at); }

  values.push(id, userId);
  const result = await q.query<ReminderOccurrence>(
    `UPDATE reminder_occurrences SET ${sets.join(', ')}
     WHERE id = $${idx} AND user_id = $${idx + 1}
     RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function listOccurrencesByReminder(
  userId: string,
  reminderId: string
): Promise<ReminderOccurrence[]> {
  const result = await pool.query<ReminderOccurrence>(
    `SELECT * FROM reminder_occurrences
     WHERE reminder_id = $1 AND user_id = $2
     ORDER BY occurrence_date DESC`,
    [reminderId, userId]
  );
  return result.rows;
}
