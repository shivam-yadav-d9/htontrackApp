import { api } from './api';

export const festivalService = {
  // ── Admin ──────────────────────────────────────────────────────────────────

  createFestival(payload: any) {
    return api.post('/admin/festivals', payload);
  },

  getFestivals() {
    return api.get('/admin/festivals');
  },

  getUpcomingFestivals(days = 60) {
    return api.get(`/admin/festivals/upcoming?days=${days}`);
  },

  updateFestival(festivalId: string, payload: any) {
    return api.put(`/admin/festivals/${festivalId}`, payload);
  },

  deleteFestival(festivalId: string) {
    return api.delete(`/admin/festivals/${festivalId}`);
  },

  createReadinessTemplate(festivalId: string, payload: any) {
    return api.post(`/admin/festivals/${festivalId}/readiness-template`, payload);
  },

  getFestivalReadiness(festivalId: string) {
    return api.get(`/admin/festivals/${festivalId}/readiness`);
  },

  assignReadiness(festivalId: string, payload: any) {
    return api.post(`/admin/festivals/${festivalId}/assign-readiness`, payload);
  },

  getAdminReadinessSummary() {
    return api.get('/admin/festivals/readiness-summary');
  },

  seedFestivals2026() {
    return api.post('/admin/festivals/seed-2026', {});
  },

  // ── Manager ────────────────────────────────────────────────────────────────

  getManagerUpcoming(days = 60) {
    return api.get(`/manager/festivals/upcoming?days=${days}`);
  },

  getManagerReadiness() {
    return api.get('/manager/festivals/readiness');
  },

  updateManagerReadinessTask(taskId: string, payload: any) {
    return api.post(`/manager/festivals/readiness/${taskId}/update`, payload);
  },

  getManagerReadinessSummary() {
    return api.get('/manager/festivals/readiness-summary');
  },

  // ── Staff ──────────────────────────────────────────────────────────────────

  getStaffUpcoming(days = 60) {
    return api.get(`/staff/festivals/upcoming?days=${days}`);
  },

  getStaffFestivalTasks() {
    return api.get('/staff/festivals/tasks');
  },

  completeStaffFestivalTask(taskId: string, payload: any) {
    return api.post(`/staff/festivals/tasks/${taskId}/complete`, payload);
  },
};
