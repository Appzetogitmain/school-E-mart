const mongoose = require('mongoose');
const kitsService = require('../../src/modules/academics/services/kits.service');
const Kit = require('../../src/database/models/Kit');

const baseItems = [{ name: 'Notebook', category: 'Stationary', qty: 5 }];

describe('kitsService', () => {
  let schoolId;
  let vendorId;

  beforeEach(() => {
    schoolId = new mongoose.Types.ObjectId();
    vendorId = new mongoose.Types.ObjectId();
  });

  describe('vendor-required-before-going-live', () => {
    test('createKit rejects an active kit with no vendor', async () => {
      await expect(
        kitsService.createKit(schoolId, { name: 'No Vendor Kit', items: baseItems, status: 'active' })
      ).rejects.toMatchObject({ code: 'KIT_VENDOR_REQUIRED' });
    });

    test('createKit allows a draft kit with no vendor', async () => {
      const kit = await kitsService.createKit(schoolId, {
        name: 'Draft Kit', items: baseItems, status: 'draft',
      });
      expect(kit.status).toBe('draft');
      expect(kit.vendorId).toBeNull();
    });

    test('createKit allows an active kit once a vendor is assigned', async () => {
      const kit = await kitsService.createKit(schoolId, {
        name: 'Vendored Kit', items: baseItems, status: 'active', vendorId,
      });
      expect(kit.status).toBe('active');
      expect(String(kit.vendorId)).toBe(String(vendorId));
    });

    test('updateKit rejects removing the vendor from a kit that stays active', async () => {
      const kit = await kitsService.createKit(schoolId, {
        name: 'Vendored Kit', items: baseItems, status: 'active', vendorId,
      });

      // Not touching status at all — the kit is already active, so this must still
      // be checked, not just an explicit status:'active' in the payload.
      await expect(
        kitsService.updateKit(schoolId, kit._id, { vendorId: null })
      ).rejects.toMatchObject({ code: 'KIT_VENDOR_REQUIRED' });
    });

    test('updateKit rejects publishing a draft that has no vendor', async () => {
      const kit = await kitsService.createKit(schoolId, {
        name: 'Draft Kit', items: baseItems, status: 'draft',
      });

      await expect(
        kitsService.updateKit(schoolId, kit._id, { status: 'active' })
      ).rejects.toMatchObject({ code: 'KIT_VENDOR_REQUIRED' });
    });

    test('updateKit allows publishing a draft when a vendor is supplied in the same update', async () => {
      const kit = await kitsService.createKit(schoolId, {
        name: 'Draft Kit', items: baseItems, status: 'draft',
      });

      const updated = await kitsService.updateKit(schoolId, kit._id, { status: 'active', vendorId });
      expect(updated.status).toBe('active');
      expect(String(updated.vendorId)).toBe(String(vendorId));
    });

    test('updateKit leaves an already-vendored active kit alone when neither field changes', async () => {
      const kit = await kitsService.createKit(schoolId, {
        name: 'Vendored Kit', items: baseItems, status: 'active', vendorId,
      });

      const updated = await kitsService.updateKit(schoolId, kit._id, { description: 'Updated blurb' });
      expect(updated.status).toBe('active');
      expect(String(updated.vendorId)).toBe(String(vendorId));
      expect(updated.description).toBe('Updated blurb');
    });
  });

  describe('draft/deleted kit visibility', () => {
    let draftKit;
    let activeKit;

    beforeEach(async () => {
      draftKit = await kitsService.createKit(schoolId, {
        name: 'Draft Kit', items: baseItems, status: 'draft',
      });
      activeKit = await kitsService.createKit(schoolId, {
        name: 'Active Kit', items: baseItems, status: 'active', vendorId,
      });
    });

    test('getKit with requireActive hides a draft kit', async () => {
      await expect(
        kitsService.getKit(schoolId, draftKit._id, { requireActive: true })
      ).rejects.toMatchObject({ code: 'KIT_NOT_FOUND' });
    });

    test('getKit with requireActive still returns an active kit', async () => {
      const kit = await kitsService.getKit(schoolId, activeKit._id, { requireActive: true });
      expect(String(kit._id)).toBe(String(activeKit._id));
    });

    test('getKit without requireActive (management view) returns the draft', async () => {
      const kit = await kitsService.getKit(schoolId, draftKit._id);
      expect(kit.status).toBe('draft');
    });

    test('listKits with requireActive excludes drafts even if the caller asks for them', async () => {
      const { data } = await kitsService.listKits(schoolId, { status: 'draft' }, { requireActive: true });
      expect(data.map((k) => String(k._id))).not.toContain(String(draftKit._id));
      expect(data.map((k) => String(k._id))).toEqual([String(activeKit._id)]);
    });

    test('listKits without requireActive respects the caller-supplied status filter', async () => {
      const { data } = await kitsService.listKits(schoolId, { status: 'draft' });
      expect(data.map((k) => String(k._id))).toEqual([String(draftKit._id)]);
    });
  });

  describe('Kit.purchasableFilter', () => {
    test('matches only an active, non-deleted kit with a vendor assigned', async () => {
      const kit = await kitsService.createKit(schoolId, {
        name: 'Purchasable Kit', items: baseItems, status: 'active', vendorId,
      });

      const found = await Kit.findOne(Kit.purchasableFilter(kit._id)).lean();
      expect(found).not.toBeNull();
    });

    test('excludes a draft kit', async () => {
      const kit = await kitsService.createKit(schoolId, { name: 'Draft', items: baseItems, status: 'draft' });
      const found = await Kit.findOne(Kit.purchasableFilter(kit._id)).lean();
      expect(found).toBeNull();
    });

    test('excludes a soft-deleted kit even though it was active', async () => {
      const kit = await kitsService.createKit(schoolId, {
        name: 'To Delete', items: baseItems, status: 'active', vendorId,
      });
      await kitsService.deleteKit(schoolId, kit._id, new mongoose.Types.ObjectId());

      const found = await Kit.findOne(Kit.purchasableFilter(kit._id)).lean();
      expect(found).toBeNull();
    });

    test('excludes an active kit with no vendor assigned', async () => {
      // Bypasses the service's own guard to simulate legacy/inconsistent data.
      const kit = await Kit.create({
        name: 'Legacy Vendorless Kit',
        slug: `legacy-vendorless-${Date.now()}`,
        items: baseItems,
        pricePaise: 1000,
        mrpPaise: 1000,
        status: 'active',
        vendorId: null,
      });

      const found = await Kit.findOne(Kit.purchasableFilter(kit._id)).lean();
      expect(found).toBeNull();
    });
  });
});
