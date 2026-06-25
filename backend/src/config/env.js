const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/school-emart';

const resolveMongoUri = () => process.env.MONGODB_URI || process.env.MONGO_URI || null;

const parseDurationMs = (value, fallbackMs) => {
  if (!value) return fallbackMs;
  const match = /^(\d+)([smhd])$/.exec(String(value).trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit];
};

const parseList = (value, fallback = []) => {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildEnv = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const mongoUri = resolveMongoUri() || (nodeEnv === 'production' ? null : LOCAL_MONGODB_URI);

  return {
  NODE_ENV: nodeEnv,
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: mongoUri,
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  API_VERSION: process.env.API_VERSION || 'v1',

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

  COOKIE_SECURE:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : (process.env.NODE_ENV || 'development') === 'production',
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || 'strict',
  REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME || 'refreshToken',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  CORS_ORIGINS: parseList(process.env.CORS_ORIGIN, ['http://localhost:5173']),

  MAX_LOGIN_ATTEMPTS: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  LOGIN_LOCKOUT_MINUTES: Number(process.env.LOGIN_LOCKOUT_MINUTES) || 15,

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60_000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,

  OTP_EXPIRY_MS: parseDurationMs(process.env.OTP_EXPIRY || '10m', 10 * 60_000),
  OTP_RESEND_COOLDOWN_MS: Number(process.env.OTP_RESEND_COOLDOWN_MS) || 60_000,
  OTP_MAX_PER_WINDOW: Number(process.env.OTP_MAX_PER_WINDOW) || 5,
  OTP_WINDOW_MS: Number(process.env.OTP_WINDOW_MS) || 15 * 60_000,

  PASSWORD_RESET_EXPIRY_MS: parseDurationMs(process.env.PASSWORD_RESET_EXPIRY || '24h', 24 * 3_600_000),
  EMAIL_VERIFICATION_EXPIRY: process.env.EMAIL_VERIFICATION_EXPIRY || '24h',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || null,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || null,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || null,

  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  LOG_DIR: process.env.LOG_DIR || 'logs',
  REQUEST_ID_HEADER: process.env.REQUEST_ID_HEADER || 'x-request-id',

  SHUTDOWN_TIMEOUT_MS: Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10_000,

  REDIS_URL: process.env.REDIS_URL || null,
  REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX || 'school-emart:',
  REDIS_CONNECT_TIMEOUT_MS: Number(process.env.REDIS_CONNECT_TIMEOUT_MS) || 10_000,
  REDIS_STARTUP_MAX_ATTEMPTS: Number(process.env.REDIS_STARTUP_MAX_ATTEMPTS) || 5,
  REDIS_STARTUP_RETRY_DELAY_MS: Number(process.env.REDIS_STARTUP_RETRY_DELAY_MS) || 2000,

  DELIVERY_PROVIDER: process.env.DELIVERY_PROVIDER || 'shiprocket',
  SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL || '',
  SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD || '',
  SHIPROCKET_WEBHOOK_SECRET: process.env.SHIPROCKET_WEBHOOK_SECRET || '',
  SHIPROCKET_BASE_URL: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
  SHIPROCKET_RPM_LIMIT: Number(process.env.SHIPROCKET_RPM_LIMIT) || 500,
  SHIPROCKET_TOKEN_REFRESH_MS: Number(process.env.SHIPROCKET_TOKEN_REFRESH_MS) || 23 * 60 * 60 * 1000,

  OUTBOX_WORKER_ENABLED: process.env.OUTBOX_WORKER_ENABLED === 'true',
  OUTBOX_POLL_INTERVAL_MS: Number(process.env.OUTBOX_POLL_INTERVAL_MS) || 5000,
  OUTBOX_BATCH_SIZE: Number(process.env.OUTBOX_BATCH_SIZE) || 20,
  };
};

const validateEnv = (config) => {
  const requiredInProduction = ['JWT_ACCESS_SECRET', 'OTP_HMAC_SECRET'];

  if (config.NODE_ENV === 'production') {
    if (!resolveMongoUri()) {
      throw new Error('Missing required environment variable: MONGODB_URI or MONGO_URI');
    }

    if (!config.MONGODB_URI) {
      throw new Error('MongoDB URI must be configured in production');
    }

    requiredInProduction.forEach((key) => {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    });

    const secretKeys = ['JWT_ACCESS_SECRET', 'OTP_HMAC_SECRET'];
    const minSecretLength = 32;

    secretKeys.forEach((key) => {
      if (config[key].startsWith('dev-')) {
        throw new Error(`${key} must not use development defaults in production`);
      }
      if (config[key].length < minSecretLength) {
        throw new Error(`${key} must be at least ${minSecretLength} characters in production`);
      }
    });
  }
};

const env = Object.freeze(buildEnv());
validateEnv(env);

module.exports = env;
