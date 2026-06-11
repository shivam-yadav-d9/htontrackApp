export type UserRole = 'ADMIN' | 'STAFF' | 'MANAGER';

export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;

  employee_code?: string;
  mobile?: string | null;
  department?: string;
  designation?: string;

  location?: string;
  band?: string;
  workerType?: string;
  employmentStatus?: string;

  format?: string;
  subFormat?: string;

  functions?: string;
  subFunction?: string;

  employeeZone?: string;

  costCenterNo?: string;
  costCenterDescription?: string;

  store_code?: string;
  store_id?: string;
  store_name?: string;
  city?: string;
  state?: string;
  region?: string;
  region_id?: string;

  reporting_manager_id?: string;
  reporting_manager?: string;
  reporting_manager_email?: string;

  status?: UserStatus;
  is_active?: boolean;
  must_change_password?: boolean;

  profile_photo_url?: string;
  date_of_joining?: string;
  joining_date?: string;

  attendance_percentage?: number;
  target_percentage?: number;
  courses_completed?: number;
  courses_total?: number;
  assignments_pending?: number;
  certificates_count?: number;
  team_size?: number;

  created_at?: string;
  updated_at?: string;

  permissions?: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: 'bearer';
  user: User;
};

export type MeResponse = {
  user: User;
};

export type LogoutResponse = {
  status: string;
  message: string;
};

export interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  is_authenticated: boolean;
}

export interface OtpSendRequest {
  mobile: string;
  country_code: string;
}

export interface OtpVerifyRequest {
  mobile: string;
  country_code: string;
  otp: string;
}
