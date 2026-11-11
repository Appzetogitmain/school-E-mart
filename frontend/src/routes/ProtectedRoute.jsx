import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { ROUTES } from '../constants/routes';

export const ProtectedRoute = ({ redirectTo = ROUTES.LOGIN }) => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export const RoleRoute = ({ allowedRoles, redirectTo }) => {
  const { user, isAuthenticated, token, _hasHydrated, portalSessions } = useAuthStore();

  if (!_hasHydrated) {
    return null;
  }

  // Check portal-specific session first (e.g. admin session for /superadmin routes)
  const isCheckingAdmin = allowedRoles?.some(r => ['admin', 'super_admin'].includes(String(r).toLowerCase()));
  const isCheckingVendor = allowedRoles?.some(r => ['vendor'].includes(String(r).toLowerCase()));
  const isCheckingSchool = allowedRoles?.some(r => ['school', 'school_admin'].includes(String(r).toLowerCase()));
  const isCheckingTeacher = allowedRoles?.some(r => ['teacher'].includes(String(r).toLowerCase()));

  let effectiveUser = user;
  let effectiveToken = token;
  let effectiveIsAuth = isAuthenticated;

  // A portal route is only unlocked by that portal's OWN session. It must not fall back
  // to the global user (which may belong to another portal): the page would open but every
  // API call would carry the wrong token and fail with 403 "no permission".
  const portalKey = isCheckingAdmin ? 'admin'
    : isCheckingVendor ? 'vendor'
    : isCheckingSchool ? 'school'
    : isCheckingTeacher ? 'teacher'
    : null;

  if (portalKey) {
    const session = portalSessions?.[portalKey];
    effectiveUser = session?.user ?? null;
    effectiveToken = session?.token ?? null;
    effectiveIsAuth = Boolean(session?.token);
  }

  if (!effectiveIsAuth || !effectiveToken) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    if (allowedRoles?.includes('vendor')) {
      return <Navigate to="/vendor/login" replace />;
    }
    if (allowedRoles?.includes('admin')) {
      return <Navigate to={ROUTES.SUPER_ADMIN.LOGIN} replace />;
    }
    return <Navigate to="/user/login" replace />;
  }

  const normalizedAllowed = (allowedRoles || []).map(r => String(r).toLowerCase());
  if (normalizedAllowed.includes('parent') && !normalizedAllowed.includes('user')) {
    normalizedAllowed.push('user');
  }

  const userRole = String(effectiveUser?.role || '').toLowerCase();

  if (!effectiveUser || (!normalizedAllowed.includes(userRole) && userRole !== 'super_admin')) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    if (allowedRoles?.includes('vendor')) {
      return <Navigate to="/vendor/login" replace />;
    }
    if (allowedRoles?.includes('admin')) {
      return <Navigate to={ROUTES.SUPER_ADMIN.LOGIN} replace />;
    }
    return <Navigate to="/user/login" replace />;
  }

  return <Outlet />;
};
