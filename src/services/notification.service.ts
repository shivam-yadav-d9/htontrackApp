import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  NotificationCreatePayload,
  NotificationItem,
  Reminder,
  ReminderCreatePayload,
  ReminderSummary,
} from '@/types/notification.types';
import { storage } from '@/utils/storage';

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const notificationService = {
  async createNotification(payload: NotificationCreatePayload): Promise<{ created_count: number; notifications: NotificationItem[] }> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: NotificationItem = {
        id: localDb.generateId('notif'),
        created_by: uid,
        is_read: false,
        status: 'sent',
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as NotificationItem;
      const added = await localDb.addItem('notifications', item);
      return { created_count: 1, notifications: [added] };
    }
    return api.post<{ created_count: number; notifications: NotificationItem[] }>('/manager/notifications', payload);
  },

  async getMyNotifications(): Promise<NotificationItem[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<NotificationItem & { recipient_id?: string }>('notifications');
      return rows.filter((n) => !n.recipient_id || n.recipient_id === uid);
    }
    return api.get<NotificationItem[]>('/notifications/my');
  },

  async getUnreadCount(): Promise<{ unread_count: number; urgent_count: number }> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<NotificationItem & { recipient_id?: string }>('notifications');
      const mine = rows.filter((n) => !n.recipient_id || n.recipient_id === uid);
      const unread = mine.filter((n) => !n.is_read).length;
      const urgent = mine.filter((n) => !n.is_read && n.priority === 'urgent').length;
      return { unread_count: unread, urgent_count: urgent };
    }
    return api.get<{ unread_count: number; urgent_count: number }>('/notifications/unread-count');
  },

  async markRead(id: string): Promise<NotificationItem> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<NotificationItem>('notifications', id, {
        is_read: true,
        read_at: new Date().toISOString(),
      } as Partial<NotificationItem>);
      return updated!;
    }
    return api.post<NotificationItem>(`/notifications/${id}/read`, {});
  },

  async markAllRead(): Promise<{ updated_count: number }> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<NotificationItem & { recipient_id?: string }>('notifications');
      let count = 0;
      const updated = rows.map((n) => {
        if ((!n.recipient_id || n.recipient_id === uid) && !n.is_read) {
          count++;
          return { ...n, is_read: true, read_at: new Date().toISOString() };
        }
        return n;
      });
      await localDb.setCollection('notifications', updated as never[]);
      return { updated_count: count };
    }
    return api.post<{ updated_count: number }>('/notifications/mark-all-read', {});
  },

  async createReminder(payload: ReminderCreatePayload): Promise<{ created_count: number; reminders: Reminder[]; notifications: NotificationItem[] }> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: Reminder = {
        id: localDb.generateId('rem'),
        created_by: uid,
        status: 'pending',
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as Reminder;
      const added = await localDb.addItem('reminders', item);
      return { created_count: 1, reminders: [added], notifications: [] };
    }
    return api.post<{ created_count: number; reminders: Reminder[]; notifications: NotificationItem[] }>('/manager/reminders', payload);
  },

  async getManagerReminders(): Promise<{ summary: ReminderSummary; reminders: Reminder[] }> {
    if (APP_MODE === 'offline_apk') {
      const reminders = await localDb.getCollection<Reminder>('reminders');
      const pending = reminders.filter((r) => r.status === 'pending').length;
      const completed = reminders.filter((r) => r.status === 'completed').length;
      const urgent = reminders.filter((r) => r.priority === 'high' && r.status === 'pending').length;
      const summary: ReminderSummary = { total: reminders.length, pending, completed, urgent } as ReminderSummary;
      return { summary, reminders };
    }
    return api.get<{ summary: ReminderSummary; reminders: Reminder[] }>('/manager/reminders');
  },

  async getMyReminders(): Promise<Reminder[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<Reminder>('reminders');
    }
    return api.get<Reminder[]>('/staff/reminders/my');
  },

  async completeReminder(id: string, completionNote?: string): Promise<Reminder> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<Reminder>('reminders', id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_note: completionNote ?? null,
      } as Partial<Reminder>);
      return updated!;
    }
    const query = completionNote ? `?completion_note=${encodeURIComponent(completionNote)}` : '';
    return api.post<Reminder>(`/staff/reminders/${id}/complete${query}`, {});
  },

  // ── Step 75 additions ────────────────────────────────────────────────────────

  registerToken(payload: { device_id: string; expo_push_token: string; platform: string }) {
    return api.post('/notifications/register-token', payload);
  },

  markReadBulk(notificationIds: string[]) {
    return api.post('/notifications/mark-read', { notification_ids: notificationIds });
  },

  createAdminNotification(payload: any) {
    return api.post('/admin/notifications', payload);
  },

  getAdminSummary() {
    return api.get('/admin/notifications/summary');
  },
};
