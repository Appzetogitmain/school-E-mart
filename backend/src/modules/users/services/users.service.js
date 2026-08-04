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
    let children = [];

    if (user.role === 'parent' || user.role === 'user') {
      const parentProfile = await ParentProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } }).lean();
      // All linked children (a parent may have more than one), oldest first so
      // the list order is stable. The active child leads the student-first UI.
      const allChildren = await ChildProfile.find({ parentUserId: userId, 'softDelete.isDeleted': { $ne: true } })
        .sort({ 'audit.createdAt': 1 })
        .lean();

      let defaultAddress = null;
      if (parentProfile?.defaultAddressId) {
        defaultAddress = await Address.findById(parentProfile.defaultAddressId).lean();
      }

      // Batch the school lookups so many children don't fan out to many queries
      const schoolIds = [...new Set(allChildren.map((c) => c.schoolId).filter(Boolean).map(String))];
      const schools = schoolIds.length
        ? await School.find({ _id: { $in: schoolIds } }).select('name logoUrl schoolRefNo address phone principalName').lean()
        : [];
      const schoolById = new Map(schools.map((s) => [String(s._id), s]));

      const mapChild = (c) => {
        const school = c.schoolId ? schoolById.get(String(c.schoolId)) : null;
        return {
          childProfileId: c._id.toString(),
          name: c.name,
          grade: c.grade,
          schoolId: c.schoolId ? c.schoolId.toString() : 'explore-schools',
          schoolName: school ? school.name : 'Explore Schools',
          schoolLogo: school ? school.logoUrl : null,
          schoolRefNo: c.schoolRefNo || (school ? school.schoolRefNo : null),
          rollNo: c.rollNo || null,
          studentId: c.studentId ? c.studentId.toString() : null,
          photo: c.avatarUrl || null,
          avatarUrl: c.avatarUrl || null,
        };
      };

      children = allChildren.map(mapChild);

      // Active child = the one the parent last selected, else the first linked
      const activeChild =
        allChildren.find(
          (c) => parentProfile?.activeChildId && String(c._id) === String(parentProfile.activeChildId)
        ) || allChildren[0];
      if (activeChild) childProfile = mapChild(activeChild);

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
      const targetSchoolId = user.tenantSchoolId || profile?.schoolId;
      if (targetSchoolId) {
        const school = await School.findById(targetSchoolId).lean();
        if (school) {
          profile = profile || {};
          profile.schoolName = school.name;
          profile.schoolLogo = school.logoUrl || null;
          profile.school = {
            id: school._id.toString(),
            name: school.name,
            logoUrl: school.logoUrl || null,
            phone: school.phone || null,
            address: school.address || null,
            schoolRefNo: school.schoolRefNo || null,
          };
        }
      }
    } else if (user.role === 'admin') {
      const AdminProfile = require('../../../database/models/AdminProfile');
      profile = await AdminProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } }).lean();
    } else if (user.role === 'school') {
      const SchoolStaffProfile = require('../../../database/models/SchoolStaffProfile');
      profile = await SchoolStaffProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } }).lean();
      if (user.tenantSchoolId) {
        const school = await School.findById(user.tenantSchoolId).lean();
        if (school) {
          profile = profile || {};
          profile.schoolName = school.name;
          profile.schoolLogo = school.logoUrl || null;
          profile.school = {
            id: school._id.toString(),
            name: school.name,
            logoUrl: school.logoUrl || null,
            phone: school.phone || null,
            address: school.address || null,
            schoolRefNo: school.schoolRefNo || null,
          };
        }
      }
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
      children,
    };
  },

  async updateProfile(userId, payload) {
    const user = await User.findOne({ _id: userId, 'softDelete.isDeleted': { $ne: true } });
    if (!user) throw new NotFoundError('User not found');

    if (payload.email !== undefined) {
      if (payload.email) {
        const existing = await User.findOne({ email: payload.email, _id: { $ne: userId }, 'softDelete.isDeleted': { $ne: true } });
        if (existing) throw new BadRequestError('Email already in use', null, 'EMAIL_EXISTS');
      }
      user.email = payload.email || undefined;
    }

    if (payload.phone) {
      const normalized = normalizePhone(payload.phone);
      const existing = await User.findOne({ phone: normalized, _id: { $ne: userId }, 'softDelete.isDeleted': { $ne: true } });
      if (existing) throw new BadRequestError('Phone number already in use', null, 'PHONE_EXISTS');
      user.phone = normalized;
    }

    if (user.role === 'school') {
      const SchoolStaffProfile = require('../../../database/models/SchoolStaffProfile');
      const staffProfile = await SchoolStaffProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } });

      if (payload.name) {
        user.name = payload.name;
      }

      let savedPhotoUrl = null;
      const rawLogo = payload.photo || payload.logoUrl || payload.logo;
      if (rawLogo) {
        savedPhotoUrl = saveBase64Image(rawLogo, 'school-logo');
        if (savedPhotoUrl && staffProfile) {
          staffProfile.avatarUrl = savedPhotoUrl;
        }
      }

      if (staffProfile) {
        if (payload.altPhone !== undefined) {
          staffProfile.altPhone = payload.altPhone ? normalizePhone(payload.altPhone) : undefined;
        }
        await staffProfile.save();
      }

      if (user.tenantSchoolId) {
        const school = await School.findOne({ _id: user.tenantSchoolId, 'softDelete.isDeleted': { $ne: true } });
        if (school) {
          if (payload.schoolName) {
            school.name = payload.schoolName;
          }
          if (payload.name) {
            school.principalName = payload.name;
          }
          if (payload.email !== undefined) {
            school.adminEmail = payload.email || undefined;
          }
          if (payload.phone !== undefined) {
            school.phone = payload.phone ? normalizePhone(payload.phone) : undefined;
          }
          if (savedPhotoUrl) {
            school.logoUrl = savedPhotoUrl;
          }
          if (payload.address !== undefined || payload.pinCode !== undefined || payload.city !== undefined || payload.state !== undefined || payload.country !== undefined) {
            school.address = school.address || {};
            if (payload.address !== undefined) school.address.line1 = payload.address || '';
            if (payload.pinCode !== undefined) school.address.pinCode = payload.pinCode || '';
            if (payload.city !== undefined) school.address.city = payload.city || '';
            if (payload.state !== undefined) school.address.state = payload.state || '';
            if (payload.country !== undefined) school.address.country = payload.country || '';
          }
          await school.save();
        }
      }
    }

    if (user.role === 'parent' || user.role === 'user') {
      let parentProfile = await ParentProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } });
      if (!parentProfile) {
        const generateCode = () => 'EMART' + Math.floor(1000 + Math.random() * 9000);
        let refCode = generateCode();
        while (await ParentProfile.findOne({ referralCode: refCode })) {
          refCode = generateCode();
        }
        parentProfile = await ParentProfile.create({ userId, referralCode: refCode });
      }
      // Edit the ACTIVE child (the one the parent is acting on behalf of), not
      // just the first one, so multi-child parents update the right student.
      const children = await ChildProfile.find({ parentUserId: userId, 'softDelete.isDeleted': { $ne: true } })
        .sort({ 'audit.createdAt': 1 });
      const child =
        children.find(
          (c) => parentProfile?.activeChildId && String(c._id) === String(parentProfile.activeChildId)
        ) || children[0] || null;

      // Official student names and login phone numbers for enrolled school students are academic records
      // managed exclusively by the School Administration. Parents cannot alter official student names or login numbers.
      const isEnrolledSchoolStudent = Boolean(child?.studentId || child?.schoolId);

      if (payload.studentName !== undefined && child) {
        if (!isEnrolledSchoolStudent) {
          child.name = payload.studentName;
          await child.save();
        }
      }

      if (payload.parentName !== undefined) {
        user.name = payload.parentName;
      } else if (payload.name && payload.studentName === undefined && payload.parentName === undefined) {
        if (child && !isEnrolledSchoolStudent) {
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
  },

  // Switch which linked child is "active" for a parent. Everything the parent
  // does on behalf of a student (attendance, homework, diary, phonebook) follows
  // the active child, so this persists the choice across sessions.
  async setActiveChild(userId, childProfileId) {
    const parentProfile = await ParentProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } });
    if (!parentProfile) throw new NotFoundError('Parent profile not found');

    const child = await ChildProfile.findOne({
      _id: childProfileId,
      parentUserId: userId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();
    if (!child) throw new NotFoundError('Child not found for this parent', 'CHILD_NOT_FOUND');

    parentProfile.activeChildId = child._id;
    await parentProfile.save();

    return this.getProfile(userId);
  },
};

module.exports = usersService;
