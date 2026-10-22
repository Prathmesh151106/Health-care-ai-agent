-- Migration 004: reminder_occurrences table
-- status: 'pending' | 'completed' | 'snoozed' | 'skipped'
-- Unique constraint on (reminder_id, occurrence_date) prevents duplicate occurrences.

CREATE TABLE IF NOT EXISTS reminder_occurrences (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reminder_id      UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  occurrence_date  DATE NOT NULL,
  due_at           TIMESTAMPTZ NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','completed','snoozed','skipped')),
  snoozed_until    TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  last_alerted_at  TIMESTAMPTZ,

  CONSTRAINT uq_reminder_occurrence UNIQUE (reminder_id, occurrence_date)
);

CREATE INDEX IF NOT EXISTS idx_occurrences_user_id     ON reminder_occurrences (user_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_reminder_id ON reminder_occurrences (reminder_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_due_at      ON reminder_occurrences (user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_occurrences_status      ON reminder_occurrences (user_id, status);
