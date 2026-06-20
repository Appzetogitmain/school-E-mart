const env = require('./env');

module.exports = Object.freeze({
  cors: Object.freeze({
    origin: env.CORS_ORIGINS,
    credentials: true,
  }),
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
