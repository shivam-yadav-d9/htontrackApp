import { APP_MODE } from '@/config/appMode';
import { api } from './api';

// ── Legacy types (kept for backward compatibility with getSummary etc.) ────────
export type DashboardCard = {
  key: string;
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: string;
  status?: 'good' | 'warning' | 'critical' | 'neutral' | string;
};

export type DashboardAlert = {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'urgent' | string;
  title: string;
  description: string;
  module: string;
  action_route?: string | null;
};

export type StorePerformance = {
  store_id: string | null;
  store_code: string;
  store_name: string | null;
  city: string | null;
  state: string | null;
  zone: string | null;
  manager_id: string | null;
  manager_name: string | null;
  staff_count: number;
  present_today: number;
  attendance_percentage: number;
  monthly_target: number;
  monthly_target_display: string;
  monthly_achieved: number;
  monthly_achieved_display: string;
  achievement_percentage: number;
  status: 'excellent' | 'good' | 'risk' | 'critical' | string;
};

export type AdminDashboardResponse = {
  summary_cards: DashboardCard[];
  attendance_summary: Record<string, unknown>;
  target_summary: Record<string, unknown>;
  store_performance: StorePerformance[];
  department_performance: Record<string, unknown>[];
  manager_summary: Record<string, unknown>[];
  employee_summary: Record<string, unknown>;
  lms_summary: Record<string, unknown>;
  incentive_summary: Record<string, unknown>;
  certificate_summary: Record<string, unknown>;
  alerts: DashboardAlert[];
  charts: Record<string, unknown>;
  recent_activity: Record<string, unknown>[];
};

// ── New consolidated mobile dashboard types ────────────────────────────────────
export type MobileStoreRow = {
  store_code: string;
  store_name: string;
  city: string;
  state: string;
  zone: string;
  manager_name: string | null;
  staff_count: number;
  attendance_pct: number;
  achievement_pct: number;
  target: number;
  achieved: number;
  target_display: string;
  achieved_display: string;
  status: 'excellent' | 'good' | 'risk' | 'critical' | string;
};

export type MobileAlert = {
  id: string;
  title: string;
  description: string;
  module: string;
  severity: 'critical' | 'warning' | string;
  cta: string;
};

export type MobileDashboardResponse = {
  overview: {
    total_stores: number;
    active_stores: number;
    inactive_stores: number;
    total_staff: number;
    active_staff: number;
    inactive_staff: number;
    unmapped_staff: number;
    total_managers: number;
    mapped_managers: number;
    stores_without_manager: number;
    total_alerts: number;
    critical_alerts: number;
    warning_alerts: number;
  };
  attendance: {
    attendance_percentage: number;
    present: number;
    absent: number;
    late_checkins: number;
    outside_geofence: number;
    weekly_off: number;
    on_leave: number;
    total_staff: number;
  };
  targets: {
    target_amount: number;
    target_display: string;
    achieved_amount: number;
    achieved_display: string;
    shortfall_amount: number;
    shortfall_display: string;
    achievement_percentage: number;
    target_achievers: number;
    low_performers: number;
    top_store: string;
    lowest_store: string;
  };
  workforce: {
    total_employees: number;
    active_employees: number;
    inactive_employees: number;
    mapped_to_store: number;
    unmapped_to_store: number;
    mapped_to_manager: number;
    without_manager: number;
    role_assigned: number;
    role_missing: number;
    weekly_off_assigned: number;
    weekly_off_missing: number;
  };
  lms: {
    total_courses: number;
    published_courses: number;
    draft_courses: number;
    attempts: number;
    pass_rate: number;
    failed_attempts: number;
    pending_staff: number;
    certificates_issued: number;
    top_course: string;
    weak_course: string;
  };
  checklists: {
    templates: number;
    assigned_today: number;
    completed: number;
    pending: number;
    completion_rate: number;
    issues_found: number;
    pending_review: number;
  };
  manager_actions: {
    tasks_created_today: number;
    tasks_completed: number;
    pending_tasks: number;
    overdue_tasks: number;
    approvals_pending: number;
    attendance_corrections_pending: number;
    leave_requests_pending: number;
  };
  store_performance: {
    top_stores: MobileStoreRow[];
    risk_stores: MobileStoreRow[];
  };
  alerts: {
    critical: MobileAlert[];
    warnings: MobileAlert[];
  };
};

