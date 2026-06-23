const env = require('../../../config/env');
const { hmacSha256 } = require('../../../utils/crypto');

const encryptAccountNumber = (accountNumber) =>
  hmacSha256(String(accountNumber), env.JWT_ACCESS_SECRET || 'bank-enc-key');

const maskAccountNumber = (accountNumber) => {
  const digits = String(accountNumber || '').replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `****${digits.slice(-4)}`;
};

module.exports = {
  encryptAccountNumber,
  maskAccountNumber,
};
