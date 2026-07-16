const crypto = require('crypto');
const Kit = require('../../../database/models/Kit');
const Product = require('../../../database/models/Product');
const { NotFoundError, BadRequestError } = require('../../../common/errors');
const { executePaginatedQuery } = require('../../../repositories');

const notDeleted = { 'softDelete.isDeleted': { $ne: true } };

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const uniqueSuffix = () => crypto.randomBytes(3).toString('hex');

/** Sum current product prices so the kit price stays honest even if omitted. */
const computeItemTotals = async (items = []) => {
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } })
    .select('pricePaise originalPricePaise name')
    .lean();
  const map = new Map(products.map((p) => [String(p._id), p]));

  let pricePaise = 0;
  let mrpPaise = 0;
  items.forEach((item) => {
    const product = map.get(String(item.productId));
    if (!product) {
      throw new BadRequestError('One or more kit products no longer exist');
    }
    const selling = product.pricePaise || 0;
    const mrp = product.originalPricePaise || selling;
    pricePaise += selling * item.qty;
    mrpPaise += mrp * item.qty;
  });
  return { pricePaise, mrpPaise };
};

const kitsService = {
  async createKit(schoolId, payload) {
    if (!payload.items?.length) {
      throw new BadRequestError('A kit needs at least one product');
    }

    const totals = await computeItemTotals(payload.items);
    const base = slugify(payload.name) || 'kit';
    const suffix = uniqueSuffix();

    const kit = await Kit.create({
      schoolId,
      name: payload.name,
      slug: `${base}-${suffix}`,
      classGrade: payload.classGrade,
      category: payload.category,
      description: payload.description,
      imageId: payload.imageId,
      items: payload.items,
      addOns: payload.addOns || [],
      pricePaise: payload.pricePaise ?? totals.pricePaise,
      mrpPaise: payload.mrpPaise ?? totals.mrpPaise,
      sku: `KIT-${suffix.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      status: payload.status === 'active' ? 'active' : 'draft',
      flags: {
        showOnApp: Boolean(payload.showOnApp),
        availableOnline: Boolean(payload.availableOnline),
        allowPreorders: Boolean(payload.allowPreorders),
      },
    });
    return kit.toObject();
  },

  async listKits(schoolId, query = {}) {
    const filter = { schoolId, ...notDeleted };
    if (query.status) filter.status = query.status;
    if (query.classGrade) filter.classGrade = query.classGrade;
    if (query.category) filter.category = query.category;
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };
    const result = await executePaginatedQuery(Kit, filter, query, { defaultSort: '-audit.createdAt' });
    if (result.data && result.data.length) {
      result.data = await Kit.populate(result.data, [
        { path: 'items.productId', select: 'name images pricePaise originalPricePaise publishStatus' },
        { path: 'addOns.productId', select: 'name images pricePaise originalPricePaise publishStatus' }
      ]);
    }
    return result;
  },

  async getKit(schoolId, kitId) {
    const kit = await Kit.findOne({ _id: kitId, schoolId, ...notDeleted })
      .populate({ path: 'items.productId', select: 'name images pricePaise originalPricePaise publishStatus' })
      .populate({ path: 'addOns.productId', select: 'name images pricePaise originalPricePaise publishStatus' })
      .lean();
    if (!kit) throw new NotFoundError('Kit not found', 'KIT_NOT_FOUND');
    return kit;
  },

  async updateKit(schoolId, kitId, payload) {
    const update = { ...payload };
    delete update.slug;
    delete update.sku;

    if (payload.items) {
      const totals = await computeItemTotals(payload.items);
      if (payload.pricePaise == null) update.pricePaise = totals.pricePaise;
      if (payload.mrpPaise == null) update.mrpPaise = totals.mrpPaise;
    }

    const kit = await Kit.findOneAndUpdate(
      { _id: kitId, schoolId, ...notDeleted },
      { $set: update },
      { new: true }
    ).lean();
    if (!kit) throw new NotFoundError('Kit not found', 'KIT_NOT_FOUND');
    return kit;
  },

  async deleteKit(schoolId, kitId, deletedBy) {
    const kit = await Kit.findOneAndUpdate(
      { _id: kitId, schoolId, ...notDeleted },
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
