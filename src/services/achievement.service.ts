import { api } from './api';

export type AchievementGoalCreatePayload = {
  goal_type: string;
  title: string;
  description?: string;
  target_value: number;
  target_date?: string;
};

export type AchievementGoalUpdatePayload = {
  title?: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  target_date?: string;
  status?: string;
};

export const achievementService = {
  // ── Staff ─────────────────────────────────────────────────────────────────

  getMyAchievements() {
    return api.get('/staff/achievements/my');
  },

  getMyBadges() {
    return api.get('/staff/achievements/my/badges');
  },

  getMyCertificates() {
    return api.get('/staff/achievements/my/certificates');
  },

  getMyGoals() {
    return api.get('/staff/achievements/my/goals');
  },

  createMyGoal(payload: AchievementGoalCreatePayload) {
    return api.post('/staff/achievements/my/goals', payload);
  },

  updateMyGoal(goalId: string, payload: AchievementGoalUpdatePayload) {
    return api.put(`/staff/achievements/my/goals/${goalId}`, payload);
  },

  getMySummary() {
    return api.get('/staff/achievements/my/summary');
  },

  // ── Manager ───────────────────────────────────────────────────────────────

  getManagerTeamAchievements() {
    return api.get('/manager/achievements/team');
  },

  getManagerTeamBadges() {
    return api.get('/manager/achievements/team/badges');
  },

  getManagerTeamCertificates() {
    return api.get('/manager/achievements/team/certificates');
  },

  getManagerTeamGoals() {
    return api.get('/manager/achievements/team/goals');
  },

  getManagerTeamSummary() {
    return api.get('/manager/achievements/team/summary');
  },

  getManagerEmployeeAchievements(staffId: string) {
    return api.get(`/manager/achievements/employee/${staffId}`);
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  getAdminAchievements() {
    return api.get('/admin/achievements');
  },

  getAdminBadges() {
    return api.get('/admin/achievements/badges');
  },

  getAdminCertificates() {
    return api.get('/admin/achievements/certificates');
  },

  getAdminGoals() {
    return api.get('/admin/achievements/goals');
  },

  getAdminSummary() {
    return api.get('/admin/achievements/summary');
  },

  getAdminStoreSummary() {
    return api.get('/admin/achievements/store-summary');
  },

  getAdminRoleSummary() {
    return api.get('/admin/achievements/role-summary');
  },

  getAdminEmployeeAchievements(staffId: string) {
    return api.get(`/admin/achievements/employee/${staffId}`);
  },

  upgradeCertificates() {
    return api.post('/admin/achievements/certificates/upgrade', {});
  },
};
