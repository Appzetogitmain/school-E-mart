const { mapShiprocketStatus } = require('../../src/modules/delivery/providers/shiprocket/shiprocketStatusMap');

describe('shiprocketStatusMap', () => {
  it('maps known statuses', () => {
    expect(mapShiprocketStatus('DELIVERED')).toBe('delivered');
    expect(mapShiprocketStatus('OUT FOR DELIVERY')).toBe('out_for_delivery');
  });

  it('returns null for unknown', () => {
    expect(mapShiprocketStatus('SOMETHING_NEW')).toBeNull();
  });
});
