import { api } from './api';

export const incentiveService = {
  // ── Staff ─────────────────────────────────────────────────────────────────

  getMyEarnings(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/staff/earnings/my${query}`);
  },

  createDreamTarget(payload: {
    title: string;
    target_amount: number;
    description?: string;
  }) {
    return api.post('/staff/earnings/dream-targets', payload);
  },

  getMyDreamTargets() {
    return api.get('/staff/earnings/dream-targets');
  },

  // ── Manager ───────────────────────────────────────────────────────────────

  getManagerTeam(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/incentives/team${query}`);
  },

  getManagerDashboard(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/incentives/dashboard${query}`);
  },

  getManagerRewardRecommendations(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/manager/incentives/reward-recommendations${query}`);
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  getAdminRules() {
    return api.get('/admin/incentives/rules');
  },

  createAdminRule(payload: {
    rule_name: string;
    achievement_min: number;
    achievement_max: number;
    incentive_percentage?: number;
    bonus_amount?: number;
    role_keys?: string[];
    status?: string;
  }) {
    return api.post('/admin/incentives/rules', payload);
  },

  updateAdminRule(ruleId: string, payload: Partial<{
    rule_name: string;
    achievement_min: number;
    achievement_max: number;
    incentive_percentage: number;
    bonus_amount: number;
    role_keys: string[];
    status: string;
  }>) {
    return api.put(`/admin/incentives/rules/${ruleId}`, payload);
  },

  generateAdminIncentives(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.post(`/admin/incentives/generate${query}`);
  },

  getAdminEarnings(periodKey?: string) {
    const query = periodKey ? `?period_key=${periodKey}` : '';
    return api.get(`/admin/incentives/earnings${query}`);
  },

  reviewPayout(earningId: string, payload: {
    status: 'approved' | 'rejected' | 'paid';
    admin_remarks?: string;
  }) {
    return api.post(`/admin/incentives/earnings/${earningId}/review`, payload);
  },
};
