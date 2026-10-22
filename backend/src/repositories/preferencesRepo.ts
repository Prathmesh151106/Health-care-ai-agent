/**
 * repositories/preferencesRepo.ts
 * Preferences SQL – always scoped by user_id.
 */

import { pool } from '../db/pool';
import { Preferences } from '../types';

const DEFAULTS: Omit<Preferences, 'user_id'> = {
  theme:           'calm_blue',
  text_size:       'standard',
  simple_language: false,
  interests:       [],
  sound_enabled:   true,
  volume:          70,
  snooze_minutes:  10,
};

export async function getOrCreatePreferences(userId: string): Promise<Preferences> {
  const result = await pool.query<Preferences>(
    `INSERT INTO preferences (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING;
     SELECT * FROM preferences WHERE user_id = $1`,
    [userId]
  );
  // The above runs two statements; use a transaction-safe approach
  const select = await pool.query<Preferences>(
    'SELECT * FROM preferences WHERE user_id = $1',
    [userId]
  );
  if (select.rows[0]) return select.rows[0];

  // Insert default row
  const insert = await pool.query<Preferences>(
    `INSERT INTO preferences (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING *`,
    [userId]
  );
  if (insert.rows[0]) return insert.rows[0];

  // Another process inserted concurrently – just read it
  const retry = await pool.query<Preferences>(
    'SELECT * FROM preferences WHERE user_id = $1',
    [userId]
  );
  return retry.rows[0] ?? { user_id: userId, ...DEFAULTS };
}

export async function updatePreferences(
  userId: string,
  updates: Partial<Omit<Preferences, 'user_id'>>
): Promise<Preferences> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const fields = [
    'theme','text_size','simple_language','interests',
    'sound_enabled','volume','snooze_minutes',
  ] as const;

  for (const field of fields) {
    if (updates[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      values.push(updates[field]);
    }
  }

  if (sets.length === 0) return getOrCreatePreferences(userId);

  values.push(userId);
  const result = await pool.query<Preferences>(
    `UPDATE preferences SET ${sets.join(', ')} WHERE user_id = $${idx}
     RETURNING *`,
    values
  );
  return result.rows[0];
}
