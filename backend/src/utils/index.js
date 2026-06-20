const bcrypt = require('bcrypt');
const crypto = require('crypto');
const env = require('../config/env');

const hashPassword = async (plainText) => {
  const hash = await bcrypt.hash(plainText, env.BCRYPT_ROUNDS);
  return { hash, algo: 'bcrypt' };
};

const verifyPassword = async (plainText, passwordHash) => {
  if (!passwordHash) return false;
  return bcrypt.compare(plainText, passwordHash);
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const hashOtp = (otp, phone, purpose) =>
  crypto
    .createHmac('sha256', env.OTP_HMAC_SECRET)
    .update(`${phone}:${purpose}:${otp}`)
    .digest('hex');

const generateSecureToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const generateOtp = (length = 4) => {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(length, '0');
};

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

module.exports = {
  hashPassword,
  verifyPassword,
  hashToken,
  hashOtp,
  generateSecureToken,
  generateOtp,
  normalizePhone,
  normalizeEmail,
};
