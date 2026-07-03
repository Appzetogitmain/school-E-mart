import useAuthStore from '../store/useAuthStore';

/**
 * True once persisted auth state is restored and a bearer token is available.
 */
const useAuthReady = () => {
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return Boolean(hasHydrated && isAuthenticated && token);
};

export default useAuthReady;
