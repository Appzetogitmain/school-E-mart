const env = require('../../../config/env');
const { hmacSha256 } = require('../../../utils/crypto');

const encryptAccountNumber = (accountNumber) => String(accountNumber || '').trim();

const maskAccountNumber = (accountNumber) => {
  const digits = String(accountNumber || '').replace(/\D/g, '');
  return digits || String(accountNumber || '').trim();
};

module.exports = {
  encryptAccountNumber,
  maskAccountNumber,
};
