import useAuthStore from '../store/useAuthStore';

export const getMarketplaceAudience = () => {
  const { user, portal } = useAuthStore.getState();
  const role = user?.role || portal;

  if (role === 'school') return 'school';
  return 'parent';
};

export const canSyncMarketplaceCart = () => {
  const { isAuthenticated, user, portal } = useAuthStore.getState();
  if (!isAuthenticated) return false;

  const role = user?.role || portal;
  return role === 'parent' || role === 'school';
};
