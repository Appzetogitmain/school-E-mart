import { useCallback, useEffect, useState } from 'react';
import { listKits, listPurchasedKitIds } from '../services/schoolApi';
import useAuthStore from '../store/useAuthStore';

// Same class-matching rule used everywhere a kit needs to be scoped to "this
// child's grade": numeric grades ("Class 5" vs "5th") compare by the number,
// non-numeric ones (Nursery, LKG, UKG, ...) compare by substring. A kit with
// no class set (or 'All'/'All Classes') always matches. Kept in one place so
// Home, My School, and the kit detail page can never quietly disagree on
// which kits count towards a child's readiness.
export const matchesStudentGrade = (kitClasses, studentGrade) => {
  const kGrade = String(kitClasses || '').toLowerCase().trim();
  const studentG = String(studentGrade || '').toLowerCase().trim();

  // If the kit is configured for 'All' / 'All Classes' or has no specific grade set, it applies to all students
  if (!kGrade || kGrade === 'all' || kGrade === 'all classes') return true;

  // If student grade is not selected yet, do not falsely claim grade-specific kits (Class 1, Class 2...) as required for 'Select Grade'
  if (!studentGrade || studentG === 'select grade') return false;

  const kitNum = kGrade.match(/\d+/)?.[0];
  const studentNum = studentG.match(/\d+/)?.[0];
  if (kitNum && studentNum) return kitNum === studentNum;

  return kGrade.includes(studentG) || studentG.includes(kGrade);
};

export const resolveParentSchoolId = (childInfo) => {
  let schoolId = childInfo?.schoolId;

  if (!schoolId || schoolId === 'explore-schools') {
    try {
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        schoolId = authUser.tenantSchoolId || authUser.schoolId || authUser.childProfile?.schoolId || schoolId;
      }
    } catch {
      // ignore
    }
  }

  if (!schoolId || schoolId === 'explore-schools') {
    try {
      const selected = localStorage.getItem('selectedSchool');
      if (selected) {
        const parsed = JSON.parse(selected);
        schoolId = parsed._id || parsed.id || schoolId;
      }
    } catch {
      // ignore
    }
  }

  return schoolId && schoolId !== 'explore-schools' ? schoolId : null;
};

/**
 * Shared data + math behind every "X of Y kits purchased" procurement
 * progress bar. Returns the kits matching the child's grade plus which of
 * them are already purchased; each page renders its own UI around it.
 *
 * Refetches on mount, whenever childInfo changes, and when the app regains
 * focus/visibility — a parent who completes a purchase in another tab (or
 * the payment gateway's own tab on mobile) and switches back should see an
 * up-to-date bar without needing to manually reload.
 */
export const useKitProcurementProgress = (childInfo, { isGuest = false } = {}) => {
  const schoolId = resolveParentSchoolId(childInfo);
  const grade = childInfo?.grade;

  const [kits, setKits] = useState([]);
  const [purchasedKitIds, setPurchasedKitIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!schoolId || isGuest) {
      setKits([]);
      setPurchasedKitIds(new Set());
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [kitsRes, purchasedIds] = await Promise.all([
        listKits(schoolId, { status: 'active', limit: 100 }),
        // Kit purchase status is best-effort — if it fails, still show the
        // kit list rather than blanking the whole card on a transient error.
        listPurchasedKitIds(schoolId).catch(() => []),
      ]);
      setKits(kitsRes?.data || []);
      setPurchasedKitIds(new Set((purchasedIds || []).map(String)));
    } catch {
      setKits([]);
      setPurchasedKitIds(new Set());
      setError('Unable to load kit purchase status');
    } finally {
      setLoading(false);
    }
  }, [schoolId, isGuest]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!schoolId || isGuest) return undefined;
    const handleVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', handleVisible);
    return () => {
      window.removeEventListener('focus', reload);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [schoolId, isGuest, reload]);

  const classKits = kits.filter((k) => matchesStudentGrade(k.classGrade, grade));
  const isPurchased = (kit) => purchasedKitIds.has(String(kit._id || kit.id));
  const totalKits = classKits.length;
  const purchasedCount = classKits.filter(isPurchased).length;
  const remainingCount = Math.max(0, totalKits - purchasedCount);
  const progressPercent = totalKits > 0 ? Math.round((purchasedCount / totalKits) * 100) : 0;

  return {
    schoolId,
    kits: classKits,
    purchasedKitIds,
    isPurchased,
    loading,
    error,
    reload,
    totalKits,
    purchasedCount,
    remainingCount,
    progressPercent,
  };
};
