import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { announcementService } from './announcement.service';
import { reminderService } from './reminder.service';
import type {
  Announcement,
  AnnouncementCreatePayload,
  Reminder,
  ReminderCreatePayload,
} from '@/types/communication.types';

export const communicationService = {
  // ── Announcements ──────────────────────────────────────────────────────────

  createAnnouncement(payload: AnnouncementCreatePayload): Promise<Announcement> {
    if (APP_MODE === 'offline_apk') return announcementService.createAnnouncement(payload);
    return api.post<Announcement>('/manager/announcements', payload);
  },

  getManagerAnnouncements(): Promise<Announcement[]> {
    if (APP_MODE === 'offline_apk') return announcementService.getManagerAnnouncements();
    return api.get<Announcement[]>('/manager/announcements');
  },

  getMyAnnouncements(): Promise<Announcement[]> {
    if (APP_MODE === 'offline_apk') return announcementService.getMyAnnouncements();
    return api.get<Announcement[]>('/staff/announcements/my');
  },

  acknowledgeAnnouncement(id: string): Promise<Announcement> {
    if (APP_MODE === 'offline_apk') return announcementService.acknowledgeAnnouncement(id);
    return api.post<Announcement>(`/staff/announcements/${id}/acknowledge`, {});
  },

  // ── Reminders ──────────────────────────────────────────────────────────────

  createReminder(payload: ReminderCreatePayload): Promise<Reminder> {
    if (APP_MODE === 'offline_apk') return reminderService.createReminder(payload);
    return api.post<Reminder>('/manager/reminders', payload);
  },

  getManagerReminders(): Promise<Reminder[]> {
    if (APP_MODE === 'offline_apk') return reminderService.getManagerReminders();
    return api.get<Reminder[]>('/manager/reminders');
  },

  getMyReminders(): Promise<Reminder[]> {
    if (APP_MODE === 'offline_apk') return reminderService.getMyReminders();
    return api.get<Reminder[]>('/staff/reminders/my');
  },

  markReminderRead(id: string): Promise<Reminder> {
    if (APP_MODE === 'offline_apk') return reminderService.markRead(id);
    return api.post<Reminder>(`/staff/reminders/${id}/mark-read`, {});
  },
};
