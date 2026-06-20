const toAuthUserDto = (user) => ({
  id: user.id,
  refId: user.refId,
  role: user.role,
  status: user.status,
  name: user.name,
  email: user.email,
  phone: user.phone,
  emailVerified: Boolean(user.emailVerifiedAt),
  phoneVerified: Boolean(user.phoneVerifiedAt),
  tenantSchoolId: user.tenantSchoolId,
  lastLoginAt: user.lastLoginAt,
  permissions: user.permissions || [],
  scopes: user.scopes || [],
  profile: user.profile || undefined,
});

const toSessionDto = (session) => ({
  id: session._id?.toString() || session.id,
  device: session.device || {},
  ipAddress: session.ipAddress || null,
  lastSeenAt: session.lastSeenAt,
  expiresAt: session.expiresAt,
  createdAt: session.createdAt || session.lastSeenAt,
  current: Boolean(session.current),
});

const toAuthResponseDto = ({ user, accessToken, expiresIn }) => ({
  user,
  accessToken,
  tokenType: 'Bearer',
  expiresIn,
});

module.exports = {
  toAuthUserDto,
  toSessionDto,
  toAuthResponseDto,
};
