const path = require('path');
const env = require('./env');

module.exports = Object.freeze({
  level: env.LOG_LEVEL,
  dir: path.resolve(process.cwd(), env.LOG_DIR),
  serviceName: 'school-emart-api',
  requestIdHeader: env.REQUEST_ID_HEADER,
  rotation: Object.freeze({
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    maxSize: '20m',
    errorMaxFiles: '30d',
  }),
  isProduction: env.NODE_ENV === 'production',
});
