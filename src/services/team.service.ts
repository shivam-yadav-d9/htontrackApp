import { api } from "./api";

// ── Admin enriched types ───────────────────────────────────────────────────────

export type AdminStoreEnriched = {
  store_id: string;
  site_code: string;
  store_name: string;
  city: string;
  state: string;
  zone: string;
  region: string;
  format: string;
  profit_centre: string;
  status: string;
  employee_count: number;
  manager_count: number;
  departments: string[];
  latitude: number | null;
  longitude: number | null;
  geofence_radius_meters: number;
  geo_status: string;
  store_karta: { employee_number: string; name: string; role: string; department: string } | null;
  department_managers: { employee_number: string; name: string; role: string; department: string }[];
  total_managers: number;
};

export type AdminManagerEnriched = {
  employee_number: string;
  employee_name: string;
  role: string;
  department: string;
  job_title: string;
  band: string;
  email: string;
  mobile: string;
  store_id: string;
  site_code: string;
  store_name: string;
  city: string;
  zone: string;
  state: string;
  dashboard_type: string;
  permissions_profile: string;
  login_enabled: boolean;
  auth_type: string;
  mapping_type: string;
};

export type AdminEmployeeEnriched = {
  employee_number: string;
  employee_name: string;
  job_title: string;
  department: string;
  band: string;
  email: string;
  mobile: string;
  role: string;
  role_group: string;
  dashboard_type: string;
  permissions_profile: string;
  store_id: string;
  site_code: string;
  store_name: string;
  city: string;
  zone: string;
  state: string;
  manager_name: string | null;
  manager_number: string | null;
  login_enabled: boolean;
  auth_type: string;
  employment_status: string;
};

