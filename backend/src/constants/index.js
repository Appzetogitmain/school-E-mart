const httpStatus = require('./httpStatus');
const roles = require('./roles');
const permissions = require('./permissions');
const messages = require('./messages');
const responseCodes = require('./responseCodes');
const enums = require('./enums');

module.exports = Object.freeze({
  httpStatus,
  roles,
  permissions,
  messages,
  responseCodes,
  enums,
});
