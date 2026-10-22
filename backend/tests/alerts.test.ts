/**
 * tests/alerts.test.ts
 * Tests for idempotent occurrence creation and alert-once behaviour.
 * Verifies that concurrent polling cannot create duplicate alerts.
 */

import { pool } from '../src/db/pool';
import { upsertOccurrence, fetchAndMarkDue } from '../src/repositories/occurrenceRepo';
import { buildDueAt, todayInTimezone } from '../src/utils/timezone';
import { seedProfile, cleanupUser, createTestReminder } from './helpers/dbHelper';
import { USER_A } from './helpers/tokenHelper';

beforeAll(async () => { await seedProfile(USER_A); });
afterAll(async ()  => { await cleanupUser(USER_A); });

describe('Occurrence idempotency', () => {
  it('creates an occurrence only once for the same reminder and date', async () => {
    const reminder = await createTestReminder(USER_A, {
      time_of_day: '10:00:00',
      timezone:    'UTC',
    });
    const today = todayInTimezone('UTC');
    const dueAt = buildDueAt(today, '10:00:00', 'UTC');

    // Call upsertOccurrence twice concurrently
    await Promise.all([
      upsertOccurrence({ reminderId: reminder.id, userId: USER_A, occurrenceDate: today, dueAt }),
      upsertOccurrence({ reminderId: reminder.id, userId: USER_A, occurrenceDate: today, dueAt }),
    ]);

    const result = await pool.query(
      `SELECT COUNT(*) FROM reminder_occurrences WHERE reminder_id = $1 AND occurrence_date = $2`,
      [reminder.id, today]
    );
    expect(parseInt(result.rows[0].count, 10)).toBe(1);
  });

  it('marks last_alerted_at exactly once per occurrence when fetched concurrently', async () => {
    const reminder = await createTestReminder(USER_A, {
      time_of_day: '00:01:00', // past due (UTC midnight + 1 min)
      start_date:  '2020-01-01',
      timezone:    'UTC',
    });
    const occDate = '2020-01-01';
    const dueAt   = new Date('2020-01-01T00:01:00Z');

    await upsertOccurrence({
      reminderId:     reminder.id,
      userId:         USER_A,
      occurrenceDate: occDate,
      dueAt,
    });

    // Simulate two concurrent poll calls
    const [results1, results2] = await Promise.all([
      (async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const rows = await fetchAndMarkDue(USER_A, client);
          await client.query('COMMIT');
          return rows;
        } finally { client.release(); }
      })(),
      (async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const rows = await fetchAndMarkDue(USER_A, client);
          await client.query('COMMIT');
          return rows;
        } finally { client.release(); }
      })(),
    ]);

    // Only one of the two calls should have returned the occurrence
    const totalAlerted = results1.length + results2.length;
    // Due to SKIP LOCKED, at most one gets it
    expect(totalAlerted).toBeLessThanOrEqual(1);

    // Verify last_alerted_at is set exactly once
    const row = await pool.query(
      `SELECT last_alerted_at FROM reminder_occurrences
       WHERE reminder_id = $1 AND occurrence_date = $2`,
      [reminder.id, occDate]
    );
    expect(row.rows[0].last_alerted_at).not.toBeNull();
  });
});
