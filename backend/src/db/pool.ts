/**
 * db/pool.ts
 * PostgreSQL connection pool. One shared pool for the whole application.
 * Supports SSL (required on Render). Closes gracefully on shutdown.
 */

import { Pool, PoolClient } from 'pg';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const sslConfig = env.databaseSsl
  ? { ssl: { rejectUnauthorized: false } }
  : {};

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ...sslConfig,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

/**
 * Run a callback within a transaction. Rolls back on any error.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closePgPool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}
