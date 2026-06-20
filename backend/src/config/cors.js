const env = require('./env');

module.exports = Object.freeze({
  origin: env.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-Id',
    'X-Correlation-Id',
    'X-Client-App',
    'X-Client-Os',
    'X-Client-Model',
    'X-Tenant-School-Id',
  ],
  exposedHeaders: ['X-Request-Id', 'X-Correlation-Id'],
});
