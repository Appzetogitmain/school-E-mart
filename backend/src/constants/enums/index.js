const ENVIRONMENT = Object.freeze({
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
});

const DATABASE_STATE = Object.freeze({
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
});

const HEALTH_STATUS = Object.freeze({
  OK: 'ok',
  DEGRADED: 'degraded',
  DOWN: 'down',
});

module.exports = {
  ENVIRONMENT,
  DATABASE_STATE,
  HEALTH_STATUS,
};
