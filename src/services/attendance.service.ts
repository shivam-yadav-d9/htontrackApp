import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import { useAuthStore } from '@/store/auth.store';
import type {
  AttendanceCorrection,
  AttendanceCorrectionPayload,
  AttendanceReviewPayload,
} from '@/types/attendance.types';
import { storage } from '@/utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LocationPayload = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  device_timestamp?: string | null;
  remarks?: string | null;
};

export type AttendanceSession = {
  id: string;
  staff_id?: string;
  employee_code?: string;
  staff_name?: string;
  store_id?: string;
  store_code?: string;
  store_name?: string;
  manager_id?: string;
  manager_name?: string;
  attendance_date?: string;
  check_in_time?: string | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_in_accuracy?: number | null;
  check_in_distance_meters?: number | null;
  check_in_geofence_status?: string | null;
  check_out_time?: string | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_out_accuracy?: number | null;
  check_out_distance_meters?: number | null;
  check_out_geofence_status?: string | null;
  total_minutes?: number;
  total_hours?: number;
  status?: string;
  source?: string;
  session_number?: number;
  session_label?: string;
  auto_checkin?: boolean;
  auto_checkout?: boolean;
  remarks?: string | null;
  checkout_remarks?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type GeofenceInfo = {
  distance_meters: number;
  allowed_radius_meters: number;
  status: string;
};

export type CheckInResponse = {
  message: string;
  session: AttendanceSession;
  geofence: GeofenceInfo;
};

export type CheckOutResponse = {
  message: string;
  session: AttendanceSession;
  geofence: GeofenceInfo;
};

export type LocationPingResponse = {
  is_inside_geofence: boolean;
  geofence_status: string;
  distance_meters: number;
  allowed_radius_meters: number;
  active_session: AttendanceSession | null;
  action_taken: string;
  auto_checkin_result: CheckInResponse | null;
  auto_checkout_result: CheckOutResponse | null;
};

export type AttendanceStaffInfo = {
  id: string;
  employee_code?: string;
  full_name?: string;
  store_code?: string;
  store_name?: string;
  manager_id?: string;
  manager_name?: string;
};

export type MyAttendanceResponse = {
  staff?: AttendanceStaffInfo;
  active_session: AttendanceSession | null;
  total_sessions?: number;
  sessions: AttendanceSession[];
};

export type MonthlyAttendanceSummary = {
  total_sessions: number;
  completed_sessions: number;
  open_sessions: number;
  total_minutes: number;
  total_hours: number;
  auto_checkin_count: number;
  auto_checkout_count: number;
};

export type MonthlyAttendanceResponse = {
  year: number;
  month: number;
  staff?: AttendanceStaffInfo;
  summary: MonthlyAttendanceSummary;
  sessions: AttendanceSession[];
};

export type ManagerTodayResponse = {
  date: string;
  store_code: string;
  store_name: string;
  team_count: number;
  present_count: number;
  absent_count: number;
  sessions: AttendanceSession[];
};

// Kept for backward compatibility with correction screens
export interface AttendanceRecord {
  id: string;
  staff_id?: string;
  user_id?: string;
  attendance_date?: string;
  date?: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;
  manager_id?: string;
  manager_name?: string;
  store_id?: string;
  store_code?: string;
  store_name?: string;
  check_in_time?: string | null;
  check_in_at?: string | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_in_accuracy?: number | null;
  check_in_distance_meters?: number | null;
  check_out_time?: string | null;
  check_out_at?: string | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_out_accuracy?: number | null;
  check_in_geofence_status?: string | null;
  check_out_geofence_status?: string | null;
  total_minutes?: number | null;
  total_hours?: number | null;
  status?: string | null;
  auto_checkout?: boolean;
  attendance_status?: string | null;
  early_checkout_reason?: string | null;
  working_minutes?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CorrectionRequestPayload {
  correction_type?: string;
  attendance_date: string;
  reason: string;
  requested_check_in?: string;
  requested_check_out?: string;
}

export interface CorrectionRequestOut {
  id: string;
  user_id: string;
  attendance_date: string;
  reason: string;
  requested_check_in: string | null;
  requested_check_out: string | null;
  status: string;
  form_status: string;
  manager_remarks: string | null;
  created_at: string;
}

// ─── Local helpers ────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

async function getMyUserId(): Promise<string> {
  try {
    const raw = await storage.getItem('karmyogi_user');
    if (!raw) return '';
    return (JSON.parse(raw) as { id?: string }).id ?? '';
  } catch {
    return '';
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const attendanceService = {
  // ── GPS-based attendance (new) ────────────────────────────────────────────

  async locationPing(payload: LocationPayload): Promise<LocationPingResponse> {
    const res = await api.post('/staff/attendance/location-ping', payload);
    return res.data;
  },

  async checkIn(payload: {
    latitude: number;
    longitude: number;
  }) {
    const user = useAuthStore.getState().user;

    console.log("CHECKIN API", {
      employeeId: user?.id,
      lat: payload.latitude,
      lang: payload.longitude,
    });

    return api.post(
      "/ontrack/attendance/check-in",
      {
        employeeId: user?.id,
        lat: payload.latitude.toString(),
        lang: payload.longitude.toString(),
      }
    );
  },

  async checkOut(payload: {
    latitude: number;
    longitude: number;
  }) {
    const user = useAuthStore.getState().user;

    console.log("CHECKOUT API", {
      employeeId: user?.id,
      lat: payload.latitude,
      lang: payload.longitude,
    });

    return api.post(
      "/ontrack/attendance/check-out",
      {
        employeeId: user?.id,
        lat: payload.latitude.toString(),
        lang: payload.longitude.toString(),
      }
    );
  },

  async getAttendanceHistory(employeeId: string) {
    const res = await api.get(
      `/ontrack/attendance/${employeeId}`
    );

    return res.data;
  },

  async getStaffMonthWise(year: number, month: number): Promise<StaffMonthWiseResponse> {
    const res = await api.get(`/staff/attendance/month-wise?year=${year}&month=${month}`);
    return res.data;
  },

  async getManagerMonthWise(year: number, month: number): Promise<ManagerAttendanceResponse> {
    const res = await api.get(`/manager/attendance/month-wise?year=${year}&month=${month}`);
    return res.data;
  },

  async getManagerEmployeeGraph(staffId: string, year: number, month: number): Promise<StaffMonthWiseResponse> {
    const res = await api.get(`/manager/attendance/employee/${staffId}/graph?year=${year}&month=${month}`);
    return res.data;
  },

  async getAdminMonthWise(year: number, month: number): Promise<AdminAttendanceResponse> {
    const res = await api.get(`/admin/attendance/month-wise?year=${year}&month=${month}`);
    return res.data;
  },

  async getMyDaySummary(attendanceDate: string): Promise<any> {
    const res = await api.get(`/staff/attendance/my/day-summary?attendance_date=${attendanceDate}`);
    return res.data;
  },

  async getMyMonthlyAttendance(year: number, month: number): Promise<MonthlyAttendanceResponse> {
    const res = await api.get(`/staff/attendance/my/monthly?year=${year}&month=${month}`);
    return res.data;
  },

  async getManagerAttendanceToday(): Promise<ManagerTodayResponse> {
    const res = await api.get('/manager/attendance/today');
    return res.data;
  },

  async getManagerAttendanceMonthly(year: number, month: number): Promise<MonthlyAttendanceResponse> {
    const res = await api.get(`/manager/attendance/monthly?year=${year}&month=${month}`);
    return res.data;
  },

  async getAdminAttendanceAll(): Promise<AttendanceSession[]> {
    const res = await api.get('/admin/attendance');
    return res.data;
  },

  async getAdminAttendanceToday(): Promise<{ date: string; total_sessions: number; sessions: AttendanceSession[] }> {
    const res = await api.get('/admin/attendance/today');
    return res.data;
  },

  async getAdminAttendanceMonthly(year: number, month: number): Promise<MonthlyAttendanceResponse> {
    const res = await api.get(`/admin/attendance/monthly?year=${year}&month=${month}`);
    return res.data;
  },

  // ── Correction requests (kept for correction screens) ─────────────────────

  async submitCorrectionRequest(payload: CorrectionRequestPayload): Promise<CorrectionRequestOut> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      return {
        id: localDb.generateId('corr'),
        user_id: uid,
        attendance_date: payload.attendance_date,
        reason: payload.reason,
        requested_check_in: payload.requested_check_in ?? null,
        requested_check_out: payload.requested_check_out ?? null,
        status: 'pending',
        form_status: 'SUBMITTED',
        manager_remarks: null,
        created_at: nowIso(),
      };
    }
    return api.post<CorrectionRequestOut>('/attendance/correction-request', payload);
  },

  async getCorrectionRequests(): Promise<CorrectionRequestOut[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const data = await localDb.getCollection<{ attendance_corrections?: CorrectionRequestOut[] }>('approvals');
      const d = (data as unknown as { attendance_corrections: CorrectionRequestOut[] }[])[0];
      return (d?.attendance_corrections ?? []).filter((c) => c.user_id === uid);
    }
    return api.get<CorrectionRequestOut[]>('/attendance/correction-requests');
  },

  async createCorrection(payload: AttendanceCorrectionPayload): Promise<AttendanceCorrection> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      return { id: localDb.generateId('corr'), user_id: uid, status: 'pending', form_status: 'SUBMITTED', created_at: nowIso(), ...payload } as unknown as AttendanceCorrection;
    }
    return api.post<AttendanceCorrection>('/attendance/corrections', payload);
  },

  async getManagerCorrections(): Promise<AttendanceCorrection[]> {
    if (APP_MODE === 'offline_apk') {
      const data = await localDb.getCollection<{ attendance_corrections?: AttendanceCorrection[] }>('approvals');
      const d = (data as unknown as { attendance_corrections: AttendanceCorrection[] }[])[0];
      return d?.attendance_corrections ?? [];
    }
    return api.get<AttendanceCorrection[]>('/manager/attendance-corrections');
  },

  async reviewCorrection(id: string, payload: AttendanceReviewPayload): Promise<AttendanceCorrection> {
    if (APP_MODE === 'offline_apk') {
      return { id, status: payload.status, manager_remarks: payload.remarks } as unknown as AttendanceCorrection;
    }
    return api.post<AttendanceCorrection>(`/manager/attendance-corrections/${id}/review`, payload);
  },

  // ── Backward-compatible aliases ───────────────────────────────────────────

  // async getHistory(): Promise<MyAttendanceResponse> {
  //   return attendanceService.getMyAttendance();
  // },

  async getMyAttendance() {
    const user = useAuthStore.getState().user;

    console.log("ATTENDANCE LIST API CALLED", user?.id);

    const records = await api.get(
      `/ontrack/attendance/${user?.id}`
    );

    console.log("ATTENDANCE RECORDS", records);

    return {
      active_session:
        records.find((x: any) => x.status === "OPEN") || null,

      sessions: records.map((item: any) => ({
        id: item._id,

        attendanceDate: item.attendanceDate,
        checkIn: item.checkIn,
        checkOut: item.checkOut,

        durationMinutes: item.durationMinutes,

        status: item.status,

        checkInType: item.checkInType,
        checkOutType: item.checkOutType,

        checkInLocation: item.checkInLocation,
        checkOutLocation: item.checkOutLocation,

        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    };
  },
  async getManagerAttendance() {
    const res = await api.get('/manager/attendance/today');
    return res.data;
  },
};

// ─── Analytics service ────────────────────────────────────────────────────────

export type DailyAttendanceRow = {
  date: string;
  status: 'present' | 'absent' | 'weekly_off' | 'leave' | 'upcoming';
  sessions: number;
  total_minutes: number;
  total_hours: number;
  first_check_in: string | null;
  last_check_out: string | null;
  auto_checkout_count: number;
  outside_geofence_count: number;
  records: AttendanceSession[];
};

export type AttendanceSummary = {
  present_days: number;
  absent_days: number;
  weekly_off_days: number;
  leave_days: number;
  total_sessions: number;
  total_minutes: number;
  total_hours: number;
  auto_checkout_count: number;
  outside_geofence_count: number;
  average_hours_per_present_day: number;
};

export type StaffMonthWiseResponse = {
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
  summary: AttendanceSummary;
  records: DailyAttendanceRow[];
};

export type ManagerAttendanceResponse = {
  year: number;
  month: number;
  manager: { id: string; full_name: string; store_code: string; store_name: string };
  store_summary: AttendanceSummary;
  daily: DailyAttendanceRow[];
  employees: Array<{
    staff_id: string;
    employee_code: string;
    full_name: string;
    department: string;
    designation: string;
    summary: AttendanceSummary;
  }>;
};

export type AdminAttendanceResponse = {
  year: number;
  month: number;
  overall_summary: AttendanceSummary;
  daily: DailyAttendanceRow[];
  store_summaries: Array<{
    store_id: string;
    store_code: string;
    store_name: string;
    city: string;
    zone: string;
    staff_count: number;
    summary: AttendanceSummary;
  }>;
  department_summaries: Array<{
    department: string;
    employee_count: number;
    present_days: number;
    absent_days: number;
    total_hours: number;
    auto_checkout_count: number;
  }>;
};

// ─── Attendance Control & Leave Service ──────────────────────────────────────

export type AttendanceCorrectionCreatePayload = {
  attendance_session_id?: string;
  correction_type: string;
  requested_check_in_time?: string;
  requested_check_out_time?: string;
  reason: string;
  proof_url?: string;
};

export type AttendanceCorrectionRecord = {
  id: string;
  staff_id: string;
  employee_code?: string;
  staff_name?: string;
  store_code?: string;
  attendance_session_id?: string;
  correction_type: string;
  requested_check_in_time?: string | null;
  requested_check_out_time?: string | null;
  reason: string;
  proof_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  manager_remarks?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
};

export type LeaveRequestCreatePayload = {
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
  proof_url?: string;
};

export type LeaveRequestRecord = {
  id: string;
  staff_id: string;
  employee_code?: string;
  staff_name?: string;
  store_code?: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
  proof_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  manager_remarks?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
};

export type ApprovalPayload = { manager_remarks?: string };

export const attendanceControlService = {
  async submitCorrectionRequest(payload: AttendanceCorrectionCreatePayload): Promise<AttendanceCorrectionRecord> {
    const res = await api.post('/staff/attendance/correction-request', payload);
    return res.data;
  },

  async getMyCorrectionRequests(): Promise<AttendanceCorrectionRecord[]> {
    const res = await api.get('/staff/attendance/correction-requests/my');
    return res.data;
  },

  async submitLeaveRequest(payload: LeaveRequestCreatePayload): Promise<LeaveRequestRecord> {
    const res = await api.post('/staff/leave-requests', payload);
    return res.data;
  },

  async getMyLeaveRequests(): Promise<LeaveRequestRecord[]> {
    const res = await api.get('/staff/leave-requests/my');
    return res.data;
  },

  async getManagerCorrectionRequests(): Promise<AttendanceCorrectionRecord[]> {
    const res = await api.get('/manager/attendance/correction-requests');
    return res.data;
  },

  async approveCorrection(requestId: string, payload: ApprovalPayload): Promise<AttendanceCorrectionRecord> {
    const res = await api.post(`/manager/attendance/correction-requests/${requestId}/approve`, payload);
    return res.data;
  },

  async rejectCorrection(requestId: string, payload: ApprovalPayload): Promise<AttendanceCorrectionRecord> {
    const res = await api.post(`/manager/attendance/correction-requests/${requestId}/reject`, payload);
    return res.data;
  },

  async getManagerLeaveRequests(): Promise<LeaveRequestRecord[]> {
    const res = await api.get('/manager/leave-requests');
    return res.data;
  },

  async approveLeave(leaveId: string, payload: ApprovalPayload): Promise<LeaveRequestRecord> {
    const res = await api.post(`/manager/leave-requests/${leaveId}/approve`, payload);
    return res.data;
  },

  async rejectLeave(leaveId: string, payload: ApprovalPayload): Promise<LeaveRequestRecord> {
    const res = await api.post(`/manager/leave-requests/${leaveId}/reject`, payload);
    return res.data;
  },

  async getAdminCorrectionRequests(): Promise<AttendanceCorrectionRecord[]> {
    const res = await api.get('/admin/attendance/correction-requests');
    return res.data;
  },

  async getAdminLeaveRequests(): Promise<LeaveRequestRecord[]> {
    const res = await api.get('/admin/leave-requests');
    return res.data;
  },
};

export const attendanceAnalyticsService = {
  async getStaffSummary(year: number, month: number): Promise<StaffMonthWiseResponse> {
    const res = await api.get(`/staff/attendance/summary?year=${year}&month=${month}`);
    return res.data;
  },

  async getStaffGraph(year: number, month: number): Promise<StaffMonthWiseResponse> {
    const res = await api.get(`/staff/attendance/graph?year=${year}&month=${month}`);
    return res.data;
  },

  async getStaffMonthWise(year: number, month: number): Promise<StaffMonthWiseResponse> {
    const res = await api.get(`/staff/attendance/month-wise?year=${year}&month=${month}`);
    return res.data;
  },

  async getManagerSummary(year: number, month: number): Promise<ManagerAttendanceResponse> {
    const res = await api.get(`/manager/attendance/summary?year=${year}&month=${month}`);
    return res.data;
  },

  async getManagerGraph(year: number, month: number): Promise<ManagerAttendanceResponse> {
    const res = await api.get(`/manager/attendance/graph?year=${year}&month=${month}`);
    return res.data;
  },

  async getManagerMonthWise(year: number, month: number): Promise<ManagerAttendanceResponse> {
    const res = await api.get(`/manager/attendance/month-wise?year=${year}&month=${month}`);
    return res.data;
  },

  async getManagerEmployeeGraph(staffId: string, year: number, month: number): Promise<StaffMonthWiseResponse> {
    const res = await api.get(`/manager/attendance/employee/${staffId}/graph?year=${year}&month=${month}`);
    return res.data;
  },

  async getAdminSummary(year: number, month: number): Promise<AdminAttendanceResponse> {
    const res = await api.get(`/admin/attendance/summary?year=${year}&month=${month}`);
    return res.data;
  },

  async getAdminGraph(year: number, month: number): Promise<AdminAttendanceResponse> {
    const res = await api.get(`/admin/attendance/graph?year=${year}&month=${month}`);
    return res.data;
  },

  async getAdminMonthWise(year: number, month: number): Promise<AdminAttendanceResponse> {
    const res = await api.get(`/admin/attendance/month-wise?year=${year}&month=${month}`);
    return res.data;
  },
};
