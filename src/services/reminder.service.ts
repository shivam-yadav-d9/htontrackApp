import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type { ReminderCreatePayload } from '@/types/communication.types';

export interface Reminder {
  id: string;
  user_id?: string;
  title: string;
  message: string | null;
  reminder_type: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  remind_at: string;
  scheduled_at?: string;
  is_dismissed?: boolean;
  dismissed_at?: string | null;
  created_at: string;
}

export type { ReminderCreatePayload };

export const reminderService = {
  async getMyReminders(): Promise<Reminder[]> {
    if (APP_MODE === 'offline_apk') return [];
    return api.get<Reminder[]>('/reminders/my');
  },

  async createReminder(payload: ReminderCreatePayload): Promise<Reminder> {
    if (APP_MODE === 'offline_apk') {
      return { id: localDb.generateId('rem'), message: null, reminder_type: 'general', remind_at: new Date().toISOString(), created_at: new Date().toISOString(), ...payload } as Reminder;
    }
    return api.post<Reminder>('/manager/reminders', payload);
  },

  async create(payload: ReminderCreatePayload): Promise<Reminder> {
    return reminderService.createReminder(payload);
  },

  async markRead(id: string): Promise<Reminder> {
    if (APP_MODE === 'offline_apk') {
      return { id, title: '', message: null, reminder_type: 'general', remind_at: '', created_at: '' };
    }
    return api.post<Reminder>(`/reminders/${id}/mark-read`, {});
  },

  async dismiss(id: string): Promise<Reminder> {
    if (APP_MODE === 'offline_apk') {
      return { id, title: '', message: null, reminder_type: 'general', remind_at: '', created_at: '', is_dismissed: true };
    }
    return api.patch<Reminder>(`/reminders/${id}/dismiss`, {});
  },

  async getManagerReminders(): Promise<Reminder[]> {
    if (APP_MODE === 'offline_apk') return [];
    return api.get<Reminder[]>('/manager/reminders');
  },

  async delete(id: string): Promise<void> {
    if (APP_MODE === 'offline_apk') return;
    return api.delete<void>(`/reminders/${id}`);
  },
};
