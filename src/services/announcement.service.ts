import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type { Announcement, AnnouncementCreatePayload } from '@/types/communication.types';
import { storage } from '@/utils/storage';

export type { Announcement, AnnouncementCreatePayload };

const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_001',
    title: 'Festive Season Sales Target',
    description: 'All staff must aim for 120% of regular monthly target during June festive season. Incentive bonuses apply.',
    type: 'general',
    priority: 'high',
    require_acknowledgement: false,
    acknowledgement_count: 0,
    created_at: '2026-05-20T09:00:00',
  } as Announcement,
  {
    id: 'ann_002',
    title: 'New VM Guidelines Released',
    description: 'Updated visual merchandising standards are now available. All associates must read and acknowledge.',
    type: 'policy_update',
    priority: 'medium',
    require_acknowledgement: true,
    acknowledgement_count: 2,
    created_at: '2026-05-18T10:00:00',
  } as Announcement,
];

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const announcementService = {
  async getMyAnnouncements(): Promise<Announcement[]> {
    if (APP_MODE === 'offline_apk') return SEED_ANNOUNCEMENTS;
    return api.get<Announcement[]>('/announcements/my');
  },

  async createAnnouncement(payload: AnnouncementCreatePayload): Promise<Announcement> {
    if (APP_MODE === 'offline_apk') {
      const item: Announcement = {
        id: localDb.generateId('ann'),
        acknowledgement_count: 0,
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as Announcement;
      return item;
    }
    return api.post<Announcement>('/manager/announcements', payload);
  },

  async acknowledgeAnnouncement(id: string): Promise<Announcement> {
    if (APP_MODE === 'offline_apk') {
      return SEED_ANNOUNCEMENTS.find((a) => a.id === id) ?? SEED_ANNOUNCEMENTS[0];
    }
    return api.post<Announcement>(`/announcements/${id}/acknowledge`, {});
  },

  async getManagerAnnouncements(): Promise<Announcement[]> {
    if (APP_MODE === 'offline_apk') return SEED_ANNOUNCEMENTS;
    return api.get<Announcement[]>('/manager/announcements');
  },
};
