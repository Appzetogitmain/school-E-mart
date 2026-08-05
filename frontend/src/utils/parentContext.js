import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';

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
// Returns null while nothing is loaded yet — callers should treat that as
// "still loading" and render a skeleton, never a hardcoded placeholder name.
export const useChildInfo = () => {
  const authUser = useAuthStore((state) => state.user);
  // Forces a re-render on the same-tab 'storage' broadcast; the actual value
  // is read fresh below on every render (cheap — a small JSON.parse), so it
  // also stays current whenever `authUser` changes without a second effect.
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleUpdate = () => forceUpdate((n) => n + 1);
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const stored = getChildInfoFromStorage();
  if (!stored) return null;

  return {
    ...stored,
    studentId: stored.studentId || authUser?.profile?.studentId || authUser?.childProfile?.studentId,
    schoolId: stored.schoolId || authUser?.tenantSchoolId,
  };
};
