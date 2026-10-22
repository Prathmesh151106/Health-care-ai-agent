/**
 * types/index.ts
 * Unified domain models matching backend Zod schemas and DB types.
 */

export type LogCategory =
  | 'medication'
  | 'meal'
  | 'sleep'
  | 'activity'
  | 'blood_pressure'
  | 'glucose';

export type LogData = Record<string, string | number | boolean | null>;

export interface HealthLog {
  id: string;
  userId?: string;
  category: LogCategory;
  data: LogData;
  unit?: string;
  note?: string;
  occurredAt: string; // ISO 8601 UTC
  createdAt?: string;
}

export type NewHealthLog = Omit<HealthLog, 'id' | 'userId' | 'createdAt'>;

export type RepeatRule = 'none' | 'daily' | { weekly: number[] };

export interface Reminder {
  id: string;
  userId?: string;
  title: string;
  note?: string;
  timeOfDay: string; // HH:mm
  startDate: string;  // YYYY-MM-DD
  timezone: string;   // IANA timezone, e.g. 'America/New_York'
  repeatRule: RepeatRule;
  enabled: boolean;
  createdAt?: string;
}

export type NewReminder = Omit<Reminder, 'id' | 'userId' | 'createdAt'>;

export interface DueOccurrence {
  occurrenceId: string;
  reminderId: string;
  title: string;
  dueAt: string; // ISO 8601
}

export interface Preferences {
  theme: 'calm-blue' | 'nature-green' | 'warm-sunset' | 'high-contrast';
  textSize: 'standard' | 'large' | 'extra-large';
  simpleLanguage: boolean;
  interests: string[];
  soundEnabled: boolean;
  volume: number; // 0.0 to 1.0
  snoozeMinutes: number;
}

export interface Profile {
  id: string;
  timezone: string;
  email?: string;
}

export interface Page<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface CopyPreview {
  items: { title: string; timeOfDay: string }[];
  willCreate: number;
  willSkip: number;
}

export type AssistantDraft =
  | { type: 'log'; payload: NewHealthLog }
  | { type: 'reminder'; payload: NewReminder };

export interface AssistantReply {
  reply: string;
  drafts?: AssistantDraft[];
  demo?: boolean;
  urgentGuidance?: string;
}

export interface Summary {
  kind: 'daily' | 'weekly' | 'appointment';
  dateRange: { from: string; to: string };
  totalLogs: number;
  categoryCounts: Record<string, number>;
  logs: HealthLog[];
  remindersCount: number;
  disclaimer: string;
}

export interface DataStore {
  getProfile(): Promise<Profile>;
  updateProfile(p: Partial<Profile>): Promise<Profile>;

  getPreferences(): Promise<Preferences>;
  updatePreferences(p: Partial<Preferences>): Promise<Preferences>;

  listLogs(f?: { category?: LogCategory; from?: string; to?: string; cursor?: string }): Promise<Page<HealthLog>>;
  createLog(l: NewHealthLog): Promise<HealthLog>;
  updateLog(id: string, l: Partial<NewHealthLog>): Promise<HealthLog>;
  deleteLog(id: string): Promise<void>;

  listReminders(): Promise<Reminder[]>;
  createReminder(r: NewReminder): Promise<Reminder>;
  updateReminder(id: string, r: Partial<NewReminder>): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;

  getDueReminders(): Promise<DueOccurrence[]>;
  snooze(occurrenceId: string, minutes: number): Promise<void>;
  complete(occurrenceId: string): Promise<void>;

  previewCopyYesterday(): Promise<CopyPreview>;
  confirmCopyYesterday(): Promise<{ created: number; skipped: number }>;

  getSummary(kind: 'daily' | 'weekly' | 'appointment'): Promise<Summary>;
  askAssistant(message: string): Promise<AssistantReply>;
  importLocalData(): Promise<{ logs: number; reminders: number }>;
}
