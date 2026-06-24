import useAuthStore from '../store/useAuthStore';

export const getSchoolIdFromStorage = () => {
  try {
    const raw = localStorage.getItem('childInfo');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.schoolId || null;
  } catch {
    return null;
  }
};

export const useSchoolId = () => {
  const tenantSchoolId = useAuthStore((state) => state.user?.tenantSchoolId);
  return tenantSchoolId || getSchoolIdFromStorage();
};
