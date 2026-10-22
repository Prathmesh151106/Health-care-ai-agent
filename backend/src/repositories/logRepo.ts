/**
 * repositories/logRepo.ts
 * Health log SQL – all queries scoped by user_id.
 * Uses parameterized queries only; no string concatenation with user data.
 */

import { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { HealthLog, LogCategory, PaginatedResult } from '../types';

interface LogFilters {
  category?: LogCategory;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export async function listLogs(
  userId: string,
  filters: LogFilters
): Promise<PaginatedResult<HealthLog>> {
  const conditions = ['user_id = $1'];
  const values: unknown[] = [userId];
  let idx = 2;

  if (filters.category) {
    conditions.push(`category = $${idx++}`);
    values.push(filters.category);
  }
  if (filters.from) {
    conditions.push(`occurred_at >= $${idx++}`);
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`occurred_at <= $${idx++}`);
    values.push(filters.to + 'T23:59:59.999Z');
  }

  const where = conditions.join(' AND ');
  const offset = (filters.page - 1) * filters.pageSize;

  const [countResult, dataResult] = await Promise.all([
    pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM health_logs WHERE ${where}`,
      values
    ),
    pool.query<HealthLog>(
      `SELECT * FROM health_logs WHERE ${where}
       ORDER BY occurred_at DESC
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

export async function getLog(userId: string, id: string): Promise<HealthLog | null> {
  const result = await pool.query<HealthLog>(
    'SELECT * FROM health_logs WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function createLog(
  userId: string,
  data: {
    category: string;
    data: Record<string, unknown>;
    unit?: string;
    note?: string;
    occurred_at: string;
  },
  client?: PoolClient
): Promise<HealthLog> {
  const q = client ?? pool;
  const result = await q.query<HealthLog>(
    `INSERT INTO health_logs (user_id, category, data, unit, note, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, data.category, data.data, data.unit ?? null, data.note ?? null, data.occurred_at]
  );
  return result.rows[0];
}

export async function updateLog(
  userId: string,
  id: string,
  updates: { data?: Record<string, unknown>; unit?: string; note?: string; occurred_at?: string }
): Promise<HealthLog | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.data !== undefined) { sets.push(`data = $${idx++}`); values.push(updates.data); }
  if (updates.unit !== undefined) { sets.push(`unit = $${idx++}`); values.push(updates.unit); }
  if (updates.note !== undefined) { sets.push(`note = $${idx++}`); values.push(updates.note); }
  if (updates.occurred_at !== undefined) { sets.push(`occurred_at = $${idx++}`); values.push(updates.occurred_at); }

  if (sets.length === 0) return getLog(userId, id);

  sets.push('updated_at = NOW()');
  values.push(id, userId);

  const result = await pool.query<HealthLog>(
    `UPDATE health_logs SET ${sets.join(', ')}
     WHERE id = $${idx} AND user_id = $${idx + 1}
     RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteLog(userId: string, id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM health_logs WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getLogsByDateRange(
  userId: string,
  from: string,
  to: string,
  category?: LogCategory
): Promise<HealthLog[]> {
  const conditions = ['user_id = $1', 'occurred_at >= $2', 'occurred_at <= $3'];
  const values: unknown[] = [userId, from, to];
  if (category) {
    conditions.push(`category = $4`);
    values.push(category);
  }
  const result = await pool.query<HealthLog>(
    `SELECT * FROM health_logs WHERE ${conditions.join(' AND ')} ORDER BY occurred_at ASC`,
    values
  );
  return result.rows;
}
