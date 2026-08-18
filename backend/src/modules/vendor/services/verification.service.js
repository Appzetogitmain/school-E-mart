const { NotFoundError, BadRequestError } = require('../../../common/errors');
const User = require('../../../database/models/User');
const Attachment = require('../../../database/models/Attachment');
const vendorRepository = require('../repositories/vendor.repository');
const auditRepository = require('../../auth/repositories/audit.repository');
const { mapVendorDisplayStatus } = require('../utils/status');

// Decimal128 serializes to { $numberDecimal: "10" } over JSON, which renders as
// "[object Object]" in a UI. Normalize to a plain number at the edge.
const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value.$numberDecimal !== undefined) {
    return Number(value.$numberDecimal);
  }
  const parsed = Number(value.toString?.() ?? value);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * The stored account number is a one-way HMAC keyed on the app secret. It is not
 * useful to any caller and should not travel over the wire, so expose only whether
 * one is on file — mirroring what the vendor's own profile endpoint returns.
 */
const maskBank = (bank) => {
  if (!bank) return undefined;
  return {
    accountName: bank.accountName,
    bankName: bank.bankName,
    branch: bank.branch,
    accountNumber: bank.accountNumber || bank.accountNumberMasked || '',
    accountNumberMasked: bank.accountNumber || bank.accountNumberMasked || (bank.accountNumberEnc ? '' : undefined),
  };
};

const decorateVendor = (vendor) => ({
  ...vendor,
  // 'rejected' is not a stored enum value: it is approvalStatus 'suspended' plus
  // an inactive user. Resolve it here so lists can tell the two apart.
  status: mapVendorDisplayStatus(vendor, vendor.user || {}),
  commissionPercent: toNumber(vendor.commissionPercent),
  rating: toNumber(vendor.rating),
  bank: maskBank(vendor.bank),
});

/**
 * kycDocs store only an attachmentId, which is unopenable on its own. Resolve each
 * to a viewable url plus the metadata an admin needs to judge the document.
 */
const attachKycDocuments = async (vendors) => {
  const ids = vendors
    .flatMap((v) => (v.kycDocs || []).map((d) => d.attachmentId))
    .filter(Boolean);
  if (!ids.length) return vendors;

  const attachments = await Attachment.find({ _id: { $in: ids } }).lean();
  const byId = new Map(attachments.map((a) => [String(a._id), a]));

  return vendors.map((vendor) => ({
    ...vendor,
    kycDocs: (vendor.kycDocs || []).map((doc) => {
      const attachment = byId.get(String(doc.attachmentId));
      return {
        ...doc,
        url: attachment?.storageKey || null,
        mime: attachment?.mime || null,
        sizeBytes: attachment?.sizeBytes || null,
        scanStatus: attachment?.scanStatus || null,
        uploadedAt: attachment?.audit?.createdAt || null,
      };
    }),
  }));
};

const verificationService = {
  async listVendors(query) {
    const filter = {};
    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
    if (query.search) {
      filter.$or = [
        { storeName: { $regex: query.search, $options: 'i' } },
        { storeSlug: { $regex: query.search, $options: 'i' } },
      ];
    }
    const { data, pagination } = await vendorRepository.listWithUsers(filter, query);
    const withDocs = await attachKycDocuments(data);
    return { data: withDocs.map(decorateVendor), pagination };
  },

  async getVendor(vendorId) {
    const vendor = await vendorRepository.findWithUser(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');
    const [withDocs] = await attachKycDocuments([vendor]);
    return decorateVendor(withDocs);
  },

  async approveVendor(vendorId, actor = {}, note) {
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');
    if (vendor.approvalStatus === 'approved') {
      throw new BadRequestError('Vendor is already approved', null, 'VENDOR_ALREADY_APPROVED');
    }

    const updated = await vendorRepository.updateById(vendorId, {
      $set: { approvalStatus: 'approved', verifiedBadge: true },
    });

    await User.findByIdAndUpdate(vendor.userId, { $set: { status: 'active' } });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'vendor.approved',
      entityType: 'VendorProfile',
      entityId: vendorId,
      after: { note },
    });

    return updated;
  },

  async rejectVendor(vendorId, actor = {}, reason) {
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');

    const updated = await vendorRepository.updateById(vendorId, {
      $set: { approvalStatus: 'suspended', verifiedBadge: false },
    });

    await User.findByIdAndUpdate(vendor.userId, { $set: { status: 'inactive' } });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'vendor.rejected',
      entityType: 'VendorProfile',
      entityId: vendorId,
      after: { reason },
    });

    return updated;
  },

  async suspendVendor(vendorId, actor = {}, reason) {
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');

    const updated = await vendorRepository.updateById(vendorId, {
      $set: { approvalStatus: 'suspended', verifiedBadge: false },
    });

    await User.findByIdAndUpdate(vendor.userId, { $set: { status: 'suspended' } });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'vendor.suspended',
      entityType: 'VendorProfile',
      entityId: vendorId,
      after: { reason },
    });

    return updated;
  },

  async requestReVerification(vendorId, actor = {}, note) {
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');

    const updated = await vendorRepository.updateById(vendorId, {
      $set: { approvalStatus: 'pending', verifiedBadge: false },
    });

    await User.findByIdAndUpdate(vendor.userId, { $set: { status: 'active' } });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'vendor.reverify',
      entityType: 'VendorProfile',
      entityId: vendorId,
      after: { note },
    });

    return updated;
  },
};

module.exports = verificationService;
