const dashboardService = require('../../src/modules/admin/services/dashboard.service');
const User = require('../../src/database/models/User');
const { generateUserRefId } = require('../../src/modules/school/utils/refId');

describe('admin dashboard service', () => {
  test('getOverview returns platform totals', async () => {
    await User.create({
      refId: generateUserRefId('P'),
      role: 'parent',
      status: 'active',
      name: 'Parent User',
      phone: `9${String(Date.now()).slice(-9)}`,
    });

    const overview = await dashboardService.getOverview();
    expect(overview.totals.users).toBeGreaterThanOrEqual(1);
    expect(overview.totals.parents).toBeGreaterThanOrEqual(1);
    expect(overview).toHaveProperty('pendingApprovals');
  });

  test('getSystemHealth reports database status', async () => {
    const health = await dashboardService.getSystemHealth();
    expect(health.database.healthy).toBe(true);
    expect(health.api.status).toBe('operational');
  });
});
