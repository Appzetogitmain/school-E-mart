const env = require('./env');

module.exports = Object.freeze({
  helmet: Object.freeze({
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  }),
  cookie: Object.freeze({
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
  }),
  compression: Object.freeze({
    threshold: 1024,
  }),
});
