/**
 * tests/helpers/setup.ts
 * Jest global setup: loads test environment variables.
 * Tests use an isolated test database (TEST_DATABASE_URL) or mocks.
 * Never connects to production data.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load test environment – falls back to .env if TEST_DATABASE_URL not set
dotenv.config({ path: path.join(__dirname, '../../.env.test'), override: false });
dotenv.config({ path: path.join(__dirname, '../../.env'), override: false });

// Override to use the test database – mandatory for integration tests
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/daily_health_companion_test';
}
// Use a symmetric secret for tests (no JWKS needed)
if (!process.env.SUPABASE_JWT_SECRET) {
  process.env.SUPABASE_JWT_SECRET = 'test-secret-key-minimum-32-chars-long!!';
}
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://test.supabase.co';
}
process.env.NODE_ENV = 'test';
process.env.PORT     = '0'; // random port for tests
