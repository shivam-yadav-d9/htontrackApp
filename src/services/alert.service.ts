import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { storage } from '@/utils/storage';

export interface Alert {
  id: string;
  user_id: string;
  title: string;
  message: string;
  alert_type: string;
  severity: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

const SEED_ALERTS: Alert[] = [
  {
    id: 'useralert_001',
    user_id: 'user_001',
    title: 'Course Deadline Approaching',
    message: 'Sofa Selling Masterclass is due in 3 days. Please complete it before May 25.',
    alert_type: 'course_deadline',
    severity: 'warning',
    related_entity_type: 'course',
    related_entity_id: 'course_001',
    is_acknowledged: false,
    acknowledged_at: null,
    created_at: '2026-05-22T08:00:00.000Z',
  },
  {
    id: 'useralert_002',
    user_id: 'user_001',
    title: 'Assignment Overdue',
    message: 'Competitor Price Check PDF is overdue. Please submit immediately.',
    alert_type: 'assignment_overdue',
    severity: 'critical',
    related_entity_type: 'assignment',
    related_entity_id: 'asn_001',
    is_acknowledged: false,
    acknowledged_at: null,
    created_at: '2026-05-21T09:00:00.000Z',
  },
  {
    id: 'useralert_003',
    user_id: 'user_003',
    title: 'New Course Assigned',
    message: 'Customer Service Excellence course has been assigned to you.',
    alert_type: 'new_course',
    severity: 'info',
    related_entity_type: 'course',
    related_entity_id: 'course_003',
    is_acknowledged: false,
    acknowledged_at: null,
    created_at: '2026-05-20T10:00:00.000Z',
  },
];

const acknowledgedIds = new Set<string>();

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const alertService = {
  async getMyAlerts(): Promise<Alert[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      return SEED_ALERTS
        .filter((a) => a.user_id === uid)
        .map((a) => ({
          ...a,
          is_acknowledged: acknowledgedIds.has(a.id),
          acknowledged_at: acknowledgedIds.has(a.id) ? new Date().toISOString() : null,
        }));
    }
    return api.get<Alert[]>('/alerts/my');
  },

  async getUnacknowledged(): Promise<Alert[]> {
    if (APP_MODE === 'offline_apk') {
      const all = await alertService.getMyAlerts();
      return all.filter((a) => !a.is_acknowledged);
    }
    return api.get<Alert[]>('/alerts/my/unacknowledged');
  },

  async acknowledge(id: string): Promise<Alert> {
    if (APP_MODE === 'offline_apk') {
      acknowledgedIds.add(id);
      const alert = SEED_ALERTS.find((a) => a.id === id);
      return { ...(alert ?? ({ id } as Alert)), is_acknowledged: true, acknowledged_at: new Date().toISOString() };
    }
    return api.patch<Alert>(`/alerts/${id}/acknowledge`, {});
  },

  async acknowledgeAll(): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      SEED_ALERTS.forEach((a) => acknowledgedIds.add(a.id));
      return;
    }
    await api.post('/alerts/acknowledge-all', {});
  },
};
