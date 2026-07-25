const crypto = require('crypto');
const Kit = require('../../../database/models/Kit');
const SchoolKitCategory = require('../../../database/models/SchoolKitCategory');
require('../../../database/models/School');
require('../../../database/models/VendorProfile');
require('../../../database/models/Attachment');
require('../../../database/models/MasterKitProduct');
const { NotFoundError, BadRequestError } = require('../../../common/errors');
const { executePaginatedQuery } = require('../../../repositories');

const notDeleted = { 'softDelete.isDeleted': { $ne: true } };

const DEFAULT_CATEGORIES = [
  'Textbooks & Notebooks',
  'School Uniforms',
  'Stationary Packs',
  'Winter Kit',
  'Initial Kit',
  'Project Kit',
];

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const uniqueSuffix = () => crypto.randomBytes(3).toString('hex');

const kitsService = {
  // Category management
  async listCategories(schoolId) {
    const custom = await SchoolKitCategory.find({ schoolId, ...notDeleted })
      .select('name')
      .lean();
    const customNames = custom.map((c) => c.name);
    return {
      defaults: DEFAULT_CATEGORIES,
      custom: custom,
      all: [...DEFAULT_CATEGORIES, ...customNames],
    };
  },

  async createCategory(schoolId, name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new BadRequestError('Category name is required');
    const existing = await SchoolKitCategory.findOne({ schoolId, name: trimmed, ...notDeleted });
    if (existing) return existing;
    return SchoolKitCategory.create({ schoolId, name: trimmed });
  },

  async deleteCategory(schoolId, categoryId) {
    const cat = await SchoolKitCategory.findOneAndUpdate(
      { _id: categoryId, schoolId, ...notDeleted },
      { $set: { 'softDelete.isDeleted': true, 'softDelete.deletedAt': new Date() } },
      { new: true }
    );
    if (!cat) throw new NotFoundError('Category not found');
    return true;
  },

  // Kit CRUD
  async createKit(schoolId, payload) {
    if (!payload.items?.length) {
      throw new BadRequestError('A kit needs at least one product item');
    }

    const goingLive = payload.status === 'active' || payload.flags?.availableOnline;
    if (goingLive && !payload.vendorId) {
      throw new BadRequestError('Select a fulfilling vendor before publishing the kit', null, 'KIT_VENDOR_REQUIRED');
    }

    const base = slugify(payload.name) || 'kit';
    const suffix = uniqueSuffix();

    const pricePaise = Number(payload.pricePaise) || 0;
    const mrpPaise = Number(payload.mrpPaise) || pricePaise;

    const kit = await Kit.create({
      schoolId,
      vendorId: payload.vendorId || null,
      name: payload.name,
      slug: `${base}-${suffix}`,
      classGrade: payload.classGrade,
      category: payload.category,
      description: payload.description,
      imageId: payload.imageId || null,
      imageUrl: payload.imageUrl || '',
      items: payload.items,
      pricePaise,
      mrpPaise,
      sku: `KIT-${suffix.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      status: payload.status === 'active' ? 'active' : 'draft',
      flags: {
        showOnApp: payload.showOnApp !== undefined ? Boolean(payload.showOnApp) : true,
        availableOnline: payload.availableOnline !== undefined ? Boolean(payload.availableOnline) : true,
        allowPreorders: Boolean(payload.allowPreorders),
      },
    });
    return kit.toObject();
  },

  async listKits(schoolId, query = {}) {
    const filter = { ...notDeleted };
    if (schoolId && schoolId !== 'all') filter.schoolId = schoolId;
    if (query.status) filter.status = query.status;
    if (query.classGrade) filter.classGrade = query.classGrade;
    if (query.category) filter.category = query.category;
    if (query.search) filter.name = { $regex: query.search.trim(), $options: 'i' };
    
    const result = await executePaginatedQuery(Kit, filter, query, { defaultSort: '-audit.createdAt' });
    if (result.data && result.data.length) {
      result.data = await Kit.populate(result.data, [
        { path: 'schoolId', select: 'name schoolRefNo code logoUrl address' },
        { path: 'vendorId', select: 'storeName businessName name phone email' },
        { path: 'imageId', select: 'storageKey mime sizeBytes' },
        { path: 'items.masterProductId', select: 'name category subcategory imageUrl productType' }
      ]);
    }
    return result;
  },

  async getKit(schoolId, kitId) {
    const filter = { _id: kitId, ...notDeleted };
    if (schoolId && schoolId !== 'all') filter.schoolId = schoolId;

    const kit = await Kit.findOne(filter)
      .populate({ path: 'schoolId', select: 'name schoolRefNo code logoUrl address' })
      .populate({ path: 'vendorId', select: 'storeName businessName name phone email' })
      .populate({ path: 'imageId', select: 'storageKey mime sizeBytes' })
      .populate({ path: 'items.masterProductId', select: 'name category subcategory imageUrl productType' })
      .lean();
    if (!kit) throw new NotFoundError('Kit not found', 'KIT_NOT_FOUND');
    return kit;
  },

  async updateKit(schoolId, kitId, payload) {
    const update = { ...payload };
    delete update.slug;
    delete update.sku;

    const filter = { _id: kitId, ...notDeleted };
    if (schoolId && schoolId !== 'all') filter.schoolId = schoolId;

    const goingLive = payload.status === 'active' || payload.flags?.availableOnline;
    if (goingLive) {
      const current = await Kit.findOne(filter).select('vendorId').lean();
      const resolvedVendor = payload.vendorId ?? current?.vendorId;
      if (!resolvedVendor) {
        throw new BadRequestError('Select a fulfilling vendor before publishing the kit', null, 'KIT_VENDOR_REQUIRED');
      }
    }

    if (payload.pricePaise !== undefined) update.pricePaise = Number(payload.pricePaise) || 0;
    if (payload.mrpPaise !== undefined) update.mrpPaise = Number(payload.mrpPaise) || update.pricePaise || 0;

    const kit = await Kit.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true }
    ).lean();
    if (!kit) throw new NotFoundError('Kit not found', 'KIT_NOT_FOUND');
    return kit;
  },

  async deleteKit(schoolId, kitId, deletedBy) {
    const filter = { _id: kitId, ...notDeleted };
    if (schoolId && schoolId !== 'all') filter.schoolId = schoolId;

    const kit = await Kit.findOneAndUpdate(
      filter,
      {
        $set: {
          'softDelete.isDeleted': true,
          'softDelete.deletedAt': new Date(),
          'softDelete.deletedBy': deletedBy,
        },
      },
      { new: true }
    ).lean();
    if (!kit) throw new NotFoundError('Kit not found', 'KIT_NOT_FOUND');
    return kit;
  },
};

module.exports = kitsService;
