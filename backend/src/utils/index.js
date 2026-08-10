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

const generateOtp = (length = 4) => {
  const max = 10 ** length;
  const num = require('crypto').randomInt(0, max);
  return String(num).padStart(length, '0');
};

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  const tenDigits = digits.length >= 10 ? digits.slice(-10) : digits;
  return tenDigits.length === 10 ? tenDigits : null;
};

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
  normalizePhone,
  normalizeEmail,
};
