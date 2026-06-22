const jwt = require('jsonwebtoken');
const jwtConfig = require('../../config/jwt');

const signAccessToken = (payload) =>
  jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiry,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    algorithm: 'HS256',
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, jwtConfig.accessSecret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    algorithms: ['HS256'],
  });

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
