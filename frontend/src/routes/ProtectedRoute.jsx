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
  const { user, isAuthenticated, token, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return null;
  }

  if (!isAuthenticated || !token) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    if (allowedRoles?.includes('vendor')) {
      return <Navigate to="/vendor/login" replace />;
    }
    if (allowedRoles?.includes('admin')) {
      return <Navigate to={ROUTES.SUPER_ADMIN.LOGIN} replace />;
    }
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    if (allowedRoles.includes('vendor')) {
      return <Navigate to="/vendor/login" replace />;
    }
    if (allowedRoles.includes('admin')) {
      return <Navigate to={ROUTES.SUPER_ADMIN.LOGIN} replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
