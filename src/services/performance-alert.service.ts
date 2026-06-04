import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  EscalateAlertPayload,
  PerformanceAlert,
  PerformanceAlertSummary,
  ResolveAlertPayload,
} from '@/types/performance-alert.types';
import { storage } from '@/utils/storage';

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const performanceAlertService = {
  async generateAlerts(): Promise<{ generated_count: number; alerts: PerformanceAlert[] }> {
    if (APP_MODE === 'offline_apk') {
      const alerts = await localDb.getCollection<PerformanceAlert>('performance_alerts');
      return { generated_count: 0, alerts };
    }
    return api.post<{ generated_count: number; alerts: PerformanceAlert[] }>('/manager/performance-alerts/generate', {});
  },

  async getManagerAlerts(): Promise<{ summary: PerformanceAlertSummary; alerts: PerformanceAlert[] }> {
    if (APP_MODE === 'offline_apk') {
      const alerts = await localDb.getCollection<PerformanceAlert>('performance_alerts');
      const open = alerts.filter((a) => a.status === 'open').length;
      const critical = alerts.filter((a) => a.severity === 'critical').length;
      const summary: PerformanceAlertSummary = {
        total: alerts.length,
        open,
        critical,
        resolved: alerts.length - open,
      } as unknown as PerformanceAlertSummary;
      return { summary, alerts };
    }
    return api.get<{ summary: PerformanceAlertSummary; alerts: PerformanceAlert[] }>('/manager/performance-alerts');
  },

  async resolveAlert(id: string, payload: ResolveAlertPayload): Promise<PerformanceAlert> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<PerformanceAlert>('performance_alerts', id, {
        status: 'resolved',
        resolution_note: payload.resolution_note,
      } as Partial<PerformanceAlert>);
      return updated!;
    }
    return api.post<PerformanceAlert>(`/manager/performance-alerts/${id}/resolve`, payload);
  },

  async escalateAlert(id: string, payload: EscalateAlertPayload): Promise<PerformanceAlert> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<PerformanceAlert>('performance_alerts', id, {
        status: 'escalated',
      } as Partial<PerformanceAlert>);
      return updated!;
    }
    return api.post<PerformanceAlert>(`/manager/performance-alerts/${id}/escalate`, payload);
  },

  async getMyAlerts(): Promise<PerformanceAlert[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<PerformanceAlert & { staff_id?: string }>('performance_alerts');
      return rows.filter((a) => a.staff_id === uid);
    }
    return api.get<PerformanceAlert[]>('/staff/performance-alerts/my');
  },
};
