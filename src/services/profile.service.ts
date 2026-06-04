import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import { storage } from '@/utils/storage';

export interface Profile {
  id: string;
  employee_code: string;
  full_name: string;
  mobile: string;
  email: string | null;
  role: string;
  designation: string | null;
  department: string | null;
  store_id: string | null;
  region_id: string | null;
  profile_photo_url: string | null;
  date_of_joining: string | null;
  alternate_mobile: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_mobile: string | null;
  date_of_birth: string | null;
  preferred_language: string | null;
  bio: string | null;
  status: string;
  created_at: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  email?: string;
  alternate_mobile?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_mobile?: string;
  date_of_birth?: string;
  preferred_language?: string;
  bio?: string;
}

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const profileService = {
  async getProfile(): Promise<Profile> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const users = await localDb.getCollection<Profile & { id: string; password?: string }>('users');
      const user = users.find((u) => u.id === uid);
      if (!user) throw new Error('User not found');
      return { ...user, created_at: user.created_at ?? new Date().toISOString() };
    }
    // Use new employee profile API — map the profile sub-object to Profile shape
    const data = await api.get<{ profile: Profile; user: Profile }>('/staff/profile/my');
    const p = data.profile ?? data.user;
    return { ...p, created_at: p.created_at ?? new Date().toISOString() };
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<Profile> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const updated = await localDb.updateItem<Profile>('users', uid, payload as Partial<Profile>);
      return updated!;
    }
    // Only personal fields are accepted by the new API; employment fields are ignored server-side
    const allowed = ['alternate_mobile', 'address', 'emergency_contact_name',
      'emergency_contact_mobile', 'preferred_language', 'bio', 'profile_photo_url'];
    const clean = Object.fromEntries(
      Object.entries(payload).filter(([k]) => allowed.includes(k))
    );
    return api.put<Profile>('/staff/profile/my', clean);
  },

  async uploadPhoto(_uri: string): Promise<{ profile_photo_url: string }> {
    if (APP_MODE === 'offline_apk') {
      return { profile_photo_url: '' };
    }
    const uri = _uri;
    const formData = new FormData();
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('file', { uri, name: filename, type } as unknown as Blob);
    return api.upload<{ profile_photo_url: string }>('/users/profile/photo', formData);
  },
};
