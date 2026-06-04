import { create } from 'zustand';

import { storage } from '@/utils/storage';
import type { User } from '@/types/auth.types';

const TOKEN_KEY = 'karmyogi_access_token';
const REFRESH_KEY = 'karmyogi_refresh_token';
const USER_KEY = 'karmyogi_user';

interface AuthStore {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  is_authenticated: boolean;
  is_loading: boolean;

  login: (user: User, access_token: string, refresh_token: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  access_token: null,
  refresh_token: null,
  is_authenticated: false,
  is_loading: true,

  login: async (user, access_token, refresh_token) => {
    await storage.setItem(TOKEN_KEY, access_token);
    await storage.setItem(REFRESH_KEY, refresh_token);
    await storage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, access_token, refresh_token, is_authenticated: true });
  },

  logout: async () => {
    try {
      await storage.removeItem(TOKEN_KEY);
      await storage.removeItem(REFRESH_KEY);
      await storage.removeItem(USER_KEY);
    } finally {
      set({ user: null, access_token: null, refresh_token: null, is_authenticated: false });
    }
  },

  restoreSession: async () => {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      const refresh = await storage.getItem(REFRESH_KEY);
      const userStr = await storage.getItem(USER_KEY);
      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({ user, access_token: token, refresh_token: refresh, is_authenticated: true });
      }
    } catch {
      // session restore failed — stay logged out
    } finally {
      set({ is_loading: false });
    }
  },
}));
