/**
 * repositories/profileRepo.ts
 * All profile SQL – always scoped by user_id.
 */

import { pool } from '../db/pool';
import { Profile } from '../types';

export async function findOrCreateProfile(userId: string): Promise<Profile> {
  const result = await pool.query<Profile>(
    `INSERT INTO profiles (id) VALUES ($1)
     ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const result = await pool.query<Profile>(
    'SELECT * FROM profiles WHERE id = $1',
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function updateProfile(
  userId: string,
  updates: { display_name?: string; timezone?: string }
): Promise<Profile | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.display_name !== undefined) {
    sets.push(`display_name = $${idx++}`);
    values.push(updates.display_name);
  }
  if (updates.timezone !== undefined) {
    sets.push(`timezone = $${idx++}`);
    values.push(updates.timezone);
  }
  if (sets.length === 0) return getProfile(userId);

  sets.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await pool.query<Profile>(
    `UPDATE profiles SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}
