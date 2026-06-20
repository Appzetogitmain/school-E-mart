const env = require('./env');

module.exports = {
  cors: {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  },
  helmet: {
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  },
  cookie: {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
  },
};
