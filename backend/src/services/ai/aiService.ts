/**
 * services/ai/aiService.ts
 * Main AI service. Routes to demo mode or the real provider.
 * Enforces safety rules:
 *  - Sends minimum relevant data only
 *  - Validates response structure
 *  - Returns drafts only – never auto-saves
 *  - Emergency keywords always get emergency guidance
 *  - No secrets, stack traces, or internal details in responses
 */

import { env } from '../../config/env';
import { getDemoResponse } from './demoResponse';
import { getProviderAdapter } from './providerAdapter';
import { SYSTEM_PROMPT, DISCLAIMER } from './prompts';
import * as logRepo from '../../repositories/logRepo';
import { pool } from '../../db/pool';
import { AssistantResponse, AIDraft } from '../../types';
import { logger } from '../../utils/logger';
import { todayInTimezone } from '../../utils/timezone';

const EMERGENCY_KEYWORDS = [
  'chest pain','can\'t breathe','cannot breathe','unconscious','stroke','seizure',
  'emergency','heart attack','overdose','severe pain','can\'t move','cannot move',
  'bleeding heavily','difficulty breathing',
];

function isEmergency(message: string): boolean {
  const lower = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
}

async function getUserTimezone(userId: string): Promise<string> {
  const result = await pool.query<{ timezone: string }>(
    'SELECT timezone FROM profiles WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.timezone ?? 'UTC';
}

/** Build minimal context for the AI – only the most recent relevant entries. */
async function buildContext(userId: string, contextType: string, date?: string): Promise<string> {
  const tz = await getUserTimezone(userId);
  const today = date ?? todayInTimezone(tz);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const logs = await logRepo.getLogsByDateRange(
    userId,
    weekAgoStr + 'T00:00:00Z',
    today + 'T23:59:59.999Z'
  );

  // Only send category, date, and unit – NOT notes or raw data to limit PHI
  const summary = logs.slice(-30).map((l) => ({
    category:    l.category,
    occurred_at: l.occurred_at.toISOString().split('T')[0],
    unit:        l.unit,
  }));

  return `User's recent entries (last 7 days, up to 30, no personal notes): ${JSON.stringify(summary)}`;
}

function parseProviderResponse(raw: string): { message: string; draft?: AIDraft; isEmergency?: boolean } {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.type === 'emergency') {
      return {
        message:     'Please contact your local emergency services or a healthcare professional immediately.',
        isEmergency: true,
      };
    }
    if (parsed.type === 'log_draft' && parsed.draft) {
      return {
        message: String(parsed.message ?? ''),
        draft:   { type: 'log', logDraft: parsed.draft },
      };
    }
    if (parsed.type === 'reminder_draft' && parsed.draft) {
      return {
        message: String(parsed.message ?? ''),
        draft:   { type: 'reminder', reminderDraft: parsed.draft },
      };
    }
    return { message: String(parsed.message ?? raw) };
  } catch {
    // Plain text response
    return { message: raw.trim() };
  }
}

export async function askAssistant(
  userId: string,
  message: string,
  contextType: string,
  date?: string
): Promise<AssistantResponse> {
  // Emergency check before anything else
  if (isEmergency(message)) {
    return {
      message:             'Please contact your local emergency services or a healthcare professional immediately.',
      isDemoMode:          env.isDemoMode,
      isEmergencyGuidance: true,
    };
  }

  // Demo mode
  if (env.isDemoMode) {
    return getDemoResponse(message);
  }

  // Real provider
  try {
    const context = await buildContext(userId, contextType, date);
    const adapter = getProviderAdapter();

    const raw = await adapter.complete(
      [
        { role: 'system',    content: SYSTEM_PROMPT },
        { role: 'assistant', content: context },
        { role: 'user',      content: message },
      ],
      env.aiRequestTimeoutMs
    );

    const parsed = parseProviderResponse(raw);

    // Re-check emergency in the model's response
    if (parsed.isEmergency || isEmergency(parsed.message)) {
      return {
        message:             'Please contact your local emergency services or a healthcare professional immediately.',
        isDemoMode:          false,
        isEmergencyGuidance: true,
      };
    }

    return {
      message:    parsed.message + '\n\n' + DISCLAIMER,
      isDemoMode: false,
      draft:      parsed.draft,
    };
  } catch (err) {
    logger.error('AI service error', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw err;
  }
}
