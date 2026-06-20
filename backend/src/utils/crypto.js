const crypto = require('crypto');

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const hmacSha256 = (value, secret) =>
  crypto.createHmac('sha256', secret).update(String(value)).digest('hex');

const randomHex = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

module.exports = {
  sha256,
  hmacSha256,
  randomHex,
};
