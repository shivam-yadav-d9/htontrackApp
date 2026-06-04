import { api } from './api';

export const insightService = {
  // ── Staff ──────────────────────────────────────────────────────────────────

  getMyInsights(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/insights/my${q}`);
  },

  getMyRecommendations() {
    return api.get('/staff/insights/recommendations');
  },

  // ── Manager ────────────────────────────────────────────────────────────────

  getManagerOverview(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/insights/overview${q}`);
  },

  getManagerRisks(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/insights/risks${q}`);
  },

  getManagerStaffInsight(employeeCode: string, periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/insights/staff/${employeeCode}${q}`);
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAdminOverview(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/insights/overview${q}`);
  },

  getAdminRisks(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/insights/risks${q}`);
  },

  getAdminOpportunities(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/insights/opportunities${q}`);
  },

  getAdminModuleHealth(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/insights/module-health${q}`);
  },

  getAdminLeaderboard(params?: { period_key?: string; store_code?: string }) {
    const search = new URLSearchParams();
    if (params?.period_key) search.append('period_key', params.period_key);
    if (params?.store_code) search.append('store_code', params.store_code);
    const q = search.toString() ? `?${search.toString()}` : '';
    return api.get(`/admin/insights/leaderboard${q}`);
  },

  getAdminStoreInsight(storeCode: string, periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/insights/store/${storeCode}${q}`);
  },

  getAdminStaffInsight(employeeCode: string, periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/insights/staff/${employeeCode}${q}`);
  },
};
