import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  ExportReportResponse,
  StaffPerformanceReport,
  StoreSummaryReport,
} from '@/types/report.types';
import { storage } from '@/utils/storage';

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

async function buildStaffReport(userId: string): Promise<StaffPerformanceReport> {
  const [users, assignments, courses, quizzes, attendance, certificates, rewards, alerts, coaching] = await Promise.all([
    localDb.getCollection<{ id: string; full_name?: string; email?: string; employee_code?: string; role?: string; store_code?: string; store_name?: string }>('users'),
    localDb.getCollection<{ id: string; assigned_to_user_id?: string; status?: string }>('assignments'),
    localDb.getCollection<{ id: string; assigned_to?: string; status?: string; progress_percentage?: number }>('courses'),
    localDb.getCollection<{ id: string; attempts_used?: number; passing_score?: number }>('quizzes'),
    localDb.getCollection<{ id: string; user_id: string; status?: string; date?: string }>('attendance'),
    localDb.getCollection<{ id: string; staff_id?: string }>('certificates'),
    localDb.getCollection<{ id: string; staff_id?: string; points?: number }>('rewards'),
    localDb.getCollection<{ id: string; staff_id?: string; status?: string }>('performance_alerts'),
    localDb.getCollection<{ id: string; staff_id?: string; status?: string }>('coaching_plans'),
  ]);

  const user = users.find((u) => u.id === userId);
  const myAssignments = assignments.filter((a) => a.assigned_to_user_id === userId);
  const myAttendance = attendance.filter((a) => a.user_id === userId);
  const myCerts = certificates.filter((c) => c.staff_id === userId);
  const myRewards = rewards.filter((r) => r.staff_id === userId);
  const myAlerts = alerts.filter((a) => a.staff_id === userId);
  const myCoaching = coaching.filter((c) => c.staff_id === userId);

  const submitted = myAssignments.filter((a) => ['submitted', 'approved'].includes(a.status ?? '')).length;
  const present = myAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const late = myAttendance.filter((a) => a.status === 'late').length;
  const completedCourses = courses.filter((c) => c.assigned_to === userId && c.status === 'completed').length;
  const totalCourses = courses.filter((c) => c.assigned_to === userId).length;
  const totalRewardPts = myRewards.reduce((s, r) => s + (r.points ?? 0), 0);

  const completionPct = myAssignments.length > 0 ? Math.round((submitted / myAssignments.length) * 100) : 0;
  const coursePct = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
  const healthScore = Math.round((completionPct * 0.3) + (coursePct * 0.3) + (present > 0 ? Math.min(100, (present / Math.max(1, myAttendance.length)) * 100) * 0.4 : 0));

  return {
    staff: { id: userId, full_name: user?.full_name, email: user?.email, employee_code: user?.employee_code, role: user?.role, store_code: user?.store_code, store_name: user?.store_name },
    period: { start_date: null, end_date: null },
    attendance: { records: myAttendance.length, present_days: present, late_days: late, approved_leave_days: 0 },
    assignments: { assigned: myAssignments.length, submitted, completion_percentage: completionPct },
    courses: { assigned: totalCourses, completed: completedCourses, completion_percentage: coursePct },
    quizzes: { assigned: quizzes.length, attempted: quizzes.filter((q) => (q.attempts_used ?? 0) > 0).length, passed: 0, pass_rate: 0, average_score: 0 },
    checklists: { submitted: 0, issue_count: 0 },
    tickets: { total: 0, open: 0 },
    skills: { ratings: 0, average_score: 0, low_skill_count: 0 },
    targets: { assigned: 0, average_progress: 0 },
    documents: { submitted: 0, rejected: 0 },
    approvals: { leave_requests: 0, attendance_corrections: 0, pending: 0 },
    performance_alerts: { total: myAlerts.length, open: myAlerts.filter((a) => a.status === 'open').length },
    coaching: { total: myCoaching.length, open: myCoaching.filter((c) => c.status === 'active').length },
    rewards: { total: myRewards.length, points: totalRewardPts, certificates: myCerts.length },
    overall: { health_score: healthScore, risk_level: healthScore >= 75 ? 'low' : healthScore >= 50 ? 'medium' : 'high' },
  };
}

function toQuery(params?: { start_date?: string; end_date?: string }) {
  if (!params) return '';
  const query = new URLSearchParams();
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  const queryText = query.toString();
  return queryText ? `?${queryText}` : '';
}

