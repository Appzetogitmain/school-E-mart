const logger = require('../../common/logger');
const { getRequestMeta } = require('../../utils/request');

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const meta = {
      ...getRequestMeta(req),
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP request completed', meta);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP request completed', meta);
    } else {
      logger.info('HTTP request completed', meta);
    }
  });

  next();
};

module.exports = requestLogger;
