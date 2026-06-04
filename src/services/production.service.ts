import { api } from './api';

export const productionService = {
  // ── Admin: Test Cases ──────────────────────────────────────────────────────

  createTestCase(payload: {
    title: string;
    module: string;
    description?: string;
    steps?: string[];
    expected_result?: string;
    priority?: string;
    test_type?: string;
  }) {
    return api.post('/admin/production/test-cases', payload);
  },

  listTestCases(filters?: { module?: string; priority?: string; status?: string }) {
    const qs = filters
      ? '?' + new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString()
      : '';
    return api.get(`/admin/production/test-cases${qs}`);
  },

  // ── Admin: Test Results ────────────────────────────────────────────────────

  submitTestResult(payload: {
    test_case_id: string;
    status: string;
    actual_result?: string;
    notes?: string;
    environment?: string;
    tester_name?: string;
  }) {
    return api.post('/admin/production/test-results', payload);
  },

  listTestResults() {
    return api.get('/admin/production/test-results');
  },

  // ── Admin: UAT Feedback ────────────────────────────────────────────────────

  listUATFeedback(filters?: { module?: string; feedback_type?: string; severity?: string; status?: string }) {
    const qs = filters
      ? '?' + new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString()
      : '';
    return api.get(`/admin/production/uat-feedback${qs}`);
  },

  resolveUATFeedback(feedbackId: string, resolutionNotes: string) {
    return api.post(`/admin/production/uat-feedback/${feedbackId}/resolve?resolution_notes=${encodeURIComponent(resolutionNotes)}`, {});
  },

  // ── Admin: Deployment Checklist ────────────────────────────────────────────

  seedChecklist() {
    return api.post('/admin/production/checklist/seed', {});
  },

  getChecklist() {
    return api.get('/admin/production/checklist');
  },

  updateChecklistItem(itemId: string, payload: { status: string; notes?: string; completed_by?: string }) {
    return api.put(`/admin/production/checklist/${itemId}`, payload);
  },

  // ── Admin: Summary ─────────────────────────────────────────────────────────

  getProductionSummary() {
    return api.get('/admin/production/summary');
  },

  // ── Any user: Submit UAT feedback ─────────────────────────────────────────

  submitFeedback(payload: {
    module: string;
    feedback_type: string;
    title: string;
    description: string;
    severity?: string;
    screen_name?: string;
    user_role?: string;
    device_info?: string;
    steps_to_reproduce?: string;
  }) {
    return api.post('/production/uat-feedback', payload);
  },
};
