const config = require('../../config');

const isDeliveryModuleEnabled = () => String(config.env.DELIVERY_PROVIDER || '').toLowerCase() === 'shiprocket';

module.exports = {
  isDeliveryModuleEnabled,
};
