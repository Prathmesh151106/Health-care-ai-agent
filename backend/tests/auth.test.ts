/**
 * tests/auth.test.ts
 * Tests for authentication middleware:
 *  - Missing token → 401
 *  - Malformed token → 401
 *  - Expired token → 401
 *  - Wrong secret → 401
 *  - Valid token → passes through
 */

import request from 'supertest';
import { createApp } from '../src/app';
import {
  makeToken,
  makeExpiredToken,
  makeWrongSecretToken,
  USER_A,
} from './helpers/tokenHelper';
import { seedProfile, cleanupUser } from './helpers/dbHelper';

const app = createApp();

beforeAll(async () => {
  await seedProfile(USER_A);
});

afterAll(async () => {
  await cleanupUser(USER_A);
});

describe('Authentication middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/v1/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_ERROR');
  });

  it('returns 401 when Authorization header has wrong scheme', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${makeExpiredToken(USER_A)}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_ERROR');
  });

  it('returns 401 for a token signed with the wrong secret', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${makeWrongSecretToken(USER_A)}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a completely malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer not.a.real.jwt.token');
    expect(res.status).toBe(401);
  });

  it('accepts a valid token and returns the profile', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${makeToken(USER_A)}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(USER_A);
  });

  it('health check is public (no token required)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('error responses never expose stack traces or secrets', async () => {
    const res = await request(app).get('/api/v1/me');
    expect(res.body).not.toHaveProperty('stack');
    expect(JSON.stringify(res.body)).not.toMatch(/password|secret|token|key/i);
  });
});
