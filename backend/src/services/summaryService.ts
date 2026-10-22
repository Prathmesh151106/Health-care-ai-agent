/**
 * services/summaryService.ts
 * Builds factual, text-based summaries of the user's own records.
 * Never diagnoses, interprets, or scores health readings.
 */

import * as logRepo from '../repositories/logRepo';
import { yesterdayInTimezone, todayInTimezone } from '../utils/timezone';
import { pool } from '../db/pool';

type SummaryType = 'daily' | 'weekly' | 'appointment';

interface Summary {
  type: SummaryType;
  dateRange: { from: string; to: string };
  logCount: number;
  byCategory: Record<string, number>;
  entries: Array<{ category: string; occurred_at: string; unit?: string | null }>;
  disclaimer: string;
}

const DISCLAIMER =
  'This summary contains only the entries you recorded. ' +
  'It is not medical advice, a diagnosis, or an interpretation of your readings. ' +
  'Please discuss your health records with a qualified healthcare professional.';

async function getUserTimezone(userId: string): Promise<string> {
  const result = await pool.query<{ timezone: string }>(
    'SELECT timezone FROM profiles WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.timezone ?? 'UTC';
}

export async function buildSummary(
  userId: string,
  type: SummaryType,
  dateStr?: string
): Promise<Summary> {
  const tz = await getUserTimezone(userId);
  const today = todayInTimezone(tz);

  let from: string;
  let to: string;

  if (type === 'daily') {
    from = dateStr ?? today;
    to   = dateStr ?? today;
  } else if (type === 'weekly') {
    // Last 7 days inclusive
    const anchor = dateStr ?? today;
    const anchorDate = new Date(anchor);
    anchorDate.setDate(anchorDate.getDate() - 6);
    from = anchorDate.toISOString().split('T')[0];
    to   = anchor;
  } else {
    // Appointment: last 30 days
    const anchor = dateStr ?? today;
    const anchorDate = new Date(anchor);
    anchorDate.setDate(anchorDate.getDate() - 29);
    from = anchorDate.toISOString().split('T')[0];
    to   = anchor;
  }

  const logs = await logRepo.getLogsByDateRange(userId, from + 'T00:00:00Z', to + 'T23:59:59.999Z');

  const byCategory: Record<string, number> = {};
  for (const log of logs) {
    byCategory[log.category] = (byCategory[log.category] ?? 0) + 1;
  }

  return {
    type,
    dateRange: { from, to },
    logCount:   logs.length,
    byCategory,
    // Return minimal entry info – no note content to avoid logging health details
    entries: logs.map((l) => ({
      category:    l.category,
      occurred_at: l.occurred_at.toISOString(),
      unit:        l.unit,
    })),
    disclaimer: DISCLAIMER,
  };
}
