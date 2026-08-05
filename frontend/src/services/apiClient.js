import axios from 'axios';
import { ENV } from '../config/env';
import useAuthStore from '../store/useAuthStore';
import { refreshSession } from './authApi';
import { PORTAL_LOGIN_PATHS } from '../utils/mappers/userMapper';

const apiClient = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
  // Without a timeout, a hung backend/cold DB connection leaves the UI
  // spinning forever instead of surfacing a retryable error.
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRequestPath = (url = '') => url.split('?')[0];

/**
 * Unauthenticated auth flows where 401 means invalid credentials/OTP — not an expired session.
 * Refresh must never run for these paths.
 */
const isUnauthenticatedAuthPath = (url = '') => {
  const path = getRequestPath(url);

  if (path === '/auth/refresh' || path === '/auth/logout') {
    return true;
  }

  if (path.endsWith('/login') || path.endsWith('/register')) {
    return true;
  }

  if (
    path.startsWith('/auth/parent/otp/') ||
    path.startsWith('/auth/parent/web/') ||
    path === '/auth/parent/school-lookup' ||
    path === '/auth/forgot-password' ||
    path === '/auth/reset-password' ||
    path === '/auth/email/verify' ||
    path === '/vendor/register'
  ) {
    return true;
  }

  return false;
};

const shouldAttemptTokenRefresh = (url = '') => {
  if (isUnauthenticatedAuthPath(url)) {
    return false;
  }

  const { token, isAuthenticated } = useAuthStore.getState();
  return Boolean(token || isAuthenticated);
};

const redirectToLogin = () => {
  const { portal, logout } = useAuthStore.getState();
  logout({ callApi: false });

  const loginPath = PORTAL_LOGIN_PATHS[portal] || PORTAL_LOGIN_PATHS.default;
  if (window.location.pathname !== loginPath) {
    window.location.href = loginPath;
  }
};

let refreshPromise = null;

const tryRefreshToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then((data) => {
        useAuthStore.getState().setToken(data.accessToken);
        if (data.user) {
          useAuthStore.getState().setUser(data.user);
        }
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

apiClient.interceptors.request.use(
  (config) => {
    if (!isUnauthenticatedAuthPath(config.url || '')) {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      shouldAttemptTokenRefresh(originalRequest.url || '')
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await tryRefreshToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        redirectToLogin();
      }
    }

    // A flaky connection (dropped wifi, cold server) never reaches the
    // server at all — no error.response. Retry idempotent GETs exactly
    // once after a short delay instead of surfacing a hard failure for a
    // transient blip.
    if (
      !error.response &&
      originalRequest &&
      (originalRequest.method || 'get').toLowerCase() === 'get' &&
      !originalRequest._networkRetry &&
      ['ECONNABORTED', 'ERR_NETWORK'].includes(error.code)
    ) {
      originalRequest._networkRetry = true;
      await delay(800);
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
