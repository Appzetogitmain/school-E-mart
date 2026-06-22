const profileRepository = require('../repositories/profile.repository');
const { ForbiddenError } = require('../../../common/errors');
const { messages, roles, permissions: permissionConstants } = require('../../../constants');

const { ROLES } = roles;
const { ROLE_DEFAULT_PERMISSIONS } = permissionConstants;

const resolveAuthorizationContext = async (user) => {
  let permissions = ROLE_DEFAULT_PERMISSIONS[user.role] || [];
  let scopes = [];
  let profile = null;

  switch (user.role) {
    case ROLES.SCHOOL_ADMIN: {
      const staffProfile = await profileRepository.getSchoolStaffByUserId(user._id);
      if (staffProfile) {
        permissions = staffProfile.permissions?.length
          ? staffProfile.permissions
          : permissions;
        profile = { schoolId: staffProfile.schoolId?.toString() };
      }
      break;
    }
    case ROLES.TEACHER: {
      const teacherProfile = await profileRepository.getTeacherByUserId(user._id);
      if (teacherProfile) {
        profile = {
          schoolId: teacherProfile.schoolId?.toString(),
          approvalStatus: teacherProfile.approvalStatus,
        };
      }
      break;
    }
    case ROLES.VENDOR: {
      const vendorProfile = await profileRepository.getVendorByUserId(user._id);
      if (vendorProfile) {
        profile = {
          storeName: vendorProfile.storeName,
          approvalStatus: vendorProfile.approvalStatus,
        };
      }
      break;
    }
    case ROLES.SUPER_ADMIN: {
      const adminProfile = await profileRepository.getAdminByUserId(user._id);
      if (adminProfile) {
        scopes = adminProfile.scopes?.length ? adminProfile.scopes : ['*'];
        profile = {
          firstName: adminProfile.firstName,
          lastName: adminProfile.lastName,
        };
      }
      break;
    }
    default:
      break;
  }

  return { permissions, scopes, profile };
};

const assertAccountEligible = async (user) => {
  if (user.status === 'suspended') {
    throw new ForbiddenError(messages.AUTH.ACCOUNT_SUSPENDED, 'ACCOUNT_SUSPENDED');
  }
  if (user.status === 'inactive') {
    throw new ForbiddenError(messages.AUTH.ACCOUNT_INACTIVE, 'ACCOUNT_INACTIVE');
  }

  if (user.role === ROLES.TEACHER) {
    const teacherProfile = await profileRepository.getTeacherByUserId(user._id);
    if (teacherProfile?.approvalStatus === 'rejected') {
      throw new ForbiddenError(messages.AUTH.TEACHER_NOT_APPROVED, 'TEACHER_REJECTED');
    }
    if (teacherProfile?.approvalStatus === 'pending' || user.status === 'pending_approval') {
      throw new ForbiddenError(messages.AUTH.TEACHER_NOT_APPROVED, 'TEACHER_PENDING');
    }
  }

  if (user.role === ROLES.VENDOR) {
    const vendorProfile = await profileRepository.getVendorByUserId(user._id);
    if (vendorProfile?.approvalStatus === 'pending') {
      throw new ForbiddenError(messages.AUTH.VENDOR_NOT_APPROVED, 'VENDOR_PENDING');
    }
    if (vendorProfile?.approvalStatus === 'suspended') {
      throw new ForbiddenError(messages.AUTH.ACCOUNT_SUSPENDED, 'VENDOR_SUSPENDED');
    }
  }
};

module.exports = {
  resolveAuthorizationContext,
  assertAccountEligible,
};