export type AdminEmployeesResponse = {
  items: AdminEmployeeEnriched[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

export type AdminTeamDeptGroup = {
  department: string;
  manager_number: string | null;
  manager_name: string | null;
  manager_role: string | null;
  staff: { employee_number: string; employee_name: string; job_title: string; department: string; band: string; role: string; dashboard_type: string }[];
  staff_count: number;
  unmapped_staff: string[];
};

export type AdminTeamEnriched = {
  store_id: string;
  site_code: string;
  store_name: string;
  city: string;
  zone: string;
  state: string;
  employee_count: number;
  store_karta: { employee_number: string; name: string; role: string } | null;
  all_managers: { employee_number: string; name: string; role: string; department: string }[];
  departments: AdminTeamDeptGroup[];
  total_staff: number;
};

export type StaffUser = {
  id: string;
  employee_code: string;
  full_name: string;
  email?: string | null;
  mobile?: string | null;
  role: "STAFF";
  status: string;

  department?: string | null;
  designation?: string | null;
  role_key?: string | null;

  store_id?: string | null;
  store_code?: string | null;
  site_code?: string | null;
  store_name?: string | null;

  manager_id?: string | null;
  manager_name?: string | null;
  manager_email?: string | null;
};

export type ManagerTeamSummary = {
  manager_id: string;
  manager_name: string;
  store_id: string;
  store_code: string;
  store_name: string;
  staff_count: number;
  department_counts: Record<string, number>;
  role_counts: Record<string, number>;
  staff: StaffUser[];
};

export const teamService = {
  getManagerTeam() {
    return api.get<StaffUser[]>("/manager/team");
  },

  getManagerTeamSummary() {
    return api.get<ManagerTeamSummary>("/manager/team/summary");
  },

  getManagerTeamMember(staffId: string) {
    return api.get<StaffUser>(`/manager/team/${staffId}`);
  },

  getMyManager() {
    return api.get("/staff/my-manager");
  },

  getMyStore() {
    return api.get("/staff/my-store");
  },
};

// ── Admin Data Service ─────────────────────────────────────────────────────────

export const adminDataService = {
  getStoresEnriched(params?: { zone?: string; status?: string }) {
    const q = new URLSearchParams();
    if (params?.zone) q.set('zone', params.zone);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return api.get<AdminStoreEnriched[]>(`/admin/stores/enriched${qs ? `?${qs}` : ''}`);
  },

  getManagersEnriched(params?: { site_code?: string; role?: string }) {
    const q = new URLSearchParams();
    if (params?.site_code) q.set('site_code', params.site_code);
    if (params?.role) q.set('role', params.role);
    const qs = q.toString();
    return api.get<AdminManagerEnriched[]>(`/admin/managers/enriched${qs ? `?${qs}` : ''}`);
  },

  getEmployeesEnriched(params?: { site_code?: string; department?: string; role?: string; search?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.site_code) q.set('site_code', params.site_code);
    if (params?.department) q.set('department', params.department);
    if (params?.role) q.set('role', params.role);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<AdminEmployeesResponse>(`/admin/employees/enriched${qs ? `?${qs}` : ''}`);
  },

  getTeamsEnriched(params?: { zone?: string; site_code?: string }) {
    const q = new URLSearchParams();
    if (params?.zone) q.set('zone', params.zone);
    if (params?.site_code) q.set('site_code', params.site_code);
    const qs = q.toString();
    return api.get<AdminTeamEnriched[]>(`/admin/teams/enriched${qs ? `?${qs}` : ''}`);
  },

  getAttendanceJoined(params?: { period?: string; site_code?: string; department?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.period) q.set('period', params.period);
    if (params?.site_code) q.set('site_code', params.site_code);
    if (params?.department) q.set('department', params.department);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<any>(`/admin/attendance/joined${qs ? `?${qs}` : ''}`);
  },

  getTargetsJoined(params?: { period_id?: string; site_code?: string; department?: string; role?: string; level?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.period_id) q.set('period_id', params.period_id);
    if (params?.site_code) q.set('site_code', params.site_code);
    if (params?.department) q.set('department', params.department);
    if (params?.role) q.set('role', params.role);
    if (params?.level) q.set('level', params.level);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<any>(`/admin/targets/joined${qs ? `?${qs}` : ''}`);
  },

  getIncentivesJoined(params?: { period_id?: string; site_code?: string; status?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.period_id) q.set('period_id', params.period_id);
    if (params?.site_code) q.set('site_code', params.site_code);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<any>(`/admin/incentives/joined${qs ? `?${qs}` : ''}`);
  },

  getCoursesJoined(params?: { site_code?: string; course_id?: string; status?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.site_code) q.set('site_code', params.site_code);
    if (params?.course_id) q.set('course_id', params.course_id);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<any>(`/admin/courses/joined${qs ? `?${qs}` : ''}`);
  },

  getChecklistsJoined(params?: { site_code?: string; template_id?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.site_code) q.set('site_code', params.site_code);
    if (params?.template_id) q.set('template_id', params.template_id);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<any>(`/admin/checklists/joined${qs ? `?${qs}` : ''}`);
  },

  getStoreConversions(params?: { period_key?: string; zone?: string; performance_status?: string }) {
    const q = new URLSearchParams();
    if (params?.period_key) q.set('period_key', params.period_key);
    if (params?.zone) q.set('zone', params.zone);
    if (params?.performance_status) q.set('performance_status', params.performance_status);
    const qs = q.toString();
    return api.get<any[]>(`/admin/store-conversions${qs ? `?${qs}` : ''}`);
  },

  getStoreConversionSummary(params?: { period_key?: string }) {
    const q = new URLSearchParams();
    if (params?.period_key) q.set('period_key', params.period_key);
    const qs = q.toString();
    return api.get<any>(`/admin/store-conversions/summary${qs ? `?${qs}` : ''}`);
  },

  getAdminNotices(params?: { status?: string; notice_type?: string; priority?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.notice_type) q.set('notice_type', params.notice_type);
    if (params?.priority) q.set('priority', params.priority);
    const qs = q.toString();
    return api.get<any[]>(`/admin/notices${qs ? `?${qs}` : ''}`);
  },

  publishAdminNotice(noticeId: string) {
    return api.post(`/admin/notices/${noticeId}/publish`, {});
  },

  archiveAdminNotice(noticeId: string) {
    return api.post(`/admin/notices/${noticeId}/archive`, {});
  },

  getReportTypes() {
    return api.get<{ id: string; label: string; category: string }[]>('/admin/reports/types');
  },

  generateReport(reportType: string) {
    return api.get<any[]>(`/admin/reports/generate/${reportType}`);
  },
};
