/**
 * tests/reminders.test.ts
 * Tests for reminder timezone, recurrence, DST edge cases, snooze, and completion.
 */

import request from 'supertest';
import { createApp } from '../src/app';
import { makeToken, USER_A } from './helpers/tokenHelper';
import { seedProfile, cleanupUser } from './helpers/dbHelper';
import { buildDueAt, todayInTimezone } from '../src/utils/timezone';
import { fromZonedTime } from 'date-fns-tz';

const app = createApp();
const AUTH = `Bearer ${makeToken(USER_A)}`;

beforeAll(async () => { await seedProfile(USER_A, 'Asia/Kolkata'); });
afterAll(async ()  => { await cleanupUser(USER_A); });

describe('Reminder timezone handling', () => {
  it('stores timezone as IANA string', async () => {
    const res = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', AUTH)
      .send({
        title:       'TZ test reminder',
        time_of_day: '08:00',
        start_date:  todayInTimezone('Asia/Kolkata'),
        timezone:    'Asia/Kolkata',
        repeat_rule: 'daily',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.timezone).toBe('Asia/Kolkata');
  });

  it('rejects invalid IANA timezone', async () => {
    const res = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', AUTH)
      .send({
        title:       'Bad TZ',
        time_of_day: '08:00',
        start_date:  '2026-10-22',
        timezone:    'Europe/NotReal',
        repeat_rule: 'none',
      });
    expect(res.status).toBe(400);
  });
});

describe('buildDueAt timezone conversion', () => {
  it('converts IST 08:00 to correct UTC', () => {
    // IST = UTC+5:30, so 08:00 IST = 02:30 UTC
    const due = buildDueAt('2026-10-22', '08:00', 'Asia/Kolkata');
    expect(due.getUTCHours()).toBe(2);
    expect(due.getUTCMinutes()).toBe(30);
  });

  it('handles DST spring-forward: 2026-03-29 02:30 Europe/London (nonexistent)', () => {
    // In Europe/London, 2026-03-29 clocks spring forward at 01:00 → 02:00
    // 01:30 does not exist – date-fns-tz normalises to next valid instant
    const due = buildDueAt('2026-03-29', '01:30', 'Europe/London');
    // Result should be a valid UTC date (normalised forward)
    expect(due).toBeInstanceOf(Date);
    expect(isNaN(due.getTime())).toBe(false);
  });

  it('handles DST fall-back: 2026-10-25 01:30 Europe/London (ambiguous)', () => {
    // In Europe/London, 2026-10-25 clocks fall back at 02:00 → 01:00
    // 01:30 is ambiguous – date-fns-tz picks the first occurrence
    const due = buildDueAt('2026-10-25', '01:30', 'Europe/London');
    expect(due).toBeInstanceOf(Date);
    expect(isNaN(due.getTime())).toBe(false);
    // First occurrence of 01:30 is during BST (UTC+1) → 00:30 UTC
    expect(due.getUTCHours()).toBe(0);
    expect(due.getUTCMinutes()).toBe(30);
  });

  it('converts New York midnight correctly', () => {
    // New York EST = UTC-5, so 00:00 = 05:00 UTC
    const due = buildDueAt('2026-01-15', '00:00', 'America/New_York');
    expect(due.getUTCHours()).toBe(5);
    expect(due.getUTCMinutes()).toBe(0);
  });
});

describe('Reminder snooze and complete flow', () => {
  let reminderId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', AUTH)
      .send({
        title:       `Snooze test ${Date.now()}`,
        time_of_day: '08:00',
        start_date:  todayInTimezone('UTC'),
        timezone:    'UTC',
        repeat_rule: 'none',
      });
    reminderId = res.body.data.id;
  });

  it('snoozes a reminder and updates occurrence', async () => {
    const res = await request(app)
      .post(`/api/v1/reminders/${reminderId}/snooze`)
      .set('Authorization', AUTH)
      .send({ minutes: 15 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('snoozed');
    expect(res.body.data.snoozed_until).toBeTruthy();
  });

  it('completes a reminder and updates occurrence', async () => {
    const res = await request(app)
      .post(`/api/v1/reminders/${reminderId}/complete`)
      .set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.completed_at).toBeTruthy();
  });

  it('snooze validates minutes is a positive integer', async () => {
    const res = await request(app)
      .post(`/api/v1/reminders/${reminderId}/snooze`)
      .set('Authorization', AUTH)
      .send({ minutes: -5 });
    expect(res.status).toBe(400);
  });
});
