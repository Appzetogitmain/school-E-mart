import { ENV } from '../config/env';

// Uploaded files are stored on the backend's local disk and referenced by
// server-relative paths like `/uploads/<file>` (see backend/src/utils/fileStorage.js).
// In dev, VITE_API_URL is just "/api/v1" and Vite proxies /uploads to the API host, so a
// relative path happens to resolve. In production the frontend and backend are on
// different origins (see frontend/.env.example), so a bare relative path 404s for
// every viewer except on the machine that happens to proxy it — this resolves it
// against the API's origin instead.
export const toAbsoluteUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  // Raw 24-hex ObjectIds (e.g. '6a5f0b42edf09acd3f6b4e91') are database IDs, not file URLs
  if (/^[a-fA-F0-9]{24}$/.test(trimmed)) return '';
  const origin = ENV.API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  return `${origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};
