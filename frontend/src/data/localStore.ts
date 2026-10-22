/**
 * data/localStore.ts
 * Standalone offline storage implementation for Demo Mode.
 * Preserves all demo data across sessions without wiping or modifying anything on sign-in.
 * Never touches the backend.
 */

import {
  DataStore,
  HealthLog,
  NewHealthLog,
  Reminder,
  NewReminder,
  DueOccurrence,
  Preferences,
  Profile,
  Page,
  Summary,
  CopyPreview,
  AssistantReply,
  LogCategory
} from '../types';
import { getUserTimezone, getTodayDateString } from '../lib/time';

const STORAGE_KEYS = {
  LOGS: 'dhc_logs',
  REMINDERS: 'dhc_reminders',
  PREFERENCES: 'dhc_preferences',
  PROFILE: 'dhc_profile',
  COMPLETED: 'dhc_completed_occurrences'
};

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'calm-blue',
  textSize: 'standard',
  simpleLanguage: false,
  interests: ['Gardening', 'Morning Walks'],
  soundEnabled: true,
  volume: 0.7,
  snoozeMinutes: 10
};

function readStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or disabled
  }
}

export class LocalStore implements DataStore {
  async getProfile(): Promise<Profile> {
    return readStorage<Profile>(STORAGE_KEYS.PROFILE, {
      id: 'demo-local-user',
      timezone: getUserTimezone()
    });
  }

  async updateProfile(p: Partial<Profile>): Promise<Profile> {
    const curr = await this.getProfile();
    const updated = { ...curr, ...p };
    writeStorage(STORAGE_KEYS.PROFILE, updated);
    return updated;
  }

