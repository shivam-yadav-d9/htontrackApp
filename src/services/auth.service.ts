import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type { LoginRequest, LoginResponse, LogoutResponse, MeResponse } from '@/types/auth.types';

export type { LoginRequest, LoginResponse };

// ── Offline helpers ────────────────────────────────────────────────────────────

interface UserSeed {
  id: string;
  email: string;
  password: string;
  role: string;
  full_name: string;
  employee_code?: string;
  mobile?: string;
  store_id?: string;
  store_code?: string;
  store_name?: string;
  city?: string;
  state?: string;
  region?: string;
  region_id?: string;
  designation?: string;
  department?: string;
  date_of_joining?: string;
  status?: string;
  is_active?: boolean;
  attendance_percentage?: number;
  target_percentage?: number;
  courses_completed?: number;
  courses_total?: number;
  assignments_pending?: number;
  certificates_count?: number;
  team_size?: number;
}

async function offlineLogin(email: string, password: string): Promise<LoginResponse> {
  const users = await localDb.getCollection<UserSeed>('users');
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password');

  const token = `local-token-${user.id}`;
  const { password: _pw, ...safeUser } = user;
  return {
    access_token: token,
    refresh_token: token,
    token_type: 'bearer',
    user: { ...safeUser, role: user.role as 'ADMIN' | 'STAFF' | 'MANAGER' },
  };
}

// ── Public service ─────────────────────────────────────────────────────────────

export const authService = {
  loginWithEmail(payload: LoginRequest): Promise<LoginResponse> {
    if (APP_MODE === 'offline_apk') {
      return offlineLogin(payload.email, payload.password);
    }
    return api.post<LoginResponse>('/auth/login', payload);
  },

  getMe(): Promise<MeResponse> {
    if (APP_MODE === 'offline_apk') {
      return Promise.resolve({ user: { id: '', full_name: '', email: '', role: 'STAFF' } });
    }
    return api.get<MeResponse>('/auth/me');
  },

  logout(): Promise<LogoutResponse> {
    return Promise.resolve({ status: 'ok', message: 'Logged out' });
  },

  sendOtp(mobile: string, countryCode = '+91') {
    return Promise.resolve({ status: 'ok', message: 'OTP sent successfully', mobile, countryCode });
  },

  verifyOtp(mobile: string, otp: string, countryCode = '+91') {
    if (APP_MODE === 'offline_apk') {
      return Promise.reject(new Error('OTP login not available in offline mode. Use email/password.'));
    }
    return api.post<LoginResponse>('/auth/verify-otp', { mobile, otp, country_code: countryCode });
  },

  refresh(refreshToken: string) {
    if (APP_MODE === 'offline_apk') {
      return Promise.resolve({ access_token: refreshToken, refresh_token: refreshToken, token_type: 'bearer' as const, user: { id: '', full_name: '', email: '', role: 'STAFF' as const } });
    }
    return api.post<LoginResponse>('/auth/refresh', { refresh_token: refreshToken });
  },
};
