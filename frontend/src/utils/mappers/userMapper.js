export const normalizeUser = (user) => {
  if (!user) return null;

  return {
    id: user.id || user._id?.toString?.() || user._id,
    refId: user.refId,
    role: user.role,
    status: user.status,
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    emailVerified: user.emailVerified ?? Boolean(user.emailVerifiedAt),
    phoneVerified: user.phoneVerified ?? Boolean(user.phoneVerifiedAt),
    tenantSchoolId: user.tenantSchoolId?.toString?.() || user.tenantSchoolId || null,
    permissions: user.permissions || [],
    scopes: user.scopes || [],
    profile: user.profile || null,
    childProfile: user.childProfile || null,
  };
};

export const mapUserForDisplay = (user) => {
  const normalized = normalizeUser(user);
  if (!normalized) return null;

  if (normalized.role === 'vendor') {
    return {
      ...normalized,
      school: normalized.profile?.storeName || normalized.name,
      location: normalized.profile?.location,
    };
  }

  if (normalized.role === 'admin') {
    return {
      ...normalized,
      department: normalized.profile?.department || 'Core Infrastructure',
      level: 'SuperAdmin',
    };
  }

  return normalized;
};

export const buildChildInfoFromUser = (user, existing = {}) => {
  const normalized = normalizeUser(user);
  const profile = normalized?.profile || {};
  const childProfile = user?.childProfile || normalized?.childProfile || {};

  const role =
    normalized?.role === 'school'
      ? 'school'
      : normalized?.role === 'teacher'
        ? 'teacher'
        : existing.role || 'parent';

  // A linked parent shows the STUDENT name; an unlinked/guest customer (no
  // child) shows their own name. Never let a LINKED parent fall back to the
  // parent's own user.name (that was the "parent name shown instead of student"
  // bug) — /auth/me now always includes childProfile for linked parents.
  const hasChild = Boolean(childProfile && childProfile.name);
  const displayName =
    role === 'parent'
      ? hasChild
        ? childProfile.name
        : normalized?.name || existing.name || 'Guest'
      : childProfile.name || normalized?.name || existing.name || 'Guest';

  return {
    ...existing,
    name: displayName,
    role,
    phone: normalized?.phone || existing.phone || '',
    email: normalized?.email || existing.email || '',
    refId: normalized?.refId || existing.refId,
    school: childProfile.schoolName || existing.school || profile.schoolName || profile.storeName || 'Explore Schools',
    grade: childProfile.grade || existing.grade || profile.grade || 'Select Grade',
    schoolId: childProfile.schoolId || normalized?.tenantSchoolId || profile.schoolId || existing.schoolId,
    schoolRefNo: childProfile.schoolRefNo || existing.schoolRefNo || null,
    rollNo: childProfile.rollNo || existing.rollNo || null,
    studentId: childProfile.studentId || existing.studentId || null,
    altPhone: profile.altPhone || existing.altPhone || '',
    address: profile.address || existing.address || '',
    pinCode: profile.pinCode || existing.pinCode || '',
    city: profile.city || existing.city || '',
    state: profile.state || existing.state || '',
    country: profile.country || existing.country || 'India',
    photo: childProfile.avatarUrl || childProfile.photo || profile.avatarUrl || existing.photo || '',
    progress: existing.progress,
  };
};

export const syncChildInfoToStorage = (user, existing = null) => {
  let prev = existing;
  if (prev === null) {
    try {
      const raw = localStorage.getItem('childInfo');
      prev = raw ? JSON.parse(raw) : {};
    } catch {
      prev = {};
    }
  }

  const childInfo = buildChildInfoFromUser(user, prev);
  localStorage.setItem('childInfo', JSON.stringify(childInfo));
  return childInfo;
};

export const getLoginRedirectPath = (user, portal) => {
  const role = user?.role;

  if (portal === 'vendor' || role === 'vendor') return '/vendor/dashboard';
  if (portal === 'admin' || role === 'admin') return '/superadmin/dashboard';
  if (role === 'teacher') return '/school/teacher/dashboard';
  if (role === 'school') return '/school/admin';
  if (portal === 'parent' || role === 'parent') return '/user/home';

  return '/';
};

export const PORTAL_LOGIN_PATHS = {
  parent: '/user/login',
  school: '/school/login',
  teacher: '/school/login',
  vendor: '/vendor/login',
  admin: '/superadmin/login',
  default: '/login',
};
