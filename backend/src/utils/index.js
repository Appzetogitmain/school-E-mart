const bcrypt = require('bcrypt');
const env = require('../config/env');
const asyncHandler = require('./asyncHandler');
const ApiFeatures = require('./apiFeatures');
const date = require('./date');
const string = require('./string');
const crypto = require('./crypto');
const request = require('./request');

const hashPassword = async (plainText) => {
  const hash = await bcrypt.hash(plainText, env.BCRYPT_ROUNDS);
  return { hash, algo: 'bcrypt' };
};

const verifyPassword = async (plainText, passwordHash) => {
  if (!passwordHash) return false;
  return bcrypt.compare(plainText, passwordHash);
};

const hashToken = (token) => crypto.sha256(token);

const hashOtp = (otp, phone, purpose) =>
  crypto.hmacSha256(`${phone}:${purpose}:${otp}`, env.OTP_HMAC_SECRET);

const generateSecureToken = (bytes = 32) => crypto.randomHex(bytes);

const resolveMockOtp = (length = 4) => {
  const base = String(env.DEFAULT_OTP || '1234');
  if (base.length >= length) return base.slice(0, length);
  return base.padEnd(length, '0');
};

const isMockOtp = (otp, length = 4) => {
  if (!env.USE_MOCK_OTP) return false;
  const normalized = String(otp);
  if (normalized === env.DEFAULT_OTP) return true;
  return normalized === resolveMockOtp(length);
};

const generateOtp = (length = 4) => {
  if (env.USE_MOCK_OTP) {
    return resolveMockOtp(length);
  }
  const max = 10 ** length;
  const num = require('crypto').randomInt(0, max);
  return String(num).padStart(length, '0');
};

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

module.exports = {
  asyncHandler,
  ApiFeatures,
  date,
  string,
  crypto,
  request,
  hashPassword,
  verifyPassword,
  hashToken,
  hashOtp,
  generateSecureToken,
  generateOtp,
  resolveMockOtp,
  isMockOtp,
  normalizePhone,
  normalizeEmail,
};
