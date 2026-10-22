-- Migration 002: health_logs table
-- All timestamps UTC (timestamptz). category and data validated in the app layer.

CREATE TABLE IF NOT EXISTS health_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category     TEXT NOT NULL
                 CHECK (category IN ('medication','meal','sleep','activity','blood_pressure','glucose')),
  data         JSONB NOT NULL DEFAULT '{}',
  unit         TEXT,
  note         TEXT,
  occurred_at  TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for owner-scoped queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_health_logs_user_id ON health_logs (user_id);

-- Index for date-range queries
CREATE INDEX IF NOT EXISTS idx_health_logs_occurred_at ON health_logs (user_id, occurred_at DESC);

-- Index for category filter
CREATE INDEX IF NOT EXISTS idx_health_logs_category ON health_logs (user_id, category);
