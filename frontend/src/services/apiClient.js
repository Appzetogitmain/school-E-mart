import axios from 'axios';
import { ENV } from '../config/env';
import useAuthStore from '../store/useAuthStore';
import { refreshSession } from './authApi';
import { PORTAL_LOGIN_PATHS } from '../utils/mappers/userMapper';

const apiClient = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const AUTH_SKIP_REFRESH = ['/auth/refresh', '/auth/login', '/auth/logout'];

const shouldSkipRefresh = (url = '') =>
  AUTH_SKIP_REFRESH.some((segment) => url.includes(segment));

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
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      !shouldSkipRefresh(originalRequest.url || '')
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

    return Promise.reject(error);
  }
);

export default apiClient;
