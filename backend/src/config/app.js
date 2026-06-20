const pkg = require('../../package.json');
const env = require('./env');

module.exports = Object.freeze({
  name: pkg.name,
  version: pkg.version,
  description: pkg.description || 'School E-Mart API',
  apiPrefix: env.API_PREFIX,
  apiVersion: env.API_VERSION,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
});
