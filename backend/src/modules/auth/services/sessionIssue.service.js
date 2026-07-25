const userRepository = require('../repositories/user.repository');
const auditRepository = require('../repositories/audit.repository');
const tokenService = require('./token.service');
const { mapUserToDto } = require('../mappers/auth.mapper');
const authConfig = require('../../../config/auth');
const {
  resolveAuthorizationContext,
  assertAccountEligible,
} = require('./authorizationContext.service');

const issueAuthenticatedSession = async (user, requestMeta = {}, auditAction = 'auth.login.success') => {
  await assertAccountEligible(user);

  const authContext = await resolveAuthorizationContext(user);
  const tokens = await tokenService.createSessionTokens(
    user,
    { permissions: authContext.permissions, scopes: authContext.scopes },
    requestMeta
  );

  const updatedUser = await userRepository.updateLoginSuccess(user._id);

  await auditRepository.log({
    actorUserId: user._id,
    actorRole: user.role,
    action: auditAction,
    entityType: 'AuthSession',
    entityId: user._id,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
    correlationId: requestMeta.requestId || null,
    after: { jti: tokens.jti },
  });

  const userDto = mapUserToDto(updatedUser || user, authContext);

  if (user.role === 'parent') {
    const ParentProfile = require('../../../database/models/ParentProfile');
    const ChildProfile = require('../../../database/models/ChildProfile');
    const School = require('../../../database/models/School');
    const Address = require('../../../database/models/Address');

    const parentProfile = await ParentProfile.findOne({ userId: user._id, 'softDelete.isDeleted': { $ne: true } }).lean();
    // Respect the parent's last-selected (active) child so login, /auth/me and
    // the profile switcher all agree on which student leads the UI.
    const childrenList = await ChildProfile.find({ parentUserId: user._id, 'softDelete.isDeleted': { $ne: true } })
      .sort({ 'audit.createdAt': 1 })
      .lean();
    const child =
      childrenList.find(
        (c) => parentProfile?.activeChildId && String(c._id) === String(parentProfile.activeChildId)
      ) || childrenList[0] || null;

    let defaultAddress = null;
    if (parentProfile?.defaultAddressId) {
      defaultAddress = await Address.findById(parentProfile.defaultAddressId).lean();
    }

    if (child) {
      const school = child.schoolId ? await School.findById(child.schoolId).lean() : null;
      userDto.childProfile = {
        name: child.name,
        grade: child.grade,
        schoolId: child.schoolId ? child.schoolId.toString() : 'explore-schools',
        schoolName: school ? school.name : 'Explore Schools',
        schoolLogo: school ? school.logoUrl : null,
        schoolRefNo: child.schoolRefNo || (school ? school.schoolRefNo : null),
        rollNo: child.rollNo || null,
        studentId: child.studentId ? child.studentId.toString() : null,
        photo: child.avatarUrl || null,
        avatarUrl: child.avatarUrl || null,
      };
    }

    if (parentProfile) {
      userDto.profile = {
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
  }

  return {
    ...tokens,
    user: userDto,
    expiresIn: Math.floor(authConfig.accessExpiryMs / 1000),
  };
};

module.exports = {
  resolveAuthorizationContext,
  assertAccountEligible,
  issueAuthenticatedSession,
};