  async getPreferences(): Promise<Preferences> {
    return readStorage<Preferences>(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
  }

  async updatePreferences(p: Partial<Preferences>): Promise<Preferences> {
    const curr = await this.getPreferences();
    const updated = { ...curr, ...p };
    writeStorage(STORAGE_KEYS.PREFERENCES, updated);
    return updated;
  }

  async listLogs(f?: { category?: LogCategory; from?: string; to?: string; cursor?: string }): Promise<Page<HealthLog>> {
    const logs = readStorage<HealthLog[]>(STORAGE_KEYS.LOGS, []);
    let filtered = [...logs];

    if (f?.category) {
      filtered = filtered.filter((l) => l.category === f.category);
    }
    if (f?.from) {
      const fromMs = new Date(f.from).getTime();
      filtered = filtered.filter((l) => new Date(l.occurredAt).getTime() >= fromMs);
    }
    if (f?.to) {
      const toMs = new Date(f.to).getTime();
      filtered = filtered.filter((l) => new Date(l.occurredAt).getTime() <= toMs);
    }

    filtered.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    return {
      items: filtered,
      hasMore: false
    };
  }

  async createLog(l: NewHealthLog): Promise<HealthLog> {
    const logs = readStorage<HealthLog[]>(STORAGE_KEYS.LOGS, []);
    const newLog: HealthLog = {
      ...l,
      id: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    writeStorage(STORAGE_KEYS.LOGS, logs);
    return newLog;
  }

  async updateLog(id: string, l: Partial<NewHealthLog>): Promise<HealthLog> {
    const logs = readStorage<HealthLog[]>(STORAGE_KEYS.LOGS, []);
    const index = logs.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Log not found');
    logs[index] = { ...logs[index], ...l };
    writeStorage(STORAGE_KEYS.LOGS, logs);
    return logs[index];
  }

  async deleteLog(id: string): Promise<void> {
    const logs = readStorage<HealthLog[]>(STORAGE_KEYS.LOGS, []);
    const updated = logs.filter((item) => item.id !== id);
    writeStorage(STORAGE_KEYS.LOGS, updated);
  }

  async listReminders(): Promise<Reminder[]> {
    return readStorage<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
  }

  async createReminder(r: NewReminder): Promise<Reminder> {
    const reminders = readStorage<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
    const newRem: Reminder = {
      ...r,
      id: crypto.randomUUID ? crypto.randomUUID() : `rem-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString()
    };
    reminders.push(newRem);
    writeStorage(STORAGE_KEYS.REMINDERS, reminders);
    return newRem;
  }

  async updateReminder(id: string, r: Partial<NewReminder>): Promise<Reminder> {
    const reminders = readStorage<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
    const index = reminders.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Reminder not found');
    reminders[index] = { ...reminders[index], ...r };
    writeStorage(STORAGE_KEYS.REMINDERS, reminders);
    return reminders[index];
  }

  async deleteReminder(id: string): Promise<void> {
    const reminders = readStorage<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
    const updated = reminders.filter((item) => item.id !== id);
    writeStorage(STORAGE_KEYS.REMINDERS, updated);
  }

  async getDueReminders(): Promise<DueOccurrence[]> {
    const reminders = await this.listReminders();
    const completed = readStorage<string[]>(STORAGE_KEYS.COMPLETED, []);
    const todayStr = getTodayDateString();
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const nowMinutes = currentH * 60 + currentM;

    const due: DueOccurrence[] = [];

    for (const r of reminders) {
      if (!r.enabled) continue;
      const [h, m] = r.timeOfDay.split(':').map(Number);
      const remMinutes = h * 60 + m;

      // Occurs if scheduled for now or up to 60 mins past
      if (nowMinutes >= remMinutes && nowMinutes - remMinutes <= 60) {
        const occId = `demo-occ-${r.id}-${todayStr}-${r.timeOfDay}`;
        if (!completed.includes(occId)) {
          due.push({
            occurrenceId: occId,
            reminderId: r.id,
            title: r.title,
            dueAt: new Date().toISOString()
          });
        }
      }
    }

    return due;
  }

  async snooze(occurrenceId: string, _minutes: number): Promise<void> {
    // In demo mode, mark as dismissed for this moment
    const completed = readStorage<string[]>(STORAGE_KEYS.COMPLETED, []);
    if (!completed.includes(occurrenceId)) {
      completed.push(occurrenceId);
      writeStorage(STORAGE_KEYS.COMPLETED, completed);
    }
  }

  async complete(occurrenceId: string): Promise<void> {
    const completed = readStorage<string[]>(STORAGE_KEYS.COMPLETED, []);
    if (!completed.includes(occurrenceId)) {
      completed.push(occurrenceId);
      writeStorage(STORAGE_KEYS.COMPLETED, completed);
    }
  }

  async previewCopyYesterday(): Promise<CopyPreview> {
    const reminders = await this.listReminders();
    return {
      items: reminders.map((r) => ({ title: r.title, timeOfDay: r.timeOfDay })),
      willCreate: reminders.length,
      willSkip: 0
    };
  }

  async confirmCopyYesterday(): Promise<{ created: number; skipped: number }> {
    const reminders = await this.listReminders();
    return { created: reminders.length, skipped: 0 };
  }

  async getSummary(kind: 'daily' | 'weekly' | 'appointment'): Promise<Summary> {
    const logs = (await this.listLogs()).items;
    const reminders = await this.listReminders();

    const counts: Record<string, number> = {};
    for (const l of logs) {
      counts[l.category] = (counts[l.category] || 0) + 1;
    }

    return {
      kind,
      dateRange: {
        from: new Date(Date.now() - 86400000 * (kind === 'weekly' ? 7 : 1)).toISOString(),
        to: new Date().toISOString()
      },
      totalLogs: logs.length,
      categoryCounts: counts,
      logs: logs.slice(0, 20),
      remindersCount: reminders.length,
      disclaimer: 'This summary is a factual record of your logged entries. It is not medical advice.'
    };
  }

  async askAssistant(message: string): Promise<AssistantReply> {
    const lower = message.toLowerCase();
    const urgentKeywords = ['chest pain', 'cannot breathe', 'difficulty breathing', 'severe bleeding', 'stroke', 'passed out', 'overdose'];
    const hasEmergency = urgentKeywords.some((kw) => lower.includes(kw));

    if (hasEmergency) {
      return {
        reply: 'Please seek urgent medical evaluation or call local emergency services immediately.',
        urgentGuidance: 'If you are experiencing a medical emergency, call 911 or visit the nearest emergency room immediately.',
        demo: true
      };
    }

    if (lower.includes('water') || lower.includes('walk') || lower.includes('exercise')) {
      return {
        reply: 'I drafted an activity entry for your log. Please review and confirm to save it.',
        demo: true,
        drafts: [
          {
            type: 'log',
            payload: {
              category: 'activity',
              data: { activity_name: 'Brisk Walk', duration_minutes: 20 },
              unit: 'minutes',
              occurredAt: new Date().toISOString()
            }
          }
        ]
      };
    }

    if (lower.includes('aspirin') || lower.includes('medication') || lower.includes('pill')) {
      return {
        reply: 'I prepared a draft reminder for you. You can review and save it below.',
        demo: true,
        drafts: [
          {
            type: 'reminder',
            payload: {
              title: 'Take prescribed medication',
              timeOfDay: '08:00',
              startDate: getTodayDateString(),
              timezone: getUserTimezone(),
              repeatRule: 'daily',
              enabled: true
            }
          }
        ]
      };
    }

    return {
      reply: "I'm running in demo mode. I can help organize your health logs and prepare reminder drafts when you mention activities, meals, or schedule times.",
      demo: true
    };
  }

  async importLocalData(): Promise<{ logs: number; reminders: number }> {
    const logs = readStorage<HealthLog[]>(STORAGE_KEYS.LOGS, []);
    const reminders = readStorage<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
    return { logs: logs.length, reminders: reminders.length };
  }
}

export const localStore = new LocalStore();
