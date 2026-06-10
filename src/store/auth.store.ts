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

    console.log('TOKEN SAVED:', access_token);
    console.log('USER SAVED:', user);

    set({
      user,
      access_token,
      refresh_token,
      is_authenticated: true,
      is_loading: false,
    });
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
    console.log('RESTORE SESSION CALLED');

    try {
      const token = await storage.getItem(TOKEN_KEY);
      const refreshToken = await storage.getItem(REFRESH_KEY);
      const userString = await storage.getItem(USER_KEY);

      console.log('RESTORE TOKEN:', token);
      console.log('RESTORE REFRESH:', refreshToken);
      console.log('RESTORE USER:', userString);

      if (token && userString) {
        const user = JSON.parse(userString);

        set({
          user,
          access_token: token,
          refresh_token: refreshToken,
          is_authenticated: true,
          is_loading: false,
        });

        return;
      }

      set({
        user: null,
        access_token: null,
        refresh_token: null,
        is_authenticated: false,
        is_loading: false,
      });
    } catch (error) {
      console.log(error);
    }
  },

}));
