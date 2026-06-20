const { randomUUID } = require('crypto');
const env = require('../../config/env');

const REQUEST_ID_HEADER = env.REQUEST_ID_HEADER.toLowerCase();
const CORRELATION_ID_HEADER = 'x-correlation-id';

const requestId = (req, res, next) => {
  const incomingRequestId = req.headers[REQUEST_ID_HEADER];
  const incomingCorrelationId = req.headers[CORRELATION_ID_HEADER];
  const id = incomingRequestId || incomingCorrelationId || randomUUID();

  req.requestId = id;
  req.correlationId = incomingCorrelationId || id;

  res.setHeader('X-Request-Id', id);
  res.setHeader('X-Correlation-Id', req.correlationId);

  next();
};

module.exports = requestId;
