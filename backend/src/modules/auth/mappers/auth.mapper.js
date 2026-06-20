const { toAuthUserDto, toSessionDto } = require('../dto/auth.dto');

const mapUserToDto = (user, extras = {}) =>
  toAuthUserDto({
    id: user._id.toString(),
    refId: user.refId,
    role: user.role,
    status: user.status,
    name: user.name,
    email: user.email || null,
    phone: user.phone,
    emailVerifiedAt: user.emailVerifiedAt || null,
    phoneVerifiedAt: user.phoneVerifiedAt || null,
    tenantSchoolId: user.tenantSchoolId?.toString() || null,
    lastLoginAt: user.lastLoginAt || null,
    permissions: extras.permissions || [],
    scopes: extras.scopes || [],
    profile: extras.profile || null,
  });

const mapSessionToDto = (session) => toSessionDto(session);

module.exports = {
  mapUserToDto,
  mapSessionToDto,
};
