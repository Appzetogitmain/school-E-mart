const logger = require('../common/logger');

const emitToCustomer = async (customerId, message) => {
  logger.info('Socket emit customer', { customerId, event: message?.event });
};

const emitToSeller = async (sellerId, message) => {
  logger.info('Socket emit seller', { sellerId, event: message?.event });
};

module.exports = {
  emitToCustomer,
  emitToSeller,
};
