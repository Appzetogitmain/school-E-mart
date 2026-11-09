import { useChildInfo } from '../utils/parentContext';
import { normalizeGradeLabel } from '../utils/gradeLabel';

// The class products should be filtered for: the active child's class (or the class a
// shopper picked on "Select Grade"), as the exact grade tag vendors use ("Nursery", "UKG",
// "Class 5"...). Undefined for guests and for classes that are not one of those tags, in
// which case callers must not filter by grade.
export const useChildGrade = () => {
  const childInfo = useChildInfo();
  return normalizeGradeLabel(childInfo?.grade);
};
