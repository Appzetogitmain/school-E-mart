import useAuthStore from '../store/useAuthStore';
import { getSchoolIdFromStorage } from './schoolContext';

export const useTeacherSchoolId = () => {
  const tenantSchoolId = useAuthStore((state) => state.user?.tenantSchoolId);
  const profileSchoolId = useAuthStore((state) => state.user?.profile?.schoolId);
  return tenantSchoolId || profileSchoolId || getSchoolIdFromStorage();
};

export const useAuthUser = () => useAuthStore((state) => state.user);
