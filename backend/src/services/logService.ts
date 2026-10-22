/**
 * services/logService.ts
 * Business rules for health logs.
 */

import * as logRepo from '../repositories/logRepo';
import { validateLogBody } from '../schemas';
import { ValidationError, NotFoundError } from '../utils/errors';
import { HealthLog, LogCategory, PaginatedResult } from '../types';

export async function listLogs(
  userId: string,
  filters: { category?: string; from?: string; to?: string; page: number; pageSize: number }
): Promise<PaginatedResult<HealthLog>> {
  return logRepo.listLogs(userId, {
    category: filters.category as LogCategory | undefined,
    from:     filters.from,
    to:       filters.to,
    page:     filters.page,
    pageSize: filters.pageSize,
  });
}

export async function getLog(userId: string, id: string): Promise<HealthLog> {
  const log = await logRepo.getLog(userId, id);
  if (!log) throw new NotFoundError('Log not found');
  return log;
}

export async function createLog(userId: string, body: unknown): Promise<HealthLog> {
  const result = validateLogBody(body);
  if (!result.success) {
    throw new ValidationError('Invalid log data', result.error.issues);
  }
  return logRepo.createLog(userId, {
    category:    result.data.category,
    data:        result.data.data as Record<string, unknown>,
    unit:        result.data.unit,
    note:        result.data.note,
    occurred_at: result.data.occurred_at,
  });
}

export async function updateLog(
  userId: string,
  id: string,
  updates: { data?: Record<string, unknown>; unit?: string; note?: string; occurred_at?: string }
): Promise<HealthLog> {
  const existing = await logRepo.getLog(userId, id);
  if (!existing) throw new NotFoundError('Log not found');

  // If data is being updated, validate it against the existing category
  if (updates.data) {
    const testBody = { ...existing, data: updates.data };
    const result = validateLogBody(testBody);
    if (!result.success) throw new ValidationError('Invalid log data', result.error.issues);
  }

  const updated = await logRepo.updateLog(userId, id, updates);
  if (!updated) throw new NotFoundError('Log not found');
  return updated;
}

export async function deleteLog(userId: string, id: string): Promise<void> {
  const deleted = await logRepo.deleteLog(userId, id);
  if (!deleted) throw new NotFoundError('Log not found');
}
