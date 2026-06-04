import { api } from "./api";

export type EmployeeProfile = {
  id: string;
  staff_id: string;
  employee_code: string;
  full_name: string;
  email: string | null;
  mobile: string | null;
  department: string | null;
  designation: string | null;
  role_key: string | null;
  job_status: string;
  employment_type: string;
  store_id: string | null;
  store_code: string | null;
  site_code: string | null;
  store_name: string | null;
  city: string | null;
  state: string | null;
  zone: string | null;
  manager_id: string | null;
  manager_name: string | null;
  manager_email: string | null;
  profile_photo_url: string | null;
  alternate_mobile: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_mobile: string | null;
  preferred_language: string | null;
  bio: string | null;
  skill_level: string;
  risk_status: string;
  profile_completion_percentage: number;
  created_at: string;
  updated_at: string;
};

export type ProfileSummary = {
  monthly_target_count: number;
  daily_target_count: number;
  weekly_off_count: number;
  attendance_session_count: number;
  course_attempt_count: number;
  award_count: number;
  certificate_count: number;
  incentive_record_count: number;
};

export type EmployeeProfileResponse = {
  user: Record<string, unknown>;
  profile: EmployeeProfile;
  summary: ProfileSummary;
  monthly_targets: unknown[];
  weekly_offs: unknown[];
  recent_attendance: unknown[];
  course_results: unknown[];
  awards: unknown[];
  certificates: unknown[];
  incentives: unknown[];
};

export type StaffProfileUpdatePayload = {
  profile_photo_url?: string | null;
  alternate_mobile?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_mobile?: string | null;
  preferred_language?: string | null;
  bio?: string | null;
};

export const employeeProfileService = {
  getMyProfile() {
    return api.get<EmployeeProfileResponse>("/staff/profile/my");
  },

  updateMyProfile(payload: StaffProfileUpdatePayload) {
    return api.put<EmployeeProfile>("/staff/profile/my", payload);
  },

  getManagerStaffProfile(staffId: string) {
    return api.get<EmployeeProfileResponse>(`/manager/team/${staffId}/profile`);
  },

  getAdminEmployeeProfile(staffId: string) {
    return api.get<EmployeeProfileResponse>(`/admin/employees/${staffId}/profile`);
  },

  updateAdminEmployeeProfile(staffId: string, payload: Record<string, unknown>) {
    return api.put<EmployeeProfile>(`/admin/employees/${staffId}/profile`, payload);
  },
};
