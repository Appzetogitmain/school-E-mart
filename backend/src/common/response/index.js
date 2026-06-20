const { httpStatus } = require('../../constants');

const buildMeta = (req, extra = {}) => {
  if (!req) return extra;
  return {
    requestId: req.requestId || req.correlationId || null,
    ...extra,
  };
};

const success = (res, data = null, message = 'Success', statusCode = httpStatus.OK, req = null) => {
  const payload = {
    success: true,
    message,
    meta: buildMeta(req),
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

const created = (res, data = null, message = 'Created', req = null) =>
  success(res, data, message, httpStatus.CREATED, req);

const paginated = (res, data, pagination, message = 'Success', req = null) =>
  res.status(httpStatus.OK).json({
    success: true,
    message,
    data,
    pagination,
    meta: buildMeta(req),
  });

const noContent = (res) => res.status(httpStatus.NO_CONTENT).send();

const fail = (
  res,
  message,
  statusCode = httpStatus.BAD_REQUEST,
  code = null,
  errors = null,
  req = null
) => {
  const payload = {
    success: false,
    message,
    meta: buildMeta(req),
  };

  if (code) payload.code = code;
  if (errors) payload.errors = errors;

  return res.status(statusCode).json(payload);
};

module.exports = {
  success,
  created,
  paginated,
  noContent,
  fail,
  buildMeta,
};
