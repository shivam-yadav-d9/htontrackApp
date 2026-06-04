import { api } from './api';

export type PerformanceAlert = {
  id: string;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info' | string;
  title: string;
  description: string;
  module: string;
  site_code?: string | null;
  store_name?: string | null;
  employee_number?: string | null;
  employee_name?: string | null;
  metric_value?: number | null;
  threshold?: number | null;
  status: 'open' | 'acknowledged' | 'resolved' | string;
  created_at: string;
  resolved_at?: string | null;
};

export type DataQualitySummary = {
  total_alerts: number;
  critical: number;
  warnings: number;
  by_module: Record<string, number>;
};

export const dataQualityService = {
  getAlerts(params?: { severity?: string; module?: string; status?: string; site_code?: string }) {
    const q = new URLSearchParams();
    if (params?.severity) q.set('severity', params.severity);
    if (params?.module) q.set('module', params.module);
    if (params?.status) q.set('status', params.status);
    if (params?.site_code) q.set('site_code', params.site_code);
    const qs = q.toString();
    return api.get<PerformanceAlert[]>(`/admin/performance-alerts${qs ? `?${qs}` : ''}`);
  },

  acknowledgeAlert(alertId: string) {
    return api.post<PerformanceAlert>(`/admin/performance-alerts/${alertId}/acknowledge`, {});
  },

  resolveAlert(alertId: string, resolution?: string) {
    return api.post<PerformanceAlert>(`/admin/performance-alerts/${alertId}/resolve`, { resolution });
  },

  getAlertSummary() {
    return api.get<DataQualitySummary>('/admin/performance-alerts/summary');
  },

  getInsightSnapshots() {
    return api.get<any[]>('/admin/insights');
  },

  getManagerActions(params?: { status?: string; site_code?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.site_code) q.set('site_code', params.site_code);
    const qs = q.toString();
    return api.get<any[]>(`/admin/manager-actions${qs ? `?${qs}` : ''}`);
  },
};
