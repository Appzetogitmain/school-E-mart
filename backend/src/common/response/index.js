const { httpStatus } = require('../../constants');

const success = (res, data = null, message = 'Success', statusCode = httpStatus.OK) => {
  const payload = { success: true, message };
  if (data !== null && data !== undefined) {
    payload.data = data;
  }
  return res.status(statusCode).json(payload);
};

const created = (res, data = null, message = 'Created') =>
  success(res, data, message, httpStatus.CREATED);

const noContent = (res) => res.status(httpStatus.NO_CONTENT).send();

const fail = (res, message, statusCode = httpStatus.BAD_REQUEST, code = null, errors = null) => {
  const payload = { success: false, message };
  if (code) payload.code = code;
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = {
  success,
  created,
  noContent,
  fail,
};
