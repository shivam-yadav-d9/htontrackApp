export type RequestStatus = 'pending' | 'approved' | 'rejected';

export type LeaveType =
  | 'casual_leave'
  | 'sick_leave'
  | 'emergency_leave'
  | 'half_day'
  | 'weekly_off'
  | 'other';

export type HalfDaySession = 'first_half' | 'second_half';

export type AttendanceCorrectionType =
  | 'missed_check_in'
  | 'missed_check_out'
  | 'wrong_check_in_time'
  | 'wrong_check_out_time'
  | 'late_check_in_reason'
  | 'early_checkout_reason';

export type LeaveRequest = {
  id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  half_day_session?: HalfDaySession | null;
  reason: string;
  attachment_name?: string | null;
  attachment_url?: string | null;
  staff_id: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  status: RequestStatus;
  manager_remarks?: string | null;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type LeaveRequestPayload = {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  half_day_session?: HalfDaySession | null;
  attachment_name?: string | null;
  attachment_url?: string | null;
};

export type ReviewPayload = {
  status: 'approved' | 'rejected';
  manager_remarks?: string;
};

export type AttendanceCorrection = {
  id: string;
  attendance_date: string;
  correction_type: AttendanceCorrectionType;
  requested_check_in_time?: string | null;
  requested_check_out_time?: string | null;
  current_check_in_time?: string | null;
  current_check_out_time?: string | null;
  attendance_id?: string | null;
  reason: string;
  proof_file_name?: string | null;
  proof_file_url?: string | null;
  staff_id: string;
  staff_name?: string;
  staff_email?: string;
  employee_code?: string;
  store_code?: string;
  store_id?: string;
  store_name?: string;
  status: RequestStatus;
  manager_remarks?: string | null;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AttendanceCorrectionPayload = {
  attendance_date: string;
  correction_type: AttendanceCorrectionType;
  requested_check_in_time?: string | null;
  requested_check_out_time?: string | null;
  reason: string;
  proof_file_name?: string | null;
  proof_file_url?: string | null;
};
