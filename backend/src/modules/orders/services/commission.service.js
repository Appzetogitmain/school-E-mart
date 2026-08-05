const PlatformSettings = require('../../../database/models/PlatformSettings');
const School = require('../../../database/models/School');
const ParentProfile = require('../../../database/models/ParentProfile');
const ChildProfile = require('../../../database/models/ChildProfile');

const notDeleted = { 'softDelete.isDeleted': { $ne: true } };
const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/**
 * Computes the per-line commission split that is snapshotted onto every order
 * item at checkout. The settlement service later pays out from this snapshot, so
 * a later rate change never re-prices an existing order.
 *
 * Split rules (vendor always gets the remainder):
 *  - Kit (user orders it)            → platform kit % + the kit-school's kit %
 *  - Retail product, linked user     → platform retail % + the buyer-school's retail %
 *  - Retail product, unlinked user   → platform retail % only
 *  - Bulk product (a school buys)    → platform retail % only (school is the buyer)
 */
const commissionService = {
  async getPlatformRates() {
    const settings = await PlatformSettings.findById('default').lean();
    const mk = settings?.marketplace || {};
    return {
      // Fall back to the legacy single rate, then the schema default.
      retailPercent: num(mk.platformRetailPercent, num(mk.commissionPercent, 10)),
      kitPercent: num(mk.platformKitPercent, 5),
    };
  },

  // The school a buyer is linked to (their active child's school), or null when
  // the shopper is an unlinked/guest customer.
  async getBuyerLinkedSchoolId(userId) {
    const [parentProfile, children] = await Promise.all([
      ParentProfile.findOne({ userId, ...notDeleted }).lean(),
      ChildProfile.find({ parentUserId: userId, ...notDeleted }).select('schoolId').lean(),
    ]);
    if (!children.length) return null;
    const active =
      children.find(
        (c) => parentProfile?.activeChildId && String(c._id) === String(parentProfile.activeChildId)
      ) || children[0];
    const sid = active?.schoolId;
    return sid ? String(sid) : null;
  },

  // admin% + school% can never exceed 100 (the vendor's share can't go negative).
  clampSplit(adminPercent, schoolPercent) {
    const admin = Math.max(0, num(adminPercent));
    let school = Math.max(0, num(schoolPercent));
    if (admin + school > 100) school = Math.max(0, 100 - admin);
    return { adminPercent: admin, schoolPercent: school };
  },

  /**
   * Resolve a commission snapshot for each line item.
   * @param items line items — each may carry productAudience, kitId, kitSchoolId
   * @param ctx   { userId, audience } where audience is the order channel
   *              ('school' = a school is buying, else a user is buying)
   * @returns array aligned to items of { adminPercent, schoolPercent, schoolId }
   */
  async resolveItemsCommission(items, { userId, audience } = {}) {
    const platform = await this.getPlatformRates();

    // A school buying in bulk earns nothing (it is the buyer), so only look up the
    // buyer's linked school for user-channel orders.
    const buyerSchoolId = audience === 'school' ? null : await this.getBuyerLinkedSchoolId(userId);

    const schoolIds = new Set();
    if (buyerSchoolId) schoolIds.add(buyerSchoolId);
    for (const it of items) {
      const kSchoolId = it.kitSchoolId || it.schoolId;
      if (it.kitId && kSchoolId) schoolIds.add(String(kSchoolId));
    }

    const schools = schoolIds.size
      ? await School.find({ _id: { $in: [...schoolIds] }, ...notDeleted }).select('commission').lean()
      : [];
    const schoolById = new Map(schools.map((s) => [String(s._id), s]));

    return items.map((it) => {
      // Kit: platform kit % + the authoring school's kit %.
      if (it.kitId) {
        const kSchoolId = it.kitSchoolId || it.schoolId;
        const school = kSchoolId ? schoolById.get(String(kSchoolId)) : null;
        const { adminPercent, schoolPercent } = this.clampSplit(
          platform.kitPercent,
          num(school?.commission?.kitPercent, 0)
        );
        return { adminPercent, schoolPercent, schoolId: school ? String(kSchoolId) : null };
      }

      // Bulk: a school is buying, or the product is tagged for schools → platform only.
      if (audience === 'school' || it.productAudience === 'schools') {
        return { adminPercent: platform.retailPercent, schoolPercent: 0, schoolId: null };
      }

      // Retail: platform retail % + the buyer's linked school retail % (0 if unlinked).
      const school = buyerSchoolId ? schoolById.get(buyerSchoolId) : null;
      const { adminPercent, schoolPercent } = this.clampSplit(
        platform.retailPercent,
        school ? num(school.commission?.retailPercent, 0) : 0
      );
      return { adminPercent, schoolPercent, schoolId: school ? buyerSchoolId : null };
    });
  },
};

module.exports = commissionService;
