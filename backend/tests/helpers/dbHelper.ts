/**
 * tests/helpers/dbHelper.ts
 * Database test helpers.
 * Seeds and cleans up user data in the test database.
 * NEVER touches the production database.
 */

import { pool } from '../../src/db/pool';

export async function seedProfile(userId: string, timezone = 'UTC'): Promise<void> {
  await pool.query(
    `INSERT INTO profiles (id, timezone) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET timezone = $2`,
    [userId, timezone]
  );
  await pool.query(
    `INSERT INTO preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [userId]
  );
}

export async function cleanupUser(userId: string): Promise<void> {
  // Cascade delete handles all owned records
  await pool.query('DELETE FROM profiles WHERE id = $1', [userId]);
}

export async function createTestLog(
  userId: string,
  overrides: Partial<{
    category: string;
    data: object;
    occurred_at: string;
    unit: string;
    note: string;
  }> = {}
) {
  const result = await pool.query(
    `INSERT INTO health_logs (user_id, category, data, unit, note, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      userId,
      overrides.category ?? 'sleep',
      JSON.stringify(overrides.data ?? { duration_hours: 7 }),
      overrides.unit ?? null,
      overrides.note ?? null,
      overrides.occurred_at ?? new Date().toISOString(),
    ]
  );
  return result.rows[0];
}

export async function createTestReminder(
  userId: string,
  overrides: Partial<{
    title: string;
    time_of_day: string;
    start_date: string;
    timezone: string;
    repeat_rule: string;
  }> = {}
) {
  const result = await pool.query(
    `INSERT INTO reminders (user_id, title, time_of_day, start_date, timezone, repeat_rule)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      userId,
      overrides.title ?? 'Test Reminder',
      overrides.time_of_day ?? '08:00:00',
      overrides.start_date ?? new Date().toISOString().split('T')[0],
      overrides.timezone ?? 'UTC',
      overrides.repeat_rule ?? 'none',
    ]
  );
  return result.rows[0];
}
