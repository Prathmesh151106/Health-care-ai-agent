/**
 * data/apiStore.ts
 * Real backend implementation communicating via apiClient.ts.
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
import { apiRequest } from '../lib/apiClient';

export class ApiStore implements DataStore {
  async getProfile(): Promise<Profile> {
    const res = await apiRequest<{ profile: Profile }>('/me');
    return res.profile;
  }

  async updateProfile(p: Partial<Profile>): Promise<Profile> {
    const res = await apiRequest<{ profile: Profile }>('/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(p)
    });
    return res.profile;
  }

  async getPreferences(): Promise<Preferences> {
    const res = await apiRequest<{ preferences: Preferences }>('/me');
    return res.preferences;
  }

  async updatePreferences(p: Partial<Preferences>): Promise<Preferences> {
    const res = await apiRequest<{ preferences: Preferences }>('/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ preferences: p })
    });
    return res.preferences;
  }

  async listLogs(f?: { category?: LogCategory; from?: string; to?: string; cursor?: string }): Promise<Page<HealthLog>> {
    const query = new URLSearchParams();
    if (f?.category) query.set('category', f.category);
    if (f?.from) query.set('from', f.from);
    if (f?.to) query.set('to', f.to);
    if (f?.cursor) query.set('cursor', f.cursor);
    const qs = query.toString() ? `?${query.toString()}` : '';

    const res = await apiRequest<{ logs: HealthLog[]; nextCursor?: string; hasMore: boolean }>(`/logs${qs}`);
    return {
      items: res.logs,
      nextCursor: res.nextCursor,
      hasMore: res.hasMore
    };
  }

  async createLog(l: NewHealthLog): Promise<HealthLog> {
    const res = await apiRequest<{ log: HealthLog }>('/logs', {
      method: 'POST',
      body: JSON.stringify(l)
    });
    return res.log;
  }

  async updateLog(id: string, l: Partial<NewHealthLog>): Promise<HealthLog> {
    const res = await apiRequest<{ log: HealthLog }>(`/logs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(l)
    });
    return res.log;
  }

  async deleteLog(id: string): Promise<void> {
    await apiRequest<void>(`/logs/${id}`, {
      method: 'DELETE'
    });
  }

  async listReminders(): Promise<Reminder[]> {
    const res = await apiRequest<{ reminders: Reminder[] }>('/reminders');
    return res.reminders;
  }

  async createReminder(r: NewReminder): Promise<Reminder> {
    const res = await apiRequest<{ reminder: Reminder }>('/reminders', {
      method: 'POST',
      body: JSON.stringify(r)
    });
    return res.reminder;
  }

  async updateReminder(id: string, r: Partial<NewReminder>): Promise<Reminder> {
    const res = await apiRequest<{ reminder: Reminder }>(`/reminders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(r)
    });
    return res.reminder;
  }

  async deleteReminder(id: string): Promise<void> {
    await apiRequest<void>(`/reminders/${id}`, {
      method: 'DELETE'
    });
  }

  async getDueReminders(): Promise<DueOccurrence[]> {
    const res = await apiRequest<{ occurrences: DueOccurrence[] }>('/reminders/due');
    return res.occurrences;
  }

  async snooze(occurrenceId: string, minutes: number): Promise<void> {
    await apiRequest<void>(`/reminders/occurrences/${occurrenceId}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ minutes })
    });
  }

  async complete(occurrenceId: string): Promise<void> {
    await apiRequest<void>(`/reminders/occurrences/${occurrenceId}/complete`, {
      method: 'POST'
    });
  }

  async previewCopyYesterday(): Promise<CopyPreview> {
    const res = await apiRequest<CopyPreview>('/reminders/copy-yesterday/preview', {
      method: 'POST'
    });
    return res;
  }

  async confirmCopyYesterday(): Promise<{ created: number; skipped: number }> {
    const res = await apiRequest<{ created: number; skipped: number }>('/reminders/copy-yesterday/confirm', {
      method: 'POST',
      body: JSON.stringify({ confirm: true })
    });
    return res;
  }

  async getSummary(kind: 'daily' | 'weekly' | 'appointment'): Promise<Summary> {
    const endpoint = kind === 'weekly' ? '/summaries/yesterday' : '/summaries/today';
    const res = await apiRequest<{ summary: Summary }>(endpoint);
    return res.summary;
  }

  async askAssistant(message: string): Promise<AssistantReply> {
    const res = await apiRequest<AssistantReply>('/assistant', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    return res;
  }

  async importLocalData(): Promise<{ logs: number; reminders: number }> {
    const localLogsRaw = localStorage.getItem('dhc_logs');
    const localRemindersRaw = localStorage.getItem('dhc_reminders');

    const logs = localLogsRaw ? JSON.parse(localLogsRaw) : [];
    const reminders = localRemindersRaw ? JSON.parse(localRemindersRaw) : [];

    const res = await apiRequest<{ imported: { logs: number; reminders: number } }>('/import/confirm', {
      method: 'POST',
      body: JSON.stringify({ logs, reminders })
    });
    return res.imported;
  }
}

export const apiStore = new ApiStore();
