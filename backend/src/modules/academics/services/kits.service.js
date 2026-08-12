const crypto = require('crypto');
const Kit = require('../../../database/models/Kit');
const SchoolKitCategory = require('../../../database/models/SchoolKitCategory');
const Order = require('../../../database/models/Order');
const ChildProfile = require('../../../database/models/ChildProfile');
require('../../../database/models/School');
require('../../../database/models/VendorProfile');
require('../../../database/models/Attachment');
require('../../../database/models/MasterKitProduct');
require('../../../database/models/User');
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

    // `status` is the only thing that puts a kit in front of parents (see
    // getKit/listKits' requireActive gating and Kit.purchasableFilter), so it is
    // the only thing this check needs to look at.
    const goingLive = payload.status === 'active';
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
      // The model still carries these for schema compatibility, but nothing reads
      // them — `status` is the real switch — so they are fixed defaults, not
      // client input.
      flags: {
        showOnApp: true,
        availableOnline: true,
        allowPreorders: false,
      },
    });
    return kit.toObject();
  },

  // requireActive: true for viewers who are not managing the kit (parents, teachers,
  // vendors) — they must only ever see published kits, and a client-supplied
  // `status` query param must not be able to override that. false for school/super
  // admins, who need to see and edit their own drafts.
  async listKits(schoolId, query = {}, { requireActive = false } = {}) {
    const filter = { ...notDeleted };
    if (schoolId && schoolId !== 'all') filter.schoolId = schoolId;

    // executePaginatedQuery's ApiFeatures.filter() re-applies every remaining
    // query-string key — status included — as its own `.find()` call on top of
    // whatever `filter` already set, and the later call wins on conflicts. So a
    // forced status has to be scrubbed from the query string itself, or a caller
    // simply asking for ?status=draft would silently win back the draft it was
    // just blocked from seeing.
    const effectiveQuery = { ...query };
    if (requireActive) {
      filter.status = 'active';
      delete effectiveQuery.status;
    } else if (query.status) {
      filter.status = query.status;
    }
    if (query.classGrade) filter.classGrade = query.classGrade;
    if (query.category) filter.category = query.category;
    if (query.search) filter.name = { $regex: query.search.trim(), $options: 'i' };

    const result = await executePaginatedQuery(Kit, filter, effectiveQuery, { defaultSort: '-audit.createdAt' });
    if (result.data && result.data.length) {
      result.data = await Kit.populate(result.data, [
        { path: 'schoolId', select: 'name schoolRefNo code logoUrl address' },
        { path: 'vendorId', select: 'storeName businessName name phone email' },
        { path: 'imageId', select: 'storageKey mime sizeBytes' },
        { path: 'items.masterProductId', select: 'name category subcategory imageUrl productType' }
      ]);

      // Sales counts are only meaningful to whoever is managing the kit
      // (school/super admin) — parents and vendors browsing the catalogue
      // don't need or get this.
      if (!requireActive) {
        const kitIds = result.data.map((k) => k._id);
        const counts = await this.getSalesCounts(kitIds);
        result.data = result.data.map((k) => ({
          ...k,
          salesCount: counts.get(String(k._id)) || 0,
        }));
      }
    }
    return result;
  },

  // Number of non-cancelled orders that include each kit, batched in one
  // aggregation rather than N queries. Used by the management list ("X sold")
  // and as the headline figure on the purchases/report view.
  async getSalesCounts(kitIds) {
    if (!kitIds?.length) return new Map();
    const rows = await Order.aggregate([
      { $match: { 'items.kitId': { $in: kitIds }, orderStatus: { $nin: ['cancelled', 'returned'] } } },
      { $unwind: '$items' },
      { $match: { 'items.kitId': { $in: kitIds } } },
      { $group: { _id: '$items.kitId', count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), r.count]));
  },

  async getKit(schoolId, kitId, { requireActive = false } = {}) {
    const filter = { _id: kitId, ...notDeleted };
    if (schoolId && schoolId !== 'all') filter.schoolId = schoolId;
    if (requireActive) filter.status = 'active';

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

    // Fetched unconditionally: an update that never touches `status` or `vendorId`
    // but leaves an already-active kit active must still be checked, not just an
    // update that explicitly flips status to 'active'.
    const current = await Kit.findOne(filter).select('vendorId status').lean();
    if (!current) throw new NotFoundError('Kit not found', 'KIT_NOT_FOUND');

    const resolvedStatus = payload.status !== undefined ? payload.status : current.status;
    const goingLive = resolvedStatus === 'active';
    if (goingLive) {
      const resolvedVendor = payload.vendorId !== undefined ? payload.vendorId : current.vendorId;
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

  // "Who bought this kit, and who (of the students it's actually for) hasn't
  // yet" — the school's sales/coverage report for a single kit.
  async getKitPurchaseReport(schoolId, kitId) {
    const kit = await this.getKit(schoolId, kitId, { requireActive: false });
    // `schoolId` can be the literal string 'all' on a super-admin route, and
    // `kit.schoolId` above comes back populated (or null, if the referenced
    // School can't be found) — neither is safe to filter the student roster
    // by. Read the kit's raw, unpopulated schoolId directly instead.
    const kitSchoolId = (await Kit.findById(kitId).select('schoolId').lean())?.schoolId;

    const orders = await Order.find({
      'items.kitId': kitId,
      orderStatus: { $nin: ['cancelled', 'returned'] },
    })
      .select('orderNumber userId items paymentStatus orderStatus placedAt audit')
      .populate({ path: 'userId', select: 'name email phone' })
      .sort('-audit.createdAt')
      .lean();

    const seenParentIds = new Set();
    const purchases = [];

    orders.forEach((order) => {
      const pUserId = String(order.userId?._id || order.userId || '');
      if (pUserId && seenParentIds.has(pUserId)) return;
      if (pUserId) seenParentIds.add(pUserId);

      const item = (order.items || []).find((it) => String(it.kitId) === String(kitId));
      purchases.push({
        orderId: order._id,
        orderNumber: order.orderNumber,
        parentUserId: order.userId?._id || order.userId || null,
        parentName: order.userId?.name || 'Parent',
        parentEmail: order.userId?.email || null,
        parentPhone: order.userId?.phone || null,
        quantity: item?.quantity || 1,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        purchasedAt: order.placedAt || order.audit?.createdAt || null,
      });
    });

    const purchasedParentIds = new Set(
      purchases.filter((p) => p.parentUserId).map((p) => String(p.parentUserId))
    );

    // Scoped to the children this kit is actually meant for: the school's
    // roster in the kit's target class/grade, or every child at the school if
    // the kit isn't grade-specific. Orders are per-parent (not per-child), so
    // a parent with two eligible kids who bought the kit once shows both kids
    // as covered — there's no finer-grained signal to go on than that.
    const childFilter = { schoolId: kitSchoolId, 'softDelete.isDeleted': { $ne: true } };
    if (kit.classGrade) childFilter.grade = kit.classGrade;

    const children = await ChildProfile.find(childFilter)
      .select('name grade rollNo parentUserId avatarUrl')
      .sort('name')
      .lean();

    const purchasedChildren = [];
    const notPurchased = [];
    for (const child of children) {
      const bought = purchasedParentIds.has(String(child.parentUserId));
      const row = {
        childId: child._id,
        name: child.name,
        grade: child.grade,
        rollNo: child.rollNo || null,
        parentUserId: child.parentUserId,
      };
      (bought ? purchasedChildren : notPurchased).push(row);
    }

    return {
      kit: {
        id: kit._id,
        name: kit.name,
        classGrade: kit.classGrade || null,
        pricePaise: kit.pricePaise,
        status: kit.status,
      },
      totalOrders: purchases.length,
      totalEligibleChildren: children.length,
      purchasedChildrenCount: purchasedChildren.length,
      notPurchasedCount: notPurchased.length,
      purchases,
      purchasedChildren,
      notPurchased,
    };
  },

  // Which of this school's active kits has the current parent already bought —
  // the single source of truth behind every "X of Y kits purchased" progress
  // bar (Home, My School, kit detail pages). Scoped by kit id directly rather
  // than paginating the parent's whole order history, so it stays correct no
  // matter how many other (non-kit) orders they've placed over the years —
  // a plain `listOrders({limit: 100})` scan on the frontend would silently
  // miss an old kit purchase once a family crosses 100 orders.
  //
  // "Purchased" mirrors cart.service.js's KIT_ALREADY_PURCHASED definition
  // exactly: not cancelled/returned, and either already paid/authorized or
  // COD (which reserves the kit the moment it's placed, before payment is
  // actually collected).
  async listPurchasedKitIds(userId, schoolId) {
    const activeKits = await Kit.find({
      schoolId,
      status: 'active',
      ...notDeleted,
    })
      .select('_id')
      .lean();
    const kitIds = activeKits.map((k) => k._id);
    if (!kitIds.length) return [];

    const orders = await Order.find({
      userId,
      orderStatus: { $nin: ['cancelled', 'returned'] },
      $or: [{ paymentStatus: { $in: ['paid', 'authorized'] } }, { paymentMethod: 'cod' }],
      'items': {
        $elemMatch: { $or: [{ kitId: { $in: kitIds } }, { productId: { $in: kitIds } }] },
      },
    })
      .select('items.kitId items.productId')
      .lean();

    const kitIdStrings = new Set(kitIds.map(String));
    const purchased = new Set();
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const kid = item.kitId ? String(item.kitId) : null;
        const pid = item.productId ? String(item.productId) : null;
        if (kid && kitIdStrings.has(kid)) purchased.add(kid);
        if (pid && kitIdStrings.has(pid)) purchased.add(pid);
      });
    });
    return [...purchased];
  },
};

module.exports = kitsService;
