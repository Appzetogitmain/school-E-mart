import { toAbsoluteUrl } from '../url.js';

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

  // Check if existing cache belongs to a different user session
  const normPhone = normalized?.phone ? String(normalized.phone).replace(/\D/g, '') : '';
  const existPhone = existing?.phone ? String(existing.phone).replace(/\D/g, '') : '';
  const isDifferentUser = Boolean(
    (existPhone && normPhone && existPhone !== normPhone) ||
    (existing?.userId && normalized?.id && String(existing.userId) !== String(normalized.id))
  );
  const baseExisting = isDifferentUser ? {} : (existing || {});

  const role =
    normalized?.role === 'school'
      ? 'school'
      : normalized?.role === 'teacher'
        ? 'teacher'
        : baseExisting.role || 'parent';

  // A linked parent shows the STUDENT name; an unlinked/guest customer (no
  // child) shows their own name. Never let a LINKED parent fall back to the
  // parent's own user.name (that was the "parent name shown instead of student"
  // bug) — /auth/me now always includes childProfile for linked parents.
  const hasChild = Boolean(childProfile && childProfile.name);
  const displayName =
    role === 'parent'
      ? hasChild
        ? childProfile.name
        : normalized?.name || baseExisting.name || (user ? 'Customer' : 'Guest')
      : childProfile.name || normalized?.name || baseExisting.name || 'Guest';

  // If the user is an unlinked parent/customer (no child linked in backend),
  // NEVER inherit student-specific properties (photo, grade, rollNo, studentId, schoolRefNo)
  // from stale localStorage cache (e.g. from previous student sessions).
  if (role === 'parent' && !hasChild) {
    return {
      userId: normalized?.id || baseExisting.userId || null,
      name: displayName,
      role: 'parent',
      phone: normalized?.phone || baseExisting.phone || '',
      email: normalized?.email || baseExisting.email || '',
      refId: normalized?.refId || baseExisting.refId,
      school: profile.schoolName || profile.school?.name || profile.storeName || (baseExisting.school && !baseExisting.studentId ? baseExisting.school : 'Explore Schools'),
      schoolLogo: toAbsoluteUrl(profile.schoolLogo || profile.school?.logoUrl) || (baseExisting.schoolLogo && !baseExisting.studentId ? baseExisting.schoolLogo : ''),
      grade: profile.grade || (baseExisting.grade && !baseExisting.studentId ? baseExisting.grade : 'Select Grade'),
      schoolId: normalized?.tenantSchoolId || profile.schoolId || (baseExisting.schoolId && !baseExisting.studentId ? baseExisting.schoolId : null),
      schoolRefNo: null,
      rollNo: null,
      studentId: null,
      altPhone: profile.altPhone || baseExisting.altPhone || '',
      address: profile.address || baseExisting.address || '',
      pinCode: profile.pinCode || baseExisting.pinCode || '',
      city: profile.city || baseExisting.city || '',
      state: profile.state || baseExisting.state || '',
      country: profile.country || baseExisting.country || 'India',
      photo: toAbsoluteUrl(profile.avatarUrl) || '',
      progress: undefined,
    };
  }

  return {
    ...baseExisting,
    userId: normalized?.id || baseExisting.userId || null,
    name: displayName,
    role,
    phone: normalized?.phone || baseExisting.phone || '',
    email: normalized?.email || baseExisting.email || '',
    refId: normalized?.refId || baseExisting.refId,
    school: childProfile.schoolName || profile.schoolName || profile.school?.name || baseExisting.school || profile.storeName || 'Explore Schools',
    schoolLogo: toAbsoluteUrl(childProfile.schoolLogo || profile.schoolLogo || profile.school?.logoUrl) || baseExisting.schoolLogo || '',
    grade: childProfile.grade || baseExisting.grade || profile.grade || 'Select Grade',
    schoolId: childProfile.schoolId || normalized?.tenantSchoolId || profile.schoolId || baseExisting.schoolId,
    schoolRefNo: childProfile.schoolRefNo || baseExisting.schoolRefNo || null,
    rollNo: childProfile.rollNo || baseExisting.rollNo || null,
    studentId: childProfile.studentId || baseExisting.studentId || null,
    altPhone: profile.altPhone || baseExisting.altPhone || '',
    address: profile.address || baseExisting.address || '',
    pinCode: profile.pinCode || baseExisting.pinCode || '',
    city: profile.city || baseExisting.city || '',
    state: profile.state || baseExisting.state || '',
    country: profile.country || baseExisting.country || 'India',
    photo: toAbsoluteUrl(childProfile.avatarUrl || childProfile.photo || profile.avatarUrl) || baseExisting.photo || '',
    progress: baseExisting.progress,
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
