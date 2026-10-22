/**
 * schemas/index.ts
 * All Zod validation schemas. Exported individually for use in route handlers.
 * Each log category has its own data schema; unknown fields are stripped.
 */

import { z } from 'zod';
import { isValidIANATimezone } from '../utils/timezone';

// ─── Shared primitives ──────────────────────────────────────────────────────

export const UUIDParam = z.object({ id: z.string().uuid('Invalid ID format') });

const PaginationQuery = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Profile ────────────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  display_name: z.string().max(100).optional(),
  timezone:     z
    .string()
    .refine(isValidIANATimezone, 'Invalid IANA timezone')
    .optional(),
}).strict();

// ─── Preferences ────────────────────────────────────────────────────────────

export const UpdatePreferencesSchema = z.object({
  theme:           z.enum(['calm_blue','nature_green','warm_sunset','high_contrast']).optional(),
  text_size:       z.enum(['standard','large','extra_large']).optional(),
  simple_language: z.boolean().optional(),
  interests:       z.array(z.string().max(50)).max(20).optional(),
  sound_enabled:   z.boolean().optional(),
  volume:          z.number().int().min(0).max(100).optional(),
  snooze_minutes:  z.number().int().min(1).max(60).optional(),
}).strict();

// ─── Health log data schemas (per category) ─────────────────────────────────

const MedicationData = z.object({
  name:     z.string().min(1).max(200),
  dose:     z.string().max(100).optional(),
  taken:    z.boolean().optional(),
}).strict();

const MealData = z.object({
  description: z.string().min(1).max(500),
  meal_type:   z.enum(['breakfast','lunch','dinner','snack']).optional(),
  carbs_g:     z.number().min(0).max(2000).optional(),
  calories:    z.number().min(0).max(10000).optional(),
}).strict();

const SleepData = z.object({
  duration_hours: z.number().min(0).max(24),
  quality:        z.enum(['poor','fair','good','excellent']).optional(),
  bedtime:        z.string().regex(/^\d{2}:\d{2}$/).optional(),
  wake_time:      z.string().regex(/^\d{2}:\d{2}$/).optional(),
}).strict();

const ActivityData = z.object({
  type:            z.string().min(1).max(100),
  duration_minutes: z.number().int().min(1).max(1440),
  intensity:       z.enum(['light','moderate','vigorous']).optional(),
}).strict();

const BloodPressureData = z.object({
  systolic:  z.number().int().min(50).max(300),
  diastolic: z.number().int().min(20).max(200),
  pulse:     z.number().int().min(20).max(300).optional(),
}).strict();

const GlucoseData = z.object({
  value:   z.number().min(0).max(2000),
  context: z.enum(['fasting','before_meal','after_meal','bedtime','random']).optional(),
}).strict();

const LOG_DATA_SCHEMAS: Record<string, z.ZodTypeAny> = {
  medication:     MedicationData,
  meal:           MealData,
  sleep:          SleepData,
  activity:       ActivityData,
  blood_pressure: BloodPressureData,
  glucose:        GlucoseData,
};

// Log category enum
const LOG_CATEGORIES = ['medication','meal','sleep','activity','blood_pressure','glucose'] as const;

// Base log body without the category-dependent data field
const BaseLogBody = z.object({
  category:    z.enum(LOG_CATEGORIES),
  occurred_at: z.string().datetime({ message: 'occurred_at must be an ISO 8601 datetime' }),
  unit:        z.string().max(50).optional(),
  note:        z.string().max(2000).optional(),
  data:        z.record(z.unknown()),  // refined below
});

/** Validates the full log creation body including category-specific data. */
export function validateLogBody(raw: unknown): { success: true; data: z.infer<typeof BaseLogBody> } | { success: false; error: z.ZodError } {
  const base = BaseLogBody.safeParse(raw);
  if (!base.success) return base;

  const dataSchema = LOG_DATA_SCHEMAS[base.data.category];
  const dataResult = dataSchema.safeParse(base.data.data);
  if (!dataResult.success) return { success: false, error: dataResult.error };

  return { success: true, data: { ...base.data, data: dataResult.data } };
}

export const CreateLogSchema = BaseLogBody; // used for route handler typing

export const UpdateLogSchema = z.object({
  occurred_at: z.string().datetime().optional(),
  unit:        z.string().max(50).optional(),
  note:        z.string().max(2000).optional(),
  data:        z.record(z.unknown()).optional(),
}).strict();

export const LogsQuerySchema = PaginationQuery.extend({
  category:   z.enum(LOG_CATEGORIES).optional(),
  from:       z.string().date().optional(),
  to:         z.string().date().optional(),
});

// ─── Reminders ──────────────────────────────────────────────────────────────

const REPEAT_RULES = ['none','daily','weekly','weekdays','weekends'] as const;

export const CreateReminderSchema = z.object({
  title:       z.string().min(1).max(200),
  note:        z.string().max(2000).optional(),
  time_of_day: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'time_of_day must be HH:MM or HH:MM:SS'),
  start_date:  z.string().date('start_date must be YYYY-MM-DD'),
  timezone:    z.string().refine(isValidIANATimezone, 'Invalid IANA timezone'),
  repeat_rule: z.enum(REPEAT_RULES).default('none'),
}).strict();

export const UpdateReminderSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  note:        z.string().max(2000).optional(),
  time_of_day: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  start_date:  z.string().date().optional(),
  timezone:    z.string().refine(isValidIANATimezone, 'Invalid IANA timezone').optional(),
  repeat_rule: z.enum(REPEAT_RULES).optional(),
  enabled:     z.boolean().optional(),
}).strict();

export const RemindersQuerySchema = PaginationQuery.extend({
  enabled: z.coerce.boolean().optional(),
  date:    z.string().date().optional(),
});

export const SnoozeSchema = z.object({
  minutes: z.number().int().min(1).max(1440).optional(),
}).strict();

// ─── Schedule copy ──────────────────────────────────────────────────────────

export const CopyYesterdaySchema = z.object({
  confirm: z.literal(true, { errorMap: () => ({ message: 'confirm must be true' }) }),
}).strict();

// ─── Assistant ──────────────────────────────────────────────────────────────

export const AssistantRequestSchema = z.object({
  message:  z.string().min(1).max(2000),
  context:  z.enum(['general','summary','log_suggestion','reminder_suggestion']).default('general'),
  date:     z.string().date().optional(),
}).strict();

// ─── Import ─────────────────────────────────────────────────────────────────

const ImportLogItem = z.object({
  category:    z.enum(LOG_CATEGORIES),
  occurred_at: z.string().datetime(),
  unit:        z.string().max(50).optional(),
  note:        z.string().max(2000).optional(),
  data:        z.record(z.unknown()),
});

const ImportReminderItem = z.object({
  title:       z.string().min(1).max(200),
  note:        z.string().max(2000).optional(),
  time_of_day: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  start_date:  z.string().date(),
  timezone:    z.string().refine(isValidIANATimezone, 'Invalid IANA timezone'),
  repeat_rule: z.enum(REPEAT_RULES).default('none'),
});

export const ImportPayloadSchema = z.object({
  logs:      z.array(ImportLogItem).max(500).default([]),
  reminders: z.array(ImportReminderItem).max(200).default([]),
}).strict();

export const ConfirmImportSchema = z.object({
  confirm: z.literal(true),
  payload: ImportPayloadSchema,
}).strict();

// ─── Summaries ──────────────────────────────────────────────────────────────

export const SummaryQuerySchema = z.object({
  type: z.enum(['daily','weekly','appointment']).default('daily'),
  date: z.string().date().optional(),
});
