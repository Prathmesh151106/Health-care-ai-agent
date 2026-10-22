/**
 * tests/validation.test.ts
 * Zod schema validation tests.
 * Verifies that malformed, oversized, and unexpected input is rejected with 400.
 */

import request from 'supertest';
import { createApp } from '../src/app';
import { makeToken, USER_A } from './helpers/tokenHelper';
import { seedProfile, cleanupUser } from './helpers/dbHelper';

const app = createApp();
const AUTH = `Bearer ${makeToken(USER_A)}`;

beforeAll(async () => { await seedProfile(USER_A); });
afterAll(async ()  => { await cleanupUser(USER_A); });

describe('Log validation', () => {
  it('rejects a log with an unknown category', async () => {
    const res = await request(app)
      .post('/api/v1/logs')
      .set('Authorization', AUTH)
      .send({ category: 'xray', data: {}, occurred_at: new Date().toISOString() });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a sleep log with missing duration_hours', async () => {
    const res = await request(app)
      .post('/api/v1/logs')
      .set('Authorization', AUTH)
      .send({ category: 'sleep', data: { quality: 'good' }, occurred_at: new Date().toISOString() });
    expect(res.status).toBe(400);
  });

  it('rejects a blood_pressure log with invalid systolic value', async () => {
    const res = await request(app)
      .post('/api/v1/logs')
      .set('Authorization', AUTH)
      .send({
        category: 'blood_pressure',
        data:     { systolic: 999, diastolic: 80 },
        occurred_at: new Date().toISOString(),
      });
    expect(res.status).toBe(400);
  });

  it('rejects a log with extra unknown fields in data', async () => {
    const res = await request(app)
      .post('/api/v1/logs')
      .set('Authorization', AUTH)
      .send({
        category: 'sleep',
        data:     { duration_hours: 7, hack: 'DROP TABLE profiles;' },
        occurred_at: new Date().toISOString(),
      });
    // Strict schema strips unknown fields – should fail with strict()
    expect(res.status).toBe(400);
  });

  it('rejects a log with a note exceeding 2000 characters', async () => {
    const res = await request(app)
      .post('/api/v1/logs')
      .set('Authorization', AUTH)
      .send({
        category:    'sleep',
        data:        { duration_hours: 7 },
        note:        'a'.repeat(2001),
        occurred_at: new Date().toISOString(),
      });
    expect(res.status).toBe(400);
  });

  it('accepts a valid sleep log', async () => {
    const res = await request(app)
      .post('/api/v1/logs')
      .set('Authorization', AUTH)
      .send({
        category:    'sleep',
        data:        { duration_hours: 7, quality: 'good' },
        occurred_at: new Date().toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body.data.category).toBe('sleep');
  });

  it('accepts a valid medication log', async () => {
    const res = await request(app)
      .post('/api/v1/logs')
      .set('Authorization', AUTH)
      .send({
        category:    'medication',
        data:        { name: 'TestMed', dose: '10mg', taken: true },
        occurred_at: new Date().toISOString(),
      });
    expect(res.status).toBe(201);
  });

  it('accepts a valid blood_pressure log', async () => {
    const res = await request(app)
      .post('/api/v1/logs')
      .set('Authorization', AUTH)
      .send({
        category:    'blood_pressure',
        data:        { systolic: 120, diastolic: 80 },
        occurred_at: new Date().toISOString(),
      });
    expect(res.status).toBe(201);
  });
});

describe('Reminder validation', () => {
  it('rejects a reminder with an invalid timezone', async () => {
    const res = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', AUTH)
      .send({
        title: 'Test',
        time_of_day: '08:00',
        start_date:  new Date().toISOString().split('T')[0],
        timezone:    'Not/A/Timezone',
        repeat_rule: 'none',
      });
    expect(res.status).toBe(400);
  });

  it('rejects a reminder with invalid time_of_day format', async () => {
    const res = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', AUTH)
      .send({
        title:       'Test',
        time_of_day: '8am',
        start_date:  new Date().toISOString().split('T')[0],
        timezone:    'UTC',
        repeat_rule: 'none',
      });
    expect(res.status).toBe(400);
  });

  it('accepts a valid reminder', async () => {
    const res = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', AUTH)
      .send({
        title:       'Validation test reminder',
        time_of_day: '09:00',
        start_date:  new Date().toISOString().split('T')[0],
        timezone:    'UTC',
        repeat_rule: 'none',
      });
    expect(res.status).toBe(201);
  });
});

describe('ID parameter validation', () => {
  it('rejects non-UUID id params on logs', async () => {
    const res = await request(app)
      .get('/api/v1/logs/not-a-uuid')
      .set('Authorization', AUTH);
    expect(res.status).toBe(400);
  });

  it('rejects non-UUID id params on reminders', async () => {
    const res = await request(app)
      .get('/api/v1/reminders/12345')
      .set('Authorization', AUTH);
    expect(res.status).toBe(400);
  });
});
