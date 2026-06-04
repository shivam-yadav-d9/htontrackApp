import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  ManagerTargetProgressResponse,
  Target,
  TargetCreatePayload,
  TargetProgressPayload,
} from '@/types/target.types';
import { storage } from '@/utils/storage';

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const targetService = {
  async getMyTargets(): Promise<Target[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<Target & { user_id?: string }>('targets');
      return rows.filter((t) => !t.user_id || t.user_id === uid);
    }
    return api.get<Target[]>('/targets/my');
  },

  async getTarget(id: string): Promise<Target> {
    if (APP_MODE === 'offline_apk') {
      const item = await localDb.findById<Target>('targets', id);
      if (!item) throw new Error('Target not found');
      return item;
    }
    return api.get<Target>(`/targets/${id}`);
  },

  async getWeeklyTargets(): Promise<Target[]> {
    if (APP_MODE === 'offline_apk') {
      const all = await targetService.getMyTargets();
      return all.filter((t) => t.period_type === 'weekly');
    }
    return api.get<Target[]>('/targets/my/weekly');
  },

  async getMonthlyTargets(): Promise<Target[]> {
    if (APP_MODE === 'offline_apk') {
      const all = await targetService.getMyTargets();
      return all.filter((t) => t.period_type === 'monthly');
    }
    return api.get<Target[]>('/targets/my/monthly');
  },

  async getYearlyTargets(): Promise<Target[]> {
    if (APP_MODE === 'offline_apk') {
      const all = await targetService.getMyTargets();
      return all.filter((t) => t.period_type === 'yearly');
    }
    return api.get<Target[]>('/targets/my/yearly');
  },

  async createTarget(payload: TargetCreatePayload): Promise<Target> {
    if (APP_MODE === 'offline_apk') {
      const item: Target = {
        id: localDb.generateId('target'),
        ...payload,
        achieved_value: 0,
        achievement_percentage: 0,
        status: 'in_progress',
        created_at: new Date().toISOString(),
      } as unknown as Target;
      return localDb.addItem('targets', item);
    }
    return api.post<Target>('/manager/targets', payload);
  },

  async getManagerTargetProgress(): Promise<ManagerTargetProgressResponse> {
    if (APP_MODE === 'offline_apk') {
      const rows = await localDb.getCollection<Target>('targets');
      const avg = rows.length > 0 ? Math.round(rows.reduce((s, t) => s + (t.achievement_percentage ?? 0), 0) / rows.length) : 0;
      return {
        summary: { total_targets: rows.length, average_progress: avg, achieved: rows.filter((t) => t.status === 'achieved').length, exceeded: rows.filter((t) => t.status === 'exceeded').length },
        targets: rows,
      } as unknown as ManagerTargetProgressResponse;
    }
    return api.get<ManagerTargetProgressResponse>('/manager/target-progress');
  },

  async updateProgress(id: string, payload: TargetProgressPayload): Promise<Target> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<Target>('targets', id, {
        achieved_value: payload.achieved_value,
        achievement_percentage: payload.achievement_percentage,
      });
      return updated!;
    }
    return api.post<Target>(`/staff/targets/${id}/progress`, payload);
  },
};

export const targetImportService = {
  importStoreTargets(payload: {
    period_key: string;
    items: Array<{
      store_code: string;
      target_amount: number;
      last_month_target_amount?: number;
      last_month_achieved_amount?: number;
    }>;
  }) {
    return api.post('/admin/targets/import/store-targets', payload);
  },

  importEmployeeTargets(payload: {
    period_key: string;
    items: Array<{
      employee_code: string;
      target_amount: number;
      target_orders?: number;
      last_month_target_amount?: number;
      last_month_achieved_amount?: number;
    }>;
  }) {
    return api.post('/admin/targets/import/employee-targets', payload);
  },

  importDailySales(payload: {
    items: Array<{
      sales_date: string;
      employee_code: string;
      order_id: string;
      order_amount: number;
      product_category?: string;
      customer_name?: string;
      quantity?: number;
      payment_status?: string;
      order_status?: string;
    }>;
  }) {
    return api.post('/admin/targets/import/daily-sales', payload);
  },

  importAll(payload: {
    period_key: string;
    store_targets?: any[];
    employee_targets?: any[];
    daily_sales?: any[];
  }) {
    return api.post('/admin/targets/import/all', payload);
  },

  getStoreTargetTemplate() {
    return api.get('/admin/targets/import/template/store-targets');
  },

  getEmployeeTargetTemplate() {
    return api.get('/admin/targets/import/template/employee-targets');
  },

  getDailySalesTemplate() {
    return api.get('/admin/targets/import/template/daily-sales');
  },
};

