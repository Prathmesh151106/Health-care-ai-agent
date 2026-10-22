-- Migration 001: profiles and preferences tables
-- Idempotent: safe to run on an empty or partially migrated database.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles: one row per authenticated user (Supabase Auth UUID)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY,            -- matches Supabase Auth user id
  display_name TEXT,
  timezone     TEXT NOT NULL DEFAULT 'UTC',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles (id);

-- Preferences: one-to-one with profiles
CREATE TABLE IF NOT EXISTS preferences (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme           TEXT NOT NULL DEFAULT 'calm_blue'
                    CHECK (theme IN ('calm_blue','nature_green','warm_sunset','high_contrast')),
  text_size       TEXT NOT NULL DEFAULT 'standard'
                    CHECK (text_size IN ('standard','large','extra_large')),
  simple_language BOOLEAN NOT NULL DEFAULT FALSE,
  interests       TEXT[] NOT NULL DEFAULT '{}',
  sound_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  volume          SMALLINT NOT NULL DEFAULT 70 CHECK (volume BETWEEN 0 AND 100),
  snooze_minutes  SMALLINT NOT NULL DEFAULT 10 CHECK (snooze_minutes BETWEEN 1 AND 60)
);
