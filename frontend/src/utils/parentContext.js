import { useState, useEffect, useMemo } from 'react';
import useAuthStore from '../store/useAuthStore';
import { buildChildInfoFromUser } from './mappers/userMapper';

export const getChildInfoFromStorage = () => {
  try {
    const raw = localStorage.getItem('childInfo');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Single reactive source of truth for the shared `childInfo` identity
// (parent + school + teacher portals). Re-reads localStorage whenever:
//  - another tab writes it (native 'storage' event), or
//  - this tab writes it and manually dispatches `new Event('storage')`
//    (same-tab writes don't fire the native event — this is the app-wide
//    convention for broadcasting a childInfo update within one tab), or
//  - the authenticated user identity changes.
export const useChildInfo = () => {
  const authUser = useAuthStore((state) => state.user);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleUpdate = () => forceUpdate((n) => n + 1);
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const stored = getChildInfoFromStorage();
  const serializedStored = JSON.stringify(stored || {});
  const authUserKey = `${authUser?._id || ''}-${authUser?.updatedAt || ''}-${authUser?.tenantSchoolId || ''}-${authUser?.childProfile?.grade || ''}`;

  return useMemo(() => {
    if (!stored) {
      if (!authUser) return null;
      return buildChildInfoFromUser(authUser);
    }

    const resolvedGrade =
      stored.grade && stored.grade !== 'Select Grade'
        ? stored.grade
        : authUser?.childProfile?.grade || authUser?.profile?.grade || 'Select Grade';

    const resolvedSchoolId =
      stored.schoolId && stored.schoolId !== 'explore-schools'
        ? stored.schoolId
        : authUser?.childProfile?.schoolId || authUser?.tenantSchoolId || authUser?.schoolId || stored.schoolId;

    return {
      ...stored,
      grade: resolvedGrade,
      schoolId: resolvedSchoolId,
      studentId: stored.studentId || authUser?.profile?.studentId || authUser?.childProfile?.studentId,
    };
  }, [serializedStored, authUserKey]);
};
