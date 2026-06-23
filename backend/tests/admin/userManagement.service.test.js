const userManagementService = require('../../src/modules/admin/services/userManagement.service');
const settingsService = require('../../src/modules/admin/services/settings.service');
const User = require('../../src/database/models/User');
const { generateUserRefId } = require('../../src/modules/school/utils/refId');
const { createAdminUser } = require('./helpers');

describe('admin user management service', () => {
  test('suspend and activate user updates status', async () => {
    const admin = await createAdminUser();
    const user = await User.create({
      refId: generateUserRefId('P'),
      role: 'parent',
      status: 'active',
      name: 'Lock Test',
      phone: `6${String(Date.now()).slice(-9)}`,
    });

    const suspended = await userManagementService.suspendUser(user._id, {
      userId: admin._id,
      role: 'admin',
    });
    expect(suspended.status).toBe('suspended');

    const activated = await userManagementService.activateUser(user._id, {
      userId: admin._id,
      role: 'admin',
    });
    expect(activated.status).toBe('active');
  });

  test('lock and unlock user', async () => {
    const admin = await createAdminUser();
    const user = await User.create({
      refId: generateUserRefId('P'),
      role: 'parent',
      status: 'active',
      name: 'Lock Test 2',
      phone: `6${String(Date.now()).slice(-9)}`,
    });

    const locked = await userManagementService.lockUser(user._id, {
      userId: admin._id,
      role: 'admin',
    });
    expect(locked.status).toBe('inactive');

    const unlocked = await userManagementService.unlockUser(user._id, {
      userId: admin._id,
      role: 'admin',
    });
    expect(unlocked.status).toBe('active');
  });
});

describe('admin settings service', () => {
  test('updates marketplace settings section', async () => {
    const admin = await createAdminUser();
    const section = await settingsService.updateSection(
      'marketplace',
      { commissionPercent: 12 },
      { userId: admin._id, role: 'admin' }
    );
    expect(section.commissionPercent).toBe(12);
  });
});