export const reportService = {
  async getStoreSummary(params?: { start_date?: string; end_date?: string }): Promise<StoreSummaryReport> {
    if (APP_MODE === 'offline_apk') {
      const users = await localDb.getCollection<{ id: string; role?: string }>('users');
      const staffIds = users.filter((u) => u.role === 'STAFF').map((u) => u.id);
      const staffReports = await Promise.all(staffIds.map((id) => buildStaffReport(id)));
      const avg = staffReports.length > 0 ? Math.round(staffReports.reduce((s, r) => s + r.overall.health_score, 0) / staffReports.length) : 0;
      return {
        store: { store_code: 'HT-MUM-001', store_name: 'HomeTown Mumbai Thane' },
        period: { start_date: params?.start_date ?? null, end_date: params?.end_date ?? null },
        summary: { total_staff: staffIds.length, average_health_score: avg, high_risk_staff: staffReports.filter((r) => r.overall.risk_level === 'high').length, open_performance_alerts: 0, total_reward_points: 0, assignment_completion: 0, course_completion: 0, average_quiz_score: 0, target_progress: 0 },
        risk_staff: staffReports.filter((r) => r.overall.risk_level !== 'low'),
        staff_reports: staffReports,
      };
    }
    return api.get<StoreSummaryReport>(`/manager/reports/store-summary${toQuery(params)}`);
  },

  async getStaffSummary(params?: { start_date?: string; end_date?: string }): Promise<StaffPerformanceReport[]> {
    if (APP_MODE === 'offline_apk') {
      const users = await localDb.getCollection<{ id: string; role?: string }>('users');
      const staffIds = users.filter((u) => u.role === 'STAFF').map((u) => u.id);
      return Promise.all(staffIds.map((id) => buildStaffReport(id)));
    }
    return api.get<StaffPerformanceReport[]>(`/manager/reports/staff-summary${toQuery(params)}`);
  },

  async getSingleStaffReport(staffId: string, params?: { start_date?: string; end_date?: string }): Promise<StaffPerformanceReport> {
    if (APP_MODE === 'offline_apk') return buildStaffReport(staffId);
    return api.get<StaffPerformanceReport>(`/manager/reports/staff/${staffId}${toQuery(params)}`);
  },

  async exportStoreReport(params?: { start_date?: string; end_date?: string }): Promise<ExportReportResponse> {
    if (APP_MODE === 'offline_apk') {
      const summary = await reportService.getStoreSummary(params);
      return {
        file_type: 'csv_ready_json',
        store_code: 'HT-MUM-001',
        generated_at: new Date().toISOString(),
        rows: summary.staff_reports.map((r) => ({
          name: r.staff.full_name ?? '',
          employee_code: r.staff.employee_code ?? '',
          attendance: r.attendance.present_days,
          assignments_pct: r.assignments.completion_percentage,
          courses_pct: r.courses.completion_percentage,
          health_score: r.overall.health_score,
          risk: r.overall.risk_level,
        })),
      };
    }
    return api.get<ExportReportResponse>(`/manager/reports/export${toQuery(params)}`);
  },

  async getMySummary(params?: { start_date?: string; end_date?: string }): Promise<StaffPerformanceReport> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      return buildStaffReport(uid);
    }
    return api.get<StaffPerformanceReport>(`/staff/reports/my-summary${toQuery(params)}`);
  },

  // ── Step 79 additions ─────────────────────────────────────────────────────

  getAdminReportTypes() {
    return api.get('/admin/reports/types');
  },

  generateAdminReport(payload: any) {
    return api.post('/admin/reports/generate', payload);
  },

  getAdminDownloads() {
    return api.get('/admin/reports/downloads');
  },

  getAdminSummary() {
    return api.get('/admin/reports/summary');
  },

  exportAdminExcel(reportType: string, periodKey?: string, storeCode?: string) {
    const p = new URLSearchParams({ report_type: reportType });
    if (periodKey) p.append('period_key', periodKey);
    if (storeCode) p.append('store_code', storeCode);
    return api.get(`/admin/reports/export/excel?${p}`);
  },

  exportAdminPdf(reportType: string, periodKey?: string, storeCode?: string) {
    const p = new URLSearchParams({ report_type: reportType });
    if (periodKey) p.append('period_key', periodKey);
    if (storeCode) p.append('store_code', storeCode);
    return api.get(`/admin/reports/export/pdf?${p}`);
  },

  getManagerReportTypes() {
    return api.get('/manager/reports/types');
  },

  generateManagerReport(payload: any) {
    return api.post('/manager/reports/generate', payload);
  },

  getManagerDownloadHistory() {
    return api.get('/manager/reports/download-history');
  },

  getMyReports() {
    return api.get('/staff/reports/my');
  },
};
