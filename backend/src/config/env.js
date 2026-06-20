require('dotenv').config();

const parseDurationMs = (value, fallbackMs) => {
  if (!value) return fallbackMs;
  const match = /^(\d+)([smhd])$/.exec(String(value).trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit];
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school-emart',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  JWT_ACCESS_EXPIRY_MS: parseDurationMs(process.env.JWT_ACCESS_EXPIRY || '15m', 15 * 60_000),
  JWT_REFRESH_EXPIRY_MS: parseDurationMs(process.env.JWT_REFRESH_EXPIRY || '7d', 7 * 86_400_000),
  JWT_ISSUER: process.env.JWT_ISSUER || 'school-emart',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'school-emart-api',

  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 12,
  OTP_HMAC_SECRET: process.env.OTP_HMAC_SECRET || 'dev-otp-hmac-secret-change-me',

  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || 'strict',
  REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME || 'refreshToken',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  MAX_LOGIN_ATTEMPTS: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  LOGIN_LOCKOUT_MINUTES: Number(process.env.LOGIN_LOCKOUT_MINUTES) || 15,

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60_000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
};

const requiredInProduction = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'OTP_HMAC_SECRET',
  'MONGODB_URI',
];

if (env.NODE_ENV === 'production') {
  requiredInProduction.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
}

module.exports = env;
