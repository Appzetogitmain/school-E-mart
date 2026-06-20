const { validate } = require('../../common/validation');

const validateBody = (schema) => validate(schema, 'body');
const validateParams = (schema) => validate(schema, 'params');
const validateQuery = (schema) => validate(schema, 'query');
const validateHeaders = (schema) => validate(schema, 'headers');

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
  validateHeaders,
};
