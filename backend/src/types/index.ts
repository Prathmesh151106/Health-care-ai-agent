/**
 * types/index.ts
 * Shared TypeScript types for the backend.
 */

export type LogCategory =
  | 'medication'
  | 'meal'
  | 'sleep'
  | 'activity'
  | 'blood_pressure'
  | 'glucose';

export type RepeatRule = 'none' | 'daily' | 'weekly' | 'weekdays' | 'weekends';
export type OccurrenceStatus = 'pending' | 'completed' | 'snoozed' | 'skipped';
export type Theme = 'calm_blue' | 'nature_green' | 'warm_sunset' | 'high_contrast';
export type TextSize = 'standard' | 'large' | 'extra_large';

export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface Preferences {
  user_id: string;
  theme: Theme;
  text_size: TextSize;
  simple_language: boolean;
  interests: string[];
  sound_enabled: boolean;
  volume: number;
  snooze_minutes: number;
}

export interface HealthLog {
  id: string;
  user_id: string;
  category: LogCategory;
  data: Record<string, unknown>;
  unit: string | null;
  note: string | null;
  occurred_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  time_of_day: string; // HH:MM:SS
  start_date: string;  // YYYY-MM-DD
  timezone: string;
  repeat_rule: RepeatRule;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ReminderOccurrence {
  id: string;
  reminder_id: string;
  user_id: string;
  occurrence_date: string; // YYYY-MM-DD
  due_at: Date;
  status: OccurrenceStatus;
  snoozed_until: Date | null;
  completed_at: Date | null;
  last_alerted_at: Date | null;
}

/** Attached to req by the auth middleware after token verification */
export interface AuthenticatedRequest extends Express.Request {
  userId: string;
}

/** AI draft proposal – never auto-saved */
export interface AIDraft {
  type: 'log' | 'reminder' | 'text';
  text?: string;
  logDraft?: Partial<HealthLog>;
  reminderDraft?: Partial<Reminder>;
}

export interface AssistantResponse {
  message: string;
  isDemoMode: boolean;
  draft?: AIDraft;
  isEmergencyGuidance?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
