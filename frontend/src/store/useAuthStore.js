import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../services/authApi';
import { pickPortalToken, portalFromPathname } from '../utils/portalToken';
import {
  mapUserForDisplay,
  normalizeUser,
  syncChildInfoToStorage,
} from '../utils/mappers/userMapper';

const getCurrentPortal = () => {
  if (typeof window === 'undefined') return 'parent';
  return portalFromPathname(window.location.pathname);
};

const resolvePortalRole = (user, explicitPortal) => {
  if (explicitPortal) return explicitPortal;
  const role = String(user?.role || '').toLowerCase();
  if (role === 'admin' || role === 'super_admin') return 'admin';
  if (role === 'vendor') return 'vendor';
  if (role === 'school') return 'school';
  if (role === 'teacher') return 'teacher';
  return 'parent';
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      portal: null,
      portalSessions: {},
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      login: (userData, token, portal = null) => {
        const user = mapUserForDisplay(userData);
        const targetPortal = resolvePortalRole(user, portal);
        const portalSession = {
          user,
          token,
          isAuthenticated: Boolean(token),
          portal: targetPortal,
        };

        const nextPortalSessions = {
          ...(get().portalSessions || {}),
          [targetPortal]: portalSession,
        };

        set({
          user,
          token,
          isAuthenticated: Boolean(token),
          portal: targetPortal,
          portalSessions: nextPortalSessions,
        });

        if (
          targetPortal === 'parent' ||
          targetPortal === 'school' ||
          targetPortal === 'teacher' ||
          ['parent', 'school', 'teacher'].includes(user?.role)
        ) {
          syncChildInfoToStorage(user);
        }
      },

      loginFromAuthResponse: (authData, portal = null) => {
        const { user, accessToken } = authData;
        get().login(user, accessToken, portal || user?.role || null);
      },

      logout: async ({ callApi = true, portal = null } = {}) => {
        const targetPortal = portal || getCurrentPortal();
        const currentToken = get().portalSessions?.[targetPortal]?.token || get().token;

        if (callApi && currentToken) {
          try {
            await authApi.logout();
          } catch {
            // Clear local session even if API logout fails
          }
        }

        if (targetPortal === 'parent') {
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
        }

        const updatedSessions = { ...(get().portalSessions || {}) };
        delete updatedSessions[targetPortal];

        const remainingPortals = Object.keys(updatedSessions).filter((k) => updatedSessions[k]?.token);
        const fallbackPortal = remainingPortals[0];
        const fallbackSession = fallbackPortal ? updatedSessions[fallbackPortal] : null;

        set({
          portalSessions: updatedSessions,
          user: fallbackSession ? fallbackSession.user : null,
          token: fallbackSession ? fallbackSession.token : null,
          isAuthenticated: Boolean(fallbackSession?.token),
          portal: fallbackSession ? fallbackSession.portal : null,
        });
      },

      setUser: (userData) => {
        const user = mapUserForDisplay(userData);
        const targetPortal = resolvePortalRole(user, get().portal);
        const updatedSessions = { ...(get().portalSessions || {}) };
        if (updatedSessions[targetPortal]) {
          updatedSessions[targetPortal] = {
            ...updatedSessions[targetPortal],
            user,
          };
        }

        set({ user, portalSessions: updatedSessions });

        if (
          targetPortal === 'parent' ||
          targetPortal === 'school' ||
          targetPortal === 'teacher' ||
          ['parent', 'school', 'teacher'].includes(user?.role)
        ) {
          syncChildInfoToStorage(user);
        }
      },

      setToken: (token) => {
        const currentPortal = getCurrentPortal();
        const updatedSessions = { ...(get().portalSessions || {}) };
        if (updatedSessions[currentPortal]) {
          updatedSessions[currentPortal] = {
            ...updatedSessions[currentPortal],
            token,
            isAuthenticated: Boolean(token),
          };
        }
        set({ token, isAuthenticated: Boolean(token), portalSessions: updatedSessions });
      },

      // Strict: a page only ever gets its OWN portal's token (see utils/portalToken.js).
      // No session for this portal => null => request is unauthenticated => 401 => login page.
      getEffectiveToken: () => pickPortalToken(get(), getCurrentPortal()),

      getEffectiveUser: () => {
        const state = get();
        const currentPortal = getCurrentPortal();
        const session = state.portalSessions?.[currentPortal];
        if (session && session.user) return session.user;
        return state.user;
      },

      refreshUser: async () => {
        const me = await authApi.getMe();
        const user = mapUserForDisplay(normalizeUser(me));
        get().setUser(user);
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
        portalSessions: state.portalSessions,
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
