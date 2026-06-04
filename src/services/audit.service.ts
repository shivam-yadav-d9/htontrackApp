import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type { AuditLog, AuditLogPayload, AuditSummary } from '@/types/audit.types';
import { storage } from '@/utils/storage';

type AuditParams = {
  start_date?: string;
  end_date?: string;
  module?: string;
  severity?: string;
  actor_role?: string;
};

function toQuery(params?: AuditParams) {
  if (!params) return '';
  const query = new URLSearchParams();
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.module) query.append('module', params.module);
  if (params.severity) query.append('severity', params.severity);
  if (params.actor_role) query.append('actor_role', params.actor_role);
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

function applyAuditFilters(logs: (AuditLog & { actor_role?: string; store_code?: string })[],  params?: AuditParams) {
  let result = logs;
  if (params?.module && params.module !== 'all') result = result.filter((l) => l.module === params.module);
  if (params?.severity) result = result.filter((l) => l.severity === params.severity);
  if (params?.actor_role) result = result.filter((l) => l.actor_role === params.actor_role);
  return result;
}

export const auditService = {
  async createLog(payload: AuditLogPayload): Promise<AuditLog> {
    if (APP_MODE === 'offline_apk') {
      const item: AuditLog = {
        id: localDb.generateId('audit'),
        event_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as AuditLog;
      return localDb.addItem('audit_logs', item);
    }
    return api.post<AuditLog>('/audit/log', payload);
  },

  async getStoreLogs(params?: AuditParams): Promise<AuditLog[]> {
    if (APP_MODE === 'offline_apk') {
      const rows = await localDb.getCollection<AuditLog & { actor_role?: string; store_code?: string }>('audit_logs');
      return applyAuditFilters(rows, params);
    }
    return api.get<AuditLog[]>(`/manager/audit/store${toQuery(params)}`);
  },

  async getStaffLogs(staffId: string, params?: Omit<AuditParams, 'actor_role'>): Promise<AuditLog[]> {
    if (APP_MODE === 'offline_apk') {
      const rows = await localDb.getCollection<AuditLog & { actor_id?: string }>('audit_logs');
      const filtered = rows.filter((l) => l.actor_id === staffId);
      return applyAuditFilters(filtered as (AuditLog & { actor_role?: string; store_code?: string })[], params);
    }
    return api.get<AuditLog[]>(`/manager/audit/staff/${staffId}${toQuery(params)}`);
  },

  async getMyLogs(params?: Omit<AuditParams, 'actor_role'>): Promise<AuditLog[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<AuditLog & { actor_id?: string; actor_role?: string; store_code?: string }>('audit_logs');
      const mine = rows.filter((l) => l.actor_id === uid);
      return applyAuditFilters(mine, params);
    }
    return api.get<AuditLog[]>(`/staff/audit/my${toQuery(params)}`);
  },

  async getSummary(): Promise<AuditSummary> {
    if (APP_MODE === 'offline_apk') {
      const rows = await localDb.getCollection<AuditLog & { actor_role?: string }>('audit_logs');
      const modules: Record<string, number> = {};
      for (const l of rows) {
        if (l.module) modules[l.module] = (modules[l.module] ?? 0) + 1;
      }
      return {
        total_logs: rows.length,
        critical: rows.filter((l) => l.severity === 'critical').length,
        warning: rows.filter((l) => l.severity === 'warning').length,
        info: rows.filter((l) => l.severity === 'info').length,
        manager_actions: rows.filter((l) => l.actor_role === 'MANAGER').length,
        staff_actions: rows.filter((l) => l.actor_role === 'STAFF').length,
        modules,
      };
    }
    return api.get<AuditSummary>('/manager/audit/summary');
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAdminLogs(filters?: Record<string, string>) {
    const qs = filters ? '?' + new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString() : '';
    return api.get(`/admin/audit-logs${qs}`);
  },

  getAdminSummary() {
    return api.get('/admin/audit-logs/summary');
  },

  getAuditDetail(auditId: string) {
    return api.get(`/admin/audit-logs/${auditId}`);
  },

  getByUser(userId: string) {
    return api.get(`/admin/audit-logs/by-user/${userId}`);
  },

  getByModule(moduleName: string) {
    return api.get(`/admin/audit-logs/by-module/${moduleName}`);
  },

  exportLogs(filters?: Record<string, string>) {
    const qs = filters ? '?' + new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString() : '';
    return api.get(`/admin/audit-logs/export${qs}`);
  },

  // ── Manager (structured) ───────────────────────────────────────────────────

  getManagerStoreLogs() {
    return api.get('/manager/audit-logs/store');
  },

  getManagerEmployeeLogs(staffId: string) {
    return api.get(`/manager/audit-logs/employee/${staffId}`);
  },

  // ── Staff (structured) ────────────────────────────────────────────────────

  getStaffMyLogs() {
    return api.get('/staff/audit-logs/my');
  },
};
