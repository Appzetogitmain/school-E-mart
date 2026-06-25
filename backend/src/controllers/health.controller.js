const { success } = require('../common/response');
const { getDatabaseStatus } = require('../database/connection');
const { env, app: appConfig } = require('../config');
const { httpStatus } = require('../constants');
const { HEALTH_STATUS } = require('../constants/enums');
const asyncHandler = require('../utils/asyncHandler');
const ShiprocketTokenStore = require('../database/models/ShiprocketTokenStore');
const { shiprocketClient } = require('../modules/delivery/providers/shiprocket/shiprocketClient');

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

const getDeliveryHealth = async () => {
  const token = await ShiprocketTokenStore.findOne().lean();
  const tokenValid = Boolean(token && new Date(token.expiresAt) > new Date());
  try {
    await shiprocketClient.ping();
    return { shiprocket: { reachable: true }, token: { valid: tokenValid } };
  } catch (error) {
    return { shiprocket: { reachable: false, message: error.message }, token: { valid: tokenValid } };
  }
};

const getHealth = asyncHandler(async (req, res) => {
  const data = getHealthPayload();
  data.delivery = await getDeliveryHealth();
  return success(res, data, 'Server is healthy', httpStatus.OK, req);
});

module.exports = {
  getHealth,
  getHealthPayload,
};