// ── Offline fallback ───────────────────────────────────────────────────────────
const OFFLINE_MOBILE: MobileDashboardResponse = {
  overview: {
    total_stores: 15, active_stores: 15, inactive_stores: 0,
    total_staff: 84, active_staff: 84, inactive_staff: 0, unmapped_staff: 0,
    total_managers: 14, mapped_managers: 14, stores_without_manager: 1,
    total_alerts: 5, critical_alerts: 1, warning_alerts: 4,
  },
  attendance: {
    attendance_percentage: 84, present: 70, absent: 14,
    late_checkins: 3, outside_geofence: 0, weekly_off: 8, on_leave: 2,
    total_staff: 84,
  },
  targets: {
    target_amount: 122393000, target_display: '₹12.24Cr',
    achieved_amount: 104763890, achieved_display: '₹10.48Cr',
    shortfall_amount: 17629110, shortfall_display: '₹1.76Cr',
    achievement_percentage: 86, target_achievers: 47, low_performers: 18,
    top_store: 'HomeTown Thane', lowest_store: 'HomeTown Lucknow',
  },
  workforce: {
    total_employees: 84, active_employees: 84, inactive_employees: 0,
    mapped_to_store: 84, unmapped_to_store: 0,
    mapped_to_manager: 84, without_manager: 0,
    role_assigned: 80, role_missing: 4,
    weekly_off_assigned: 0, weekly_off_missing: 84,
  },
  lms: {
    total_courses: 8, published_courses: 7, draft_courses: 1,
    attempts: 0, pass_rate: 0, failed_attempts: 0,
    pending_staff: 84, certificates_issued: 0,
    top_course: 'Furniture Sales Excellence', weak_course: 'Cashier Billing Accuracy',
  },
  checklists: {
    templates: 6, assigned_today: 90, completed: 64, pending: 26,
    completion_rate: 72, issues_found: 3, pending_review: 5,
  },
  manager_actions: {
    tasks_created_today: 0, tasks_completed: 0, pending_tasks: 0,
    overdue_tasks: 0, approvals_pending: 5,
    attendance_corrections_pending: 0, leave_requests_pending: 5,
  },
  store_performance: { top_stores: [], risk_stores: [] },
  alerts: {
    critical: [{ id: 'a1', title: '1 store has no manager', description: 'Assign a manager immediately.', module: 'stores', severity: 'critical', cta: 'Assign' }],
    warnings: [{ id: 'a2', title: '14 staff absent today', description: 'Review coverage.', module: 'attendance', severity: 'warning', cta: 'View' }],
  },
};

// ── Legacy offline dashboard (for old methods) ─────────────────────────────────
const OFFLINE_DASHBOARD: AdminDashboardResponse = {
  summary_cards: [
    { key: 'total_stores', title: 'TOTAL STORES', value: 15, subtitle: 'Nationwide', status: 'good' },
    { key: 'total_staff', title: 'TOTAL STAFF', value: 84, subtitle: 'Active employees', status: 'good' },
    { key: 'attendance_pct', title: 'ATTENDANCE', value: '84%', subtitle: 'Today', status: 'warning' },
    { key: 'target_pct', title: 'TARGET', value: '86%', subtitle: 'This month', status: 'good' },
  ],
  attendance_summary: { present: 70, absent: 14, weekly_off: 8, leave: 2, attendance_percentage: 84, total_staff: 84 },
  target_summary: {
    monthly_target: 122393000, monthly_target_display: '₹12.24 Cr',
    monthly_achieved: 104763890, monthly_achieved_display: '₹10.48 Cr',
    monthly_shortfall: 17629110, monthly_shortfall_display: '₹1.76 Cr',
    achievement_percentage: 86,
  },
  store_performance: [],
  department_performance: [],
  manager_summary: [],
  employee_summary: { total_employees: 84, mapped_employees: 84, unmapped_employees: 0 },
  lms_summary: { total_courses: 8, total_attempts: 0, pass_rate: 0 },
  incentive_summary: {},
  certificate_summary: {},
  alerts: [],
  charts: {},
  recent_activity: [],
};

// ── Service ────────────────────────────────────────────────────────────────────
export const adminDashboardService = {
  getMobileDashboard(): Promise<MobileDashboardResponse> {
    if (APP_MODE === 'offline_apk') return Promise.resolve(OFFLINE_MOBILE);
    return api.get<MobileDashboardResponse>('/admin/command-center');
  },

  getDashboard(): Promise<AdminDashboardResponse> {
    if (APP_MODE === 'offline_apk') return Promise.resolve(OFFLINE_DASHBOARD);
    return api.get<AdminDashboardResponse>('/admin/dashboard');
  },

  getSummary(): Promise<Pick<AdminDashboardResponse, 'summary_cards' | 'alerts'>> {
    if (APP_MODE === 'offline_apk') {
      return Promise.resolve({ summary_cards: OFFLINE_DASHBOARD.summary_cards, alerts: OFFLINE_DASHBOARD.alerts });
    }
    return api.get<Pick<AdminDashboardResponse, 'summary_cards' | 'alerts'>>('/admin/dashboard/summary');
  },

  getAttendance() {
    if (APP_MODE === 'offline_apk') {
      return Promise.resolve({ attendance_summary: OFFLINE_DASHBOARD.attendance_summary, charts: {} });
    }
    return api.get<{ attendance_summary: Record<string, unknown>; charts: Record<string, unknown> }>(
      '/admin/dashboard/attendance',
    );
  },

  getTargets() {
    if (APP_MODE === 'offline_apk') {
      return Promise.resolve({ target_summary: OFFLINE_DASHBOARD.target_summary, store_performance: [], department_performance: [], charts: {} });
    }
    return api.get<{
      target_summary: Record<string, unknown>;
      store_performance: StorePerformance[];
      department_performance: Record<string, unknown>[];
      charts: Record<string, unknown>;
    }>('/admin/dashboard/targets');
  },

  getLms() {
    if (APP_MODE === 'offline_apk') {
      return Promise.resolve({ lms_summary: OFFLINE_DASHBOARD.lms_summary, certificate_summary: {} });
    }
    return api.get<{ lms_summary: Record<string, unknown>; certificate_summary: Record<string, unknown> }>(
      '/admin/dashboard/lms',
    );
  },

  getIncentives() {
    if (APP_MODE === 'offline_apk') return Promise.resolve({ incentive_summary: {} });
    return api.get<{ incentive_summary: Record<string, unknown> }>('/admin/dashboard/incentives');
  },

  getHealth() {
    if (APP_MODE === 'offline_apk') return Promise.resolve({ status: 'ok', checks: {} });
    return api.get<{ status: string; checks: Record<string, boolean> }>('/admin/dashboard/health');
  },
};
