import useAuthStore from '../store/useAuthStore';

export const getSchoolIdFromStorage = () => {
  try {
    const raw = localStorage.getItem('childInfo');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // childInfo is shared with the parent portal; only trust it for school
    // pages when it was written by a school login
    if (parsed.role && parsed.role !== 'school') return null;
    return parsed.schoolId || null;
  } catch {
    return null;
  }
};

export const useSchoolId = () => {
  const tenantSchoolId = useAuthStore((state) => state.user?.tenantSchoolId);
  return tenantSchoolId || getSchoolIdFromStorage();
};
