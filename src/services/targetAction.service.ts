import { api } from './api';

export const targetActionService = {
  getMyActions(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/target-actions/my${query}`);
  },

  getMyActionSummary(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/target-actions/my/summary${query}`);
  },

  acknowledgeAction(actionId: string) {
    return api.post(`/staff/target-actions/${actionId}/acknowledge`);
  },

  updateProgress(
    actionId: string,
    payload: {
      progress_percentage: number;
      staff_progress_note: string;
    }
  ) {
    return api.post(`/staff/target-actions/${actionId}/progress`, payload);
  },

  completeAction(actionId: string) {
    return api.post(`/staff/target-actions/${actionId}/complete`);
  },

  getManagerActions(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/target-actions${query}`);
  },

  getManagerSummary(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/target-actions/summary${query}`);
  },

  getManagerRecommendations(periodKey?: string, threshold = 80) {
    const query = periodKey
      ? `?period_key=${periodKey}&threshold=${threshold}`
      : `?threshold=${threshold}`;
    return api.get(`/manager/target-actions/recommendations${query}`);
  },

  createManagerAction(payload: {
    staff_id: string;
    period_key: string;
    action_type: string;
    priority?: string;
    title: string;
    description: string;
    due_date?: string;
  }) {
    return api.post('/manager/target-actions', payload);
  },

  updateManagerAction(actionId: string, payload: any) {
    return api.put(`/manager/target-actions/${actionId}`, payload);
  },

  reviewManagerAction(
    actionId: string,
    payload: {
      manager_review_status?: string;
      manager_review_note?: string;
      close_action?: boolean;
    }
  ) {
    return api.post(`/manager/target-actions/${actionId}/review`, payload);
  },

  generateLowPerformanceActions(payload: {
    period_key: string;
    threshold?: number;
    create_duplicate?: boolean;
  }) {
    return api.post('/manager/target-actions/generate-low-performance-actions', payload);
  },

  getAdminActions(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/target-actions${query}`);
  },

  getAdminSummary(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/target-actions/summary${query}`);
  },

  getAdminManagerInsights(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/target-actions/manager-insights${query}`);
  },

  getAdminStoreInsights(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/target-actions/store-insights${query}`);
  },

  getAdminEmployeeInsights(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/target-actions/employee-insights${query}`);
  },
};
