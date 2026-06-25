import useAuthStore from '../store/useAuthStore';

export const getChildInfoFromStorage = () => {
  try {
    const raw = localStorage.getItem('childInfo');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useChildInfo = () => {
  const authUser = useAuthStore((state) => state.user);
  const stored = getChildInfoFromStorage();

  if (!stored) return null;

  return {
    ...stored,
    studentId: stored.studentId || authUser?.profile?.studentId || authUser?.childProfile?.studentId,
    schoolId: stored.schoolId || authUser?.tenantSchoolId,
  };
};
