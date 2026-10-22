-- Migration 003: reminders table
-- time_of_day: wall-clock time in the reminder's own timezone.
-- repeat_rule: 'none' | 'daily' | 'weekly' | 'weekdays' | 'weekends'

CREATE TABLE IF NOT EXISTS reminders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  note         TEXT,
  time_of_day  TIME NOT NULL,                 -- local wall-clock time
  start_date   DATE NOT NULL,
  timezone     TEXT NOT NULL,                 -- IANA e.g. "Asia/Kolkata"
  repeat_rule  TEXT NOT NULL DEFAULT 'none'
                 CHECK (repeat_rule IN ('none','daily','weekly','weekdays','weekends')),
  enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders (user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON reminders (user_id, enabled);
