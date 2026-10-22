/**
 * tests/ownership.test.ts
 * Proves that User A cannot read, edit, or delete User B's data.
 * Tests every resource type: logs and reminders.
 */

import request from 'supertest';
import { createApp } from '../src/app';
import { makeToken, USER_A, USER_B } from './helpers/tokenHelper';
import { seedProfile, cleanupUser, createTestLog, createTestReminder } from './helpers/dbHelper';

const app = createApp();

let logIdB: string;
let reminderIdB: string;

beforeAll(async () => {
  await seedProfile(USER_A);
  await seedProfile(USER_B);

  // Create records for User B
  const log = await createTestLog(USER_B);
  logIdB = log.id;

  const reminder = await createTestReminder(USER_B);
  reminderIdB = reminder.id;
});

afterAll(async () => {
  await cleanupUser(USER_A);
  await cleanupUser(USER_B);
});

describe('Data ownership isolation', () => {
  // ── Logs ──────────────────────────────────────────────────────────────────
  it('User A cannot read User B log by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/logs/${logIdB}`)
      .set('Authorization', `Bearer ${makeToken(USER_A)}`);
    expect(res.status).toBe(404);
  });

  it('User A cannot update User B log', async () => {
    const res = await request(app)
      .patch(`/api/v1/logs/${logIdB}`)
      .set('Authorization', `Bearer ${makeToken(USER_A)}`)
      .send({ note: 'Injected note' });
    expect(res.status).toBe(404);
  });

  it('User A cannot delete User B log', async () => {
    const res = await request(app)
      .delete(`/api/v1/logs/${logIdB}`)
      .set('Authorization', `Bearer ${makeToken(USER_A)}`);
    expect(res.status).toBe(404);
  });

  it("User A's log list does not include User B's logs", async () => {
    const res = await request(app)
      .get('/api/v1/logs')
      .set('Authorization', `Bearer ${makeToken(USER_A)}`);
    expect(res.status).toBe(200);
    const ids = (res.body.data as Array<{ id: string }>).map((l) => l.id);
    expect(ids).not.toContain(logIdB);
  });

  // ── Reminders ─────────────────────────────────────────────────────────────
  it('User A cannot read User B reminder by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/reminders/${reminderIdB}`)
      .set('Authorization', `Bearer ${makeToken(USER_A)}`);
    expect(res.status).toBe(404);
  });

  it('User A cannot update User B reminder', async () => {
    const res = await request(app)
      .patch(`/api/v1/reminders/${reminderIdB}`)
      .set('Authorization', `Bearer ${makeToken(USER_A)}`)
      .send({ title: 'Injected title' });
    expect(res.status).toBe(404);
  });

  it('User A cannot delete User B reminder', async () => {
    const res = await request(app)
      .delete(`/api/v1/reminders/${reminderIdB}`)
      .set('Authorization', `Bearer ${makeToken(USER_A)}`);
    expect(res.status).toBe(404);
  });

  it('User A cannot snooze User B reminder', async () => {
    const res = await request(app)
      .post(`/api/v1/reminders/${reminderIdB}/snooze`)
      .set('Authorization', `Bearer ${makeToken(USER_A)}`)
      .send({});
    expect(res.status).toBe(404);
  });

  it('User A cannot complete User B reminder', async () => {
    const res = await request(app)
      .post(`/api/v1/reminders/${reminderIdB}/complete`)
      .set('Authorization', `Bearer ${makeToken(USER_A)}`);
    expect(res.status).toBe(404);
  });

  it("User A's reminder list does not include User B's reminders", async () => {
    const res = await request(app)
      .get('/api/v1/reminders')
      .set('Authorization', `Bearer ${makeToken(USER_A)}`);
    expect(res.status).toBe(200);
    const ids = (res.body.data as Array<{ id: string }>).map((r) => r.id);
    expect(ids).not.toContain(reminderIdB);
  });
});
