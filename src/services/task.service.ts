import { api } from './api';

export interface ManagerTask {
  id: string;
  task_type: string;
  source_type: string;
  source_id?: string;
  priority: string;
  title: string;
  description?: string;
  staff_id: string;
  employee_code: string;
  staff_name: string;
  store_code: string;
  store_name: string;
  manager_id: string;
  manager_name: string;
  assigned_date: string;
  due_date?: string;
  due_time?: string;
  sla_hours: number;
  sla_deadline?: string;
  is_overdue: boolean;
  overdue_hours: number;
  is_recurring: boolean;
  recurrence?: string;
  proof_required: boolean;
  completion_note_required: boolean;
  status: string;
  progress_percentage: number;
  staff_note?: string;
  proof_url?: string;
  completion_note?: string;
  review_status?: string;
  manager_remarks?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  reviewed_at?: string;
}

export interface TaskCreatePayload {
  staff_id: string;
  title: string;
  task_type?: string;
  source_type?: string;
  priority?: string;
  description?: string;
  assigned_date?: string;
  due_date?: string;
  due_time?: string;
  is_recurring?: boolean;
  recurrence?: string;
  proof_required?: boolean;
  completion_note_required?: boolean;
}

export interface TaskUpdatePayload {
  progress_percentage?: number;
  staff_note?: string;
  proof_url?: string;
}

export interface TaskReviewPayload {
  review_status: 'approved' | 'rejected' | 'needs_correction';
  manager_remarks?: string;
  rating?: number;
}

export const taskService = {
  // ── Staff ──────────────────────────────────────────────────────────────────

  async getMyTasks(status?: string, priority?: string): Promise<{ tasks: ManagerTask[]; count: number }> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    const q = params.toString() ? `?${params.toString()}` : '';
    const data = await api.get<any>(`/staff/tasks/my${q}`);
    if (Array.isArray(data)) return { tasks: data, count: data.length };
    return { tasks: data.tasks ?? [], count: data.count ?? 0 };
  },

  async getMyTaskDetail(taskId: string): Promise<{ task: ManagerTask; updates: any[]; reviews: any[]; timeline: any[] }> {
    return api.get(`/staff/tasks/my/${taskId}`);
  },

  async updateMyTask(taskId: string, payload: TaskUpdatePayload): Promise<{ task: ManagerTask; update: any }> {
    return api.post(`/staff/tasks/my/${taskId}/update`, payload);
  },

  async completeMyTask(taskId: string, payload?: { completion_note?: string; proof_url?: string }): Promise<ManagerTask> {
    return api.post(`/staff/tasks/my/${taskId}/complete`, payload ?? {});
  },

  // ── Manager ────────────────────────────────────────────────────────────────

  async createManagerTask(payload: TaskCreatePayload): Promise<ManagerTask> {
    return api.post('/manager/tasks', payload);
  },

  async getManagerTasks(status?: string, priority?: string, staffId?: string): Promise<{ tasks: ManagerTask[]; count: number; store_code: string }> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    if (staffId) params.set('staff_id', staffId);
    const q = params.toString() ? `?${params.toString()}` : '';
    const data = await api.get<any>(`/manager/tasks${q}`);
    if (Array.isArray(data)) return { tasks: data, count: data.length, store_code: '' };
    return { tasks: data.tasks ?? [], count: data.count ?? 0, store_code: data.store_code ?? '' };
  },

  async getManagerTaskDetail(taskId: string): Promise<{ task: ManagerTask; updates: any[]; reviews: any[]; timeline: any[] }> {
    return api.get(`/manager/tasks/${taskId}`);
  },

  async updateManagerTask(taskId: string, payload: Partial<TaskCreatePayload & { status: string; progress_percentage: number }>): Promise<ManagerTask> {
    return api.put(`/manager/tasks/${taskId}`, payload);
  },

  async reviewTask(taskId: string, payload: TaskReviewPayload): Promise<{ task: ManagerTask; review: any }> {
    return api.post(`/manager/tasks/${taskId}/review`, payload);
  },

  async reopenTask(taskId: string, managerRemarks?: string): Promise<ManagerTask> {
    return api.post(`/manager/tasks/${taskId}/reopen`, { manager_remarks: managerRemarks });
  },

  async getManagerAnalytics(): Promise<any> {
    return api.get('/manager/tasks/analytics');
  },

  async getManagerWorkload(): Promise<any> {
    return api.get('/manager/tasks/workload');
  },

  async getManagerOverdue(): Promise<{ count: number; tasks: ManagerTask[] }> {
    return api.get('/manager/tasks/overdue');
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  async getAdminAnalytics(): Promise<any> {
    return api.get('/admin/tasks/analytics');
  },

  async getAdminWorkload(): Promise<any> {
    return api.get('/admin/tasks/workload');
  },

  async getAdminOverdue(): Promise<{ count: number; tasks: ManagerTask[] }> {
    return api.get('/admin/tasks/overdue');
  },

  async getAdminManagerInsights(): Promise<any> {
    return api.get('/admin/tasks/manager-insights');
  },

  async getAdminStoreInsights(): Promise<any> {
    return api.get('/admin/tasks/store-insights');
  },

  async getAdminTasks(status?: string, storeCode?: string, managerId?: string): Promise<{ tasks: ManagerTask[]; count: number }> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (storeCode) params.set('store_code', storeCode);
    if (managerId) params.set('manager_id', managerId);
    const q = params.toString() ? `?${params.toString()}` : '';
    const data = await api.get<any>(`/admin/tasks${q}`);
    if (Array.isArray(data)) return { tasks: data, count: data.length };
    return { tasks: data.tasks ?? [], count: data.count ?? 0 };
  },
};
