import { api } from './api';

export const awardService = {
  createRule(payload: any) {
    return api.post('/admin/awards/rules', payload);
  },

  getRules() {
    return api.get('/admin/awards/rules');
  },

  updateRule(ruleId: string, payload: any) {
    return api.put(`/admin/awards/rules/${ruleId}`, payload);
  },

  issueAward(payload: any) {
    return api.post('/admin/awards/issue', payload);
  },

  approveNomination(nominationId: string) {
    return api.post(`/admin/awards/nominations/${nominationId}/approve`, {});
  },

  getAdminAwards(params?: { period_key?: string; store_code?: string }) {
    const search = new URLSearchParams();
    if (params?.period_key) search.append('period_key', params.period_key);
    if (params?.store_code) search.append('store_code', params.store_code);
    const q = search.toString() ? `?${search.toString()}` : '';
    return api.get(`/admin/awards${q}`);
  },

  getAdminSummary(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/awards/summary${q}`);
  },

  getAdminLeaderboard(params?: { period_key?: string; store_code?: string }) {
    const search = new URLSearchParams();
    if (params?.period_key) search.append('period_key', params.period_key);
    if (params?.store_code) search.append('store_code', params.store_code);
    const q = search.toString() ? `?${search.toString()}` : '';
    return api.get(`/admin/awards/leaderboard${q}`);
  },

  nominateAward(payload: any) {
    return api.post('/manager/awards/nominate', payload);
  },

  getManagerTeamAwards(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/awards/team${q}`);
  },

  getManagerLeaderboard(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/awards/leaderboard${q}`);
  },

  getMyAwards(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/awards/my${q}`);
  },

  getMyStoreLeaderboard(periodKey?: string) {
    const q = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/awards/leaderboard${q}`);
  },
};
