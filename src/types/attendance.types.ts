export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'on_time';
export type CheckStatus = 'success' | 'outside_geofence' | 'error' | 'duplicate';
export type CheckoutStatus = 'completed' | 'early';

export interface AttendanceRecord {
  id: string;

  // JSON backend fields
  staff_id?: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  manager_id?: string;
  manager_name?: string;

  attendance_date?: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  working_minutes?: number;
  attendance_status?: AttendanceStatus | null;
  checkout_status?: CheckoutStatus | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  device_info?: string | null;
  checkin_remarks?: string | null;
  checkout_remarks?: string | null;
  early_checkout_reason?: string | null;

  // DB backend legacy fields
  date?: string;
  check_in_status?: CheckStatus;
  check_out_status?: CheckStatus | null;
  check_in_distance_meters?: number | null;
  status?: AttendanceStatus;
  remarks?: string;

  created_at?: string;
  updated_at?: string;
}

export interface AttendanceToday {
  date: string;
  checked_in: boolean;
  checked_out: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
  store: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    geofence_radius_meters: number;
    address: string;
  } | null;
}

export type CheckInPayload = {
  location_name?: string;
  latitude?: number;
  longitude?: number;
  device_info?: string;
  remarks?: string;
};

export type CheckOutPayload = {
  remarks?: string;
  early_checkout_reason?: string;
};

export interface MonthlySummary {
  month: string;
  year: number;
  total_days: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  on_leave: number;
  attendance_percentage: number;
}

export type AttendanceCorrection = {
  id: string;
  staff_id: string;
  staff_name?: string;
  store_code?: string;
  date: string;
  correction_type?: string;
  requested_check_in?: string | null;
  requested_check_out?: string | null;
  reason: string;
  proof_file_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  manager_remarks?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AttendanceCorrectionPayload = {
  date: string;
  correction_type?: string;
  requested_check_in?: string;
  requested_check_out?: string;
  reason: string;
  proof_file_url?: string | null;
};

export type AttendanceReviewPayload = {
  status: 'approved' | 'rejected';
  manager_remarks?: string;
};
