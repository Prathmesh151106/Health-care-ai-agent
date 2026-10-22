/**
 * services/reminderService.ts
 * Business rules for reminders.
 */

import * as reminderRepo from '../repositories/reminderRepo';
import { NotFoundError } from '../utils/errors';
import { Reminder, RepeatRule, PaginatedResult } from '../types';

export async function listReminders(
  userId: string,
  filters: { enabled?: boolean; page: number; pageSize: number }
): Promise<PaginatedResult<Reminder>> {
  return reminderRepo.listReminders(userId, filters);
}

export async function getReminder(userId: string, id: string): Promise<Reminder> {
  const reminder = await reminderRepo.getReminder(userId, id);
  if (!reminder) throw new NotFoundError('Reminder not found');
  return reminder;
}

export async function createReminder(
  userId: string,
  data: {
    title: string;
    note?: string;
    time_of_day: string;
    start_date: string;
    timezone: string;
    repeat_rule: RepeatRule;
  }
): Promise<Reminder> {
  return reminderRepo.createReminder(userId, data);
}

export async function updateReminder(
  userId: string,
  id: string,
  updates: Partial<Pick<Reminder, 'title'|'note'|'time_of_day'|'start_date'|'timezone'|'repeat_rule'|'enabled'>>
): Promise<Reminder> {
  const existing = await reminderRepo.getReminder(userId, id);
  if (!existing) throw new NotFoundError('Reminder not found');

  const updated = await reminderRepo.updateReminder(userId, id, updates);
  if (!updated) throw new NotFoundError('Reminder not found');
  return updated;
}

export async function disableReminder(userId: string, id: string): Promise<Reminder> {
  return updateReminder(userId, id, { enabled: false });
}

export async function deleteReminder(userId: string, id: string): Promise<void> {
  const existing = await reminderRepo.getReminder(userId, id);
  if (!existing) throw new NotFoundError('Reminder not found');
  await reminderRepo.deleteReminder(userId, id);
}
