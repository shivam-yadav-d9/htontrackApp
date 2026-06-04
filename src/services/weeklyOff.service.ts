import { api } from './api';

export type WeeklyOffRecord = {
  id: string;
  staff_id?: string;
  employee_code?: string;
  staff_name?: string;
  store_code?: string;
  store_name?: string;
  manager_id?: string;
  manager_name?: string;
  department?: string;
  designation?: string;
  off_date: string;
  off_type: string;
  source?: string;
  status?: string;
};

export type WeeklyOffTodayResponse = {
  date: string;
  is_weekly_off_today: boolean;
  weekly_off: WeeklyOffRecord | null;
};

export type WeeklyOffMonthlyResponse = {
  year: number;
  month: number;
  staff: {
    id: string;
    employee_code: string;
    full_name: string;
    store_code: string;
    store_name: string;
    manager_name: string;
  };
  total_weekly_offs: number;
  weekly_offs: WeeklyOffRecord[];
};

export type ManagerTodayWeeklyOffsResponse = {
  date: string;
  manager: { id: string; full_name: string; store_code: string; store_name: string };
  count: number;
  employees_on_weekly_off: WeeklyOffRecord[];
};

export type ManagerUpcomingWeeklyOffsResponse = {
  from_date: string;
  to_date: string;
  store_code: string;
  total: number;
  date_wise: Array<{ date: string; count: number; employees: WeeklyOffRecord[] }>;
};

export type ManagerMonthlyWeeklyOffsResponse = {
  year: number;
  month: number;
  store_code: string;
  store_name: string;
  total_weekly_offs: number;
  date_wise: Array<{ date: string; count: number; employees: WeeklyOffRecord[] }>;
  records: WeeklyOffRecord[];
};

export type ManpowerRiskRow = {
  date: string;
  team_count: number;
  weekly_off_count: number;
  available_count: number;
  off_percentage: number;
  risk_level: 'high' | 'medium' | 'low';
  employees_on_weekly_off: WeeklyOffRecord[];
};

export type ManpowerRiskResponse = {
  year: number;
  month: number;
  store_code: string;
  store_name: string;
  team_count: number;
  high_risk_days: number;
  medium_risk_days: number;
  low_risk_days: number;
  risk_rows: ManpowerRiskRow[];
};

export type WeeklyOffChangeRequest = {
  id: string;
  staff_id: string;
  employee_code?: string;
  staff_name?: string;
  store_code?: string;
  store_name?: string;
  current_off_date: string;
  requested_off_date: string;
  reason: string;
  proof_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  manager_remarks?: string | null;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  created_at: string;
};

export const weeklyOffService = {
  async getMyWeeklyOffs(): Promise<WeeklyOffRecord[]> {
    const res = await api.get('/staff/weekly-offs/my');
    return res.data;
  },

  async getMyWeeklyOffToday(): Promise<WeeklyOffTodayResponse> {
    const res = await api.get('/staff/weekly-offs/my/today');
    return res.data;
  },

  async getMyMonthlyWeeklyOffs(year: number, month: number): Promise<WeeklyOffMonthlyResponse> {
    const res = await api.get(`/staff/weekly-offs/my/monthly?year=${year}&month=${month}`);
    return res.data;
  },

  async createChangeRequest(payload: {
    current_off_date: string;
    requested_off_date: string;
    reason: string;
    proof_url?: string | null;
  }): Promise<WeeklyOffChangeRequest> {
    const res = await api.post('/staff/weekly-offs/change-request', payload);
    return res.data;
  },

  async getManagerTodayWeeklyOffs(): Promise<ManagerTodayWeeklyOffsResponse> {
    const res = await api.get('/manager/weekly-offs/today');
    return res.data;
  },

  async getManagerUpcomingWeeklyOffs(days = 7): Promise<ManagerUpcomingWeeklyOffsResponse> {
    const res = await api.get(`/manager/weekly-offs/upcoming?days=${days}`);
    return res.data;
  },

  async getManagerMonthlyWeeklyOffs(year: number, month: number): Promise<ManagerMonthlyWeeklyOffsResponse> {
    const res = await api.get(`/manager/weekly-offs/monthly?year=${year}&month=${month}`);
    return res.data;
  },

  async getManagerManpowerRisk(year: number, month: number): Promise<ManpowerRiskResponse> {
    const res = await api.get(`/manager/weekly-offs/manpower-risk?year=${year}&month=${month}`);
    return res.data;
  },

  async getManagerChangeRequests(): Promise<WeeklyOffChangeRequest[]> {
    const res = await api.get('/manager/weekly-offs/change-requests');
    return res.data;
  },

  async approveChangeRequest(requestId: string, manager_remarks?: string): Promise<WeeklyOffChangeRequest> {
    const res = await api.post(`/manager/weekly-offs/change-requests/${requestId}/approve`, { manager_remarks });
    return res.data;
  },

  async rejectChangeRequest(requestId: string, manager_remarks?: string): Promise<WeeklyOffChangeRequest> {
    const res = await api.post(`/manager/weekly-offs/change-requests/${requestId}/reject`, { manager_remarks });
    return res.data;
  },

  async getAdminTodayWeeklyOffs() {
    const res = await api.get('/admin/weekly-offs/today');
    return res.data;
  },

  async getAdminMonthlyWeeklyOffs(year: number, month: number) {
    const res = await api.get(`/admin/weekly-offs/monthly?year=${year}&month=${month}`);
    return res.data;
  },

  async getAdminStoreSummary(year: number, month: number) {
    const res = await api.get(`/admin/weekly-offs/store-summary?year=${year}&month=${month}`);
    return res.data;
  },

  async getAdminChangeRequests(): Promise<WeeklyOffChangeRequest[]> {
    const res = await api.get('/admin/weekly-offs/change-requests');
    return res.data;
  },
};
