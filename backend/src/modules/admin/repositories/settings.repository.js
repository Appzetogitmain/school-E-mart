const mongoose = require('mongoose');
const PlatformSettings = require('../../../database/models/PlatformSettings');
const BillingConfig = require('../../../database/models/BillingConfig');

const SETTINGS_ID = 'default';
const SETTINGS_AUDIT_ENTITY_ID = new mongoose.Types.ObjectId('000000000000000000000001');

const settingsRepository = {
  async getPlatformSettings() {
    let settings = await PlatformSettings.findById(SETTINGS_ID).lean();
    if (!settings) {
      settings = await PlatformSettings.create({ _id: SETTINGS_ID });
      return settings.toObject();
    }
    return settings;
  },

  async updatePlatformSettings(section, payload, updatedBy) {
    const updateKey = section;
    return PlatformSettings.findByIdAndUpdate(
      SETTINGS_ID,
      {
        $set: {
          [updateKey]: payload,
          updatedBy,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true, runValidators: true }
    ).lean();
  },

  async getBillingConfig() {
    let config = await BillingConfig.findById(SETTINGS_ID).lean();
    if (!config) {
      config = await BillingConfig.create({
        _id: SETTINGS_ID,
        platformFeePaise: 1000,
        freeDeliveryThresholdPaise: 50000,
        fixedDeliveryChargePaise: 4900,
        schoolDeliveryFreeDays: 7,
        schoolDeliveryChargePaise: 4900,
        updatedBy: SETTINGS_AUDIT_ENTITY_ID,
      });
      return config.toObject();
    }
    return config;
  },

  async updateBillingConfig(payload, updatedBy) {
    return BillingConfig.findByIdAndUpdate(
      SETTINGS_ID,
      { $set: { ...payload, updatedBy, updatedAt: new Date() } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
  },
};

module.exports = settingsRepository;
module.exports.SETTINGS_AUDIT_ENTITY_ID = SETTINGS_AUDIT_ENTITY_ID;
