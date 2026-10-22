/**
 * db/migrate.ts
 * Simple forward-only migration runner.
 * Reads SQL files from migrations/ in lexicographic order and runs each one
 * exactly once, tracked in a schema_migrations table.
 *
 * Run: npm run migrate
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[migrate] DATABASE_URL is not set');
    process.exit(1);
  }

  const sslEnabled = process.env.DATABASE_SSL === 'true';
  const pool = new Pool({
    connectionString: databaseUrl,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  const client = await pool.connect();
  try {
    // Create tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename  TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const filename of files) {
      const result = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [filename]
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`[migrate] Already applied: ${filename}`);
        continue;
      }

      console.log(`[migrate] Applying: ${filename}`);
      const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename]
        );
        await client.query('COMMIT');
        console.log(`[migrate] Applied: ${filename}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrate] Failed on ${filename}:`, err);
        process.exit(1);
      }
    }

    console.log('[migrate] All migrations applied successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('[migrate] Unexpected error:', err);
  process.exit(1);
});
