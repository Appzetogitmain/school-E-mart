const { BadRequestError } = require('../../../common/errors');
const settingsRepository = require('../repositories/settings.repository');
const { SETTINGS_AUDIT_ENTITY_ID } = require('../repositories/settings.repository');
const auditRepository = require('../../auth/repositories/audit.repository');
const { runAtomic } = require('../../orders/utils/atomic');

const VALID_SECTIONS = ['general', 'marketplace', 'orders', 'school', 'security', 'billing', 'contact', 'lms'];

const DEFAULT_CONTACT_SETTINGS = {
  phone: '+91 98765 43210',
  email: 'support@schoolemart.com',
  address: '123 Education Hub, Sector 62, Noida, Uttar Pradesh 201301',
  workingHours: 'Mon - Sat: 9:00 AM - 7:00 PM',
  whatsapp: '+91 98765 43210',
  bulkPhone: '+91 99999 88888',
  bulkEmail: 'schools@schoolemart.com',
};

const DEFAULT_LMS_SETTINGS = {
  maxVideoSizeMB: 500,
};

const settingsService = {
  async getAllSettings() {
    const [platform, billing] = await Promise.all([
      settingsRepository.getPlatformSettings(),
      settingsRepository.getBillingConfig(),
    ]);
    return { platform, billing };
  },

  async getSection(section) {
    if (!VALID_SECTIONS.includes(section)) {
      throw new BadRequestError('Invalid settings section', null, 'INVALID_SETTINGS_SECTION');
    }
    if (section === 'billing') {
      return settingsRepository.getBillingConfig();
    }
    const settings = await settingsRepository.getPlatformSettings();
    if (section === 'contact') {
      return { ...DEFAULT_CONTACT_SETTINGS, ...(settings.contact || {}) };
    }
    if (section === 'lms') {
      return { ...DEFAULT_LMS_SETTINGS, ...(settings.lms || {}) };
    }
    return settings[section] || {};
  },

  async updateSection(section, payload, actor = {}) {
    if (!VALID_SECTIONS.includes(section)) {
      throw new BadRequestError('Invalid settings section', null, 'INVALID_SETTINGS_SECTION');
    }

    return runAtomic(async (session) => {
      let updated;
      if (section === 'billing') {
        updated = await settingsRepository.updateBillingConfig(payload, actor.userId);
      } else {
        updated = await settingsRepository.updatePlatformSettings(section, payload, actor.userId);
      }

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'settings.updated',
        entityType: 'PlatformSettings',
        entityId: SETTINGS_AUDIT_ENTITY_ID,
        after: { section, payload },
      });

      return section === 'billing' ? updated : updated[section];
    });
  },
};

module.exports = settingsService;
