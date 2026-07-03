import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../services/authApi';
import {
  mapUserForDisplay,
  normalizeUser,
  syncChildInfoToStorage,
} from '../utils/mappers/userMapper';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      portal: null,
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      login: (userData, token, portal = null) => {
        const user = mapUserForDisplay(userData);
        set({ user, token, isAuthenticated: Boolean(token), portal });

        if (
          portal === 'parent' ||
          portal === 'school' ||
          portal === 'teacher' ||
          ['parent', 'school', 'teacher'].includes(user?.role)
        ) {
          syncChildInfoToStorage(user);
        }
      },

      loginFromAuthResponse: (authData, portal = null) => {
        const { user, accessToken } = authData;
        get().login(user, accessToken, portal || user?.role || null);
      },

      logout: async ({ callApi = true } = {}) => {
        if (callApi && get().token) {
          try {
            await authApi.logout();
          } catch {
            // Clear local session even if API logout fails
          }
        }

        try {
          const { unregisterFcmToken } = await import('../services/notificationApi');
          const registered = localStorage.getItem('fcm-registered-token');
          if (registered) {
            await unregisterFcmToken({ token: registered });
          }
          localStorage.removeItem('fcm-registered-token');
        } catch {
          // Best-effort FCM cleanup
        }

        set({ user: null, token: null, isAuthenticated: false, portal: null });
      },

      setUser: (userData) => {
        const user = mapUserForDisplay(userData);
        set({ user });

        const portal = get().portal;
        if (
          portal === 'parent' ||
          portal === 'school' ||
          portal === 'teacher' ||
          ['parent', 'school', 'teacher'].includes(user?.role)
        ) {
          syncChildInfoToStorage(user);
        }
      },

      setToken: (token) => set({ token, isAuthenticated: Boolean(token) }),

      refreshUser: async () => {
        const me = await authApi.getMe();
        const user = mapUserForDisplay(normalizeUser(me));
        set({ user });

        const portal = get().portal;
        if (
          portal === 'parent' ||
          portal === 'school' ||
          portal === 'teacher' ||
          ['parent', 'school', 'teacher'].includes(user?.role)
        ) {
          syncChildInfoToStorage(user);
        }

        return user;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        portal: state.portal,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

if (typeof window !== 'undefined') {
  useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.getState().setHasHydrated(true);
  });
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.getState().setHasHydrated(true);
  }
}

export default useAuthStore;
