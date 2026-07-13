const fs = require('fs');
const path = require('path');
const User = require('../../../database/models/User');
const ParentProfile = require('../../../database/models/ParentProfile');
const ChildProfile = require('../../../database/models/ChildProfile');
const Address = require('../../../database/models/Address');
const School = require('../../../database/models/School');
const { NotFoundError, BadRequestError } = require('../../../common/errors');
const { normalizePhone } = require('../../../utils');

const saveBase64Image = (base64Str, prefix = 'avatar') => {
  if (!base64Str) return null;
  if (base64Str.startsWith('/uploads/')) return base64Str; // Already uploaded path

  const match = base64Str.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;

  const ext = match[1];
  const data = match[2];
  const buffer = Buffer.from(data, 'base64');

  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
  const uploadsDir = path.resolve(__dirname, '../../../../uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
};

const usersService = {
  async getProfile(userId) {
    const user = await User.findOne({ _id: userId, 'softDelete.isDeleted': { $ne: true } }).lean();
    if (!user) throw new NotFoundError('User not found');

    let profile = null;
    let childProfile = null;

    if (user.role === 'parent') {
      const parentProfile = await ParentProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } }).lean();
      const child = await ChildProfile.findOne({ parentUserId: userId, 'softDelete.isDeleted': { $ne: true } }).lean();

      let defaultAddress = null;
      if (parentProfile?.defaultAddressId) {
        defaultAddress = await Address.findById(parentProfile.defaultAddressId).lean();
      }

      if (child) {
        const school = child.schoolId ? await School.findById(child.schoolId).lean() : null;
        childProfile = {
          name: child.name,
          grade: child.grade,
          schoolId: child.schoolId ? child.schoolId.toString() : 'explore-schools',
          schoolName: school ? school.name : 'Explore Schools',
          schoolRefNo: child.schoolRefNo || (school ? school.schoolRefNo : null),
          studentId: child.studentId ? child.studentId.toString() : null,
          photo: child.avatarUrl || null,
          avatarUrl: child.avatarUrl || null,
        };
      }

      if (parentProfile) {
        profile = {
          altPhone: parentProfile.altPhone || null,
          avatarUrl: parentProfile.avatarUrl || null,
          referralCode: parentProfile.referralCode || null,
          address: defaultAddress?.line1 || null,
          pinCode: defaultAddress?.pinCode || null,
          city: defaultAddress?.city || null,
          state: defaultAddress?.state || null,
          country: defaultAddress?.country || null,
        };
      }
    } else if (user.role === 'vendor') {
      const VendorProfile = require('../../../database/models/VendorProfile');
      profile = await VendorProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } }).lean();
    } else if (user.role === 'teacher') {
      const TeacherProfile = require('../../../database/models/TeacherProfile');
      profile = await TeacherProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } }).lean();
    } else if (user.role === 'admin') {
      const AdminProfile = require('../../../database/models/AdminProfile');
      profile = await AdminProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } }).lean();
    }

    return {
      user: {
        id: user._id.toString(),
        refId: user.refId,
        role: user.role,
        status: user.status,
        name: user.name,
        email: user.email || null,
        phone: user.phone,
      },
      profile,
      childProfile,
    };
  },

  async updateProfile(userId, payload) {
    const user = await User.findOne({ _id: userId, 'softDelete.isDeleted': { $ne: true } });
    if (!user) throw new NotFoundError('User not found');

    if (payload.email !== undefined) {
      if (payload.email) {
        const existing = await User.findOne({ email: payload.email, _id: { $ne: userId }, 'softDelete.isDeleted': { $ne: true } });
        if (existing) throw new BadRequestError('Email already in use', 'EMAIL_EXISTS');
      }
      user.email = payload.email || undefined;
    }

    if (payload.phone) {
      const normalized = normalizePhone(payload.phone);
      const existing = await User.findOne({ phone: normalized, _id: { $ne: userId }, 'softDelete.isDeleted': { $ne: true } });
      if (existing) throw new BadRequestError('Phone number already in use', 'PHONE_EXISTS');
      user.phone = normalized;
    }

    if (user.role === 'parent') {
      const parentProfile = await ParentProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } });
      const child = await ChildProfile.findOne({ parentUserId: userId, 'softDelete.isDeleted': { $ne: true } });

      if (payload.name) {
        user.name = `${payload.name} Parent`;
        if (child) {
          child.name = payload.name;
          await child.save();
        }
      }

      // Handle Photo Upload / Base64 parsing
      let savedPhotoUrl = null;
      if (payload.photo) {
        savedPhotoUrl = saveBase64Image(payload.photo, 'child-avatar');
        if (savedPhotoUrl) {
          if (child) {
            child.avatarUrl = savedPhotoUrl;
            await child.save();
          }
          if (parentProfile) {
            parentProfile.avatarUrl = savedPhotoUrl;
          }
        }
      }

      if (parentProfile) {
        if (payload.altPhone !== undefined) {
          parentProfile.altPhone = payload.altPhone ? normalizePhone(payload.altPhone) : undefined;
        }

        // Handle Address update/create
        if (payload.address !== undefined || payload.pinCode !== undefined || payload.city !== undefined || payload.state !== undefined || payload.country !== undefined) {
          let addressDoc = null;
          if (parentProfile.defaultAddressId) {
            addressDoc = await Address.findById(parentProfile.defaultAddressId);
          }

          if (addressDoc) {
            if (payload.address !== undefined) addressDoc.line1 = payload.address || '';
            if (payload.pinCode !== undefined) addressDoc.pinCode = payload.pinCode || '';
            if (payload.city !== undefined) addressDoc.city = payload.city || '';
            if (payload.state !== undefined) addressDoc.state = payload.state || '';
            if (payload.country !== undefined) addressDoc.country = payload.country || '';
            addressDoc.recipientName = payload.name || user.name;
            addressDoc.phone = payload.phone || user.phone;
            await addressDoc.save();
          } else {
            const newAddr = await Address.create({
              userId,
              label: 'home',
              recipientName: payload.name || user.name,
              phone: payload.phone || user.phone,
              line1: payload.address || '',
              city: payload.city || '',
              state: payload.state || '',
              country: payload.country || 'India',
              pinCode: payload.pinCode || '',
              isDefault: true,
            });
            parentProfile.defaultAddressId = newAddr._id;
            parentProfile.addressBookIds = [newAddr._id];
          }
        }

        await parentProfile.save();
      }
    }

    await user.save();
    return this.getProfile(userId);
  }
};

module.exports = usersService;