export const staffTargetService = {
  getMyTargets(periodKey: string) {
    return api.get(`/staff/targets/my?period_key=${periodKey}`);
  },

  getMyTargetSummary(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/targets/my/summary${q}`);
  },

  getMyDailySales(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/targets/my/daily-sales${q}`);
  },

  getMyProgressGraph(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/targets/my/progress-graph${q}`);
  },

  getMyLastMonth(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/targets/my/last-month${q}`);
  },

  getMyActions(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/targets/my/actions${q}`);
  },

  getMyIncentivePreview(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/targets/my/incentive-preview${q}`);
  },
};

export const adminTargetService = {
  getDashboard(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/targets/dashboard${query}`);
  },

  getStoreSummary(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/targets/store-summary${query}`);
  },

  getEmployeeSummary(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/targets/employee-summary${query}`);
  },

  getDepartmentSummary(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/targets/department-summary${query}`);
  },

  getManagerSummary(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/targets/manager-summary${query}`);
  },

  getLeaderboard(periodKey?: string, limit = 50) {
    const query = periodKey
      ? `?period_key=${periodKey}&limit=${limit}`
      : `?limit=${limit}`;
    return api.get(`/admin/targets/leaderboard${query}`);
  },

  getLowPerformance(periodKey?: string, threshold = 60) {
    const query = periodKey
      ? `?period_key=${periodKey}&threshold=${threshold}`
      : `?threshold=${threshold}`;
    return api.get(`/admin/targets/low-performance${query}`);
  },

  getProgressGraph(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/targets/progress-graph${query}`);
  },

  getDailySales(params?: {
    period_key?: string;
    store_code?: string;
    employee_code?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.period_key) search.append('period_key', params.period_key);
    if (params?.store_code) search.append('store_code', params.store_code);
    if (params?.employee_code) search.append('employee_code', params.employee_code);
    const query = search.toString() ? `?${search.toString()}` : '';
    return api.get(`/admin/targets/daily-sales${query}`);
  },

  getActions(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/targets/actions${query}`);
  },

  getStoreDetail(storeCode: string, periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/targets/store/${storeCode}${query}`);
  },

  getEmployeeDetail(staffId: string, periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/targets/employee/${staffId}${query}`);
  },

  getManagerDetail(managerId: string, periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/targets/manager/${managerId}${query}`);
  },

  updateStoreTarget(targetId: string, payload: any) {
    return api.put(`/admin/targets/store-targets/${targetId}`, payload);
  },

  updateEmployeeTarget(targetId: string, payload: any) {
    return api.put(`/admin/targets/employee-targets/${targetId}`, payload);
  },

  deleteStoreTarget(targetId: string) {
    return api.delete(`/admin/targets/store-targets/${targetId}`);
  },

  deleteEmployeeTarget(targetId: string) {
    return api.delete(`/admin/targets/employee-targets/${targetId}`);
  },
};

export const managerTargetService = {
  getSummary(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/targets/summary${q}`);
  },

  getStoreTarget(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/targets/store${q}`);
  },

  getEmployeeTargets(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/targets/employees${q}`);
  },

  getEmployeeTargetDetail(staffId: string, periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/targets/employee/${staffId}${q}`);
  },

  getLeaderboard(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/targets/leaderboard${q}`);
  },

  getLowPerformance(periodKey?: string, threshold = 60) {
    const base = periodKey ? `?period_key=${periodKey}&threshold=${threshold}` : `?threshold=${threshold}`;
    return api.get(`/manager/targets/low-performance${base}`);
  },

  getProgressGraph(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/targets/progress-graph${q}`);
  },

  getActions(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/targets/actions${q}`);
  },

  createAction(payload: {
    staff_id: string;
    period_key: string;
    action_type: string;
    priority?: string;
    title: string;
    description: string;
    due_date?: string;
  }) {
    return api.post('/manager/targets/actions', payload);
  },

  updateAction(actionId: string, payload: { priority?: string; title?: string; description?: string; due_date?: string; status?: string }) {
    return api.put(`/manager/targets/actions/${actionId}`, payload);
  },

  addDailySale(payload: {
    sales_date: string;
    employee_code: string;
    order_id: string;
    order_amount: number;
    product_category?: string;
    customer_name?: string;
    quantity?: number;
    payment_status?: string;
    order_status?: string;
  }) {
    return api.post('/manager/sales/daily', payload);
  },
};
