const { success } = require('../common/response');
const { getDatabaseStatus } = require('../database/connection');
const { env, app: appConfig } = require('../config');
const { HEALTH_STATUS } = require('../constants/enums');
const asyncHandler = require('../utils/asyncHandler');

const startTime = Date.now();

const getHealthPayload = () => {
  const database = getDatabaseStatus();

  return {
    status: database.connected ? HEALTH_STATUS.OK : HEALTH_STATUS.DEGRADED,
    environment: env.NODE_ENV,
    uptime: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
    version: appConfig.version,
    database,
    process: {
      pid: process.pid,
      memory: process.memoryUsage(),
      startedAt: new Date(startTime).toISOString(),
    },
  };
};

const getHealth = asyncHandler(async (req, res) => {
  const data = getHealthPayload();
  return success(res, data, 'Server is healthy', 200, req);
});

module.exports = {
  getHealth,
  getHealthPayload,
};
