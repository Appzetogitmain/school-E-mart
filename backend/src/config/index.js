const env = require('./env');
const app = require('./app');
const database = require('./database');
const jwt = require('./jwt');
const auth = require('./auth');
const logger = require('./logger');
const cors = require('./cors');
const security = require('./security');
const rateLimit = require('./rateLimit');

module.exports = Object.freeze({
  env,
  app,
  database,
  jwt,
  auth,
  logger: logger,
  cors,
  security,
  rateLimit,
});
