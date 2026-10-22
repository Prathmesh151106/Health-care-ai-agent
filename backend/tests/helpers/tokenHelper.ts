/**
 * tests/helpers/tokenHelper.ts
 * Creates signed JWT tokens for tests.
 * Uses the HS256 symmetric secret from the test environment.
 * Never interacts with Supabase.
 */

import jwt from 'jsonwebtoken';

const SECRET = process.env.SUPABASE_JWT_SECRET ?? 'test-secret-key-minimum-32-chars-long!!';
const ISSUER = (process.env.SUPABASE_URL ?? 'https://test.supabase.co') + '/auth/v1';

export function makeToken(userId: string, expiresIn: any = '1h'): string {
  return jwt.sign(
    { sub: userId, aud: 'authenticated', role: 'authenticated' },
    SECRET,
    { issuer: ISSUER, expiresIn, algorithm: 'HS256' } as jwt.SignOptions
  );
}

export function makeExpiredToken(userId: string): string {
  return jwt.sign(
    { sub: userId, aud: 'authenticated', role: 'authenticated' },
    SECRET,
    { issuer: ISSUER, expiresIn: -1, algorithm: 'HS256' } as jwt.SignOptions
  );
}

export function makeWrongSecretToken(userId: string): string {
  return jwt.sign(
    { sub: userId, aud: 'authenticated', role: 'authenticated' },
    'completely-wrong-secret-32-chars!!',
    { issuer: ISSUER, expiresIn: '1h', algorithm: 'HS256' } as jwt.SignOptions
  );
}

export const USER_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
export const USER_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

export const tokenA = makeToken(USER_A);
export const tokenB = makeToken(USER_B);
