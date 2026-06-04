import { api } from './api';

export type Employee = {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  mobile?: string | null;
  role: string;
  role_key?: string | null;
  department?: string | null;
  designation?: string | null;
  status: string;

  store_id?: string | null;
  store_code?: string | null;
  site_code?: string | null;
  store_name?: string | null;
  city?: string | null;
  state?: string | null;
  zone?: string | null;

  manager_id?: string | null;
  manager_name?: string | null;
  manager_email?: string | null;

  profile_photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type EmployeeCreatePayload = {
  full_name: string;
  email: string;
  mobile?: string;
  employee_code?: string;
  department?: string;
  designation?: string;
  store_id?: string;
  store_code?: string;
  password?: string;
  status?: string;
};

export type EmployeeUpdatePayload = {
  full_name?: string;
  email?: string;
  mobile?: string;
  department?: string;
  designation?: string;
  store_id?: string;
  store_code?: string;
  status?: string;
};

export type EmployeeDetail = {
  employee: Employee;
  store?: Record<string, unknown> | null;
  manager?: Record<string, unknown> | null;
};

export type EmployeeSummary = {
  employee: Employee;
  store?: Record<string, unknown> | null;
  manager?: Record<string, unknown> | null;
  summary: {
    attendance_sessions: number;
    monthly_targets: number;
    certificates: number;
    incentives: number;
    courses_attempted: number;
  };
};

export type EmployeeImportResult = {
  created: number;
  updated: number;
  errors: number;
  error_details: Array<{ email: string; error: string }>;
};

export const employeeService = {
  // ── List / detail ──────────────────────────────────────────────────────────

  async getAdminEmployees(): Promise<Employee[]> {
    const res = await api.get('/admin/employees');
    return res.data;
  },

  async getAdminEmployee(employeeId: string): Promise<EmployeeDetail> {
    const res = await api.get(`/admin/employees/${employeeId}`);
    return res.data;
  },

  // ── Create / update / deactivate ───────────────────────────────────────────

  async createAdminEmployee(payload: EmployeeCreatePayload): Promise<Employee> {
    const res = await api.post('/admin/employees', payload);
    return res.data;
  },

  async updateAdminEmployee(employeeId: string, payload: EmployeeUpdatePayload): Promise<Employee> {
    const res = await api.put(`/admin/employees/${employeeId}`, payload);
    return res.data;
  },

  async deactivateAdminEmployee(employeeId: string): Promise<Employee> {
    const res = await api.delete(`/admin/employees/${employeeId}`);
    return res.data;
  },

  // ── Import ─────────────────────────────────────────────────────────────────

  async importAdminEmployees(employees: EmployeeCreatePayload[]): Promise<EmployeeImportResult> {
    const res = await api.post('/admin/employees/import', { employees });
    return res.data;
  },

  // ── Assignment ─────────────────────────────────────────────────────────────

  async assignAdminEmployeeStore(employeeId: string, storeId: string): Promise<Employee> {
    const res = await api.post(`/admin/employees/${employeeId}/assign-store`, { store_id: storeId });
    return res.data;
  },

  async assignAdminEmployeeManager(employeeId: string, managerId: string): Promise<Employee> {
    const res = await api.post(`/admin/employees/${employeeId}/assign-manager`, { manager_id: managerId });
    return res.data;
  },

  async resetAdminEmployeePassword(employeeId: string, newPassword: string): Promise<{ message: string; employee_id: string }> {
    const res = await api.post(`/admin/employees/${employeeId}/reset-password`, { new_password: newPassword });
    return res.data;
  },

  // ── Sub-resources ──────────────────────────────────────────────────────────

  async getAdminEmployeeSummary(employeeId: string): Promise<EmployeeSummary> {
    const res = await api.get(`/admin/employees/${employeeId}/summary`);
    return res.data;
  },

  async getAdminEmployeeProfile(employeeId: string): Promise<{ employee: Employee; profile: Record<string, unknown> | null }> {
    const res = await api.get(`/admin/employees/${employeeId}/profile`);
    return res.data;
  },

  async getAdminEmployeeTargets(employeeId: string): Promise<{ employee: Employee; monthly_targets: unknown[]; daily_targets: unknown[] }> {
    const res = await api.get(`/admin/employees/${employeeId}/targets`);
    return res.data;
  },

  async getAdminEmployeeAttendance(employeeId: string): Promise<{ employee: Employee; attendance_sessions: unknown[]; total: number }> {
    const res = await api.get(`/admin/employees/${employeeId}/attendance`);
    return res.data;
  },

  async getAdminEmployeeCourses(employeeId: string): Promise<{ employee: Employee; course_results: unknown[]; certificates: unknown[] }> {
    const res = await api.get(`/admin/employees/${employeeId}/courses`);
    return res.data;
  },

  async getAdminEmployeeIncentives(employeeId: string): Promise<{ employee: Employee; incentives: unknown[]; total: number }> {
    const res = await api.get(`/admin/employees/${employeeId}/incentives`);
    return res.data;
  },
};
