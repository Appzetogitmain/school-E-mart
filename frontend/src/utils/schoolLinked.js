// A parent/customer is "school-linked" when they have a confirmed student at a
// real school. Unlinked shoppers (guest checkout customers) see pure e-commerce
// only — no attendance/homework/diary/school features.
export const isSchoolLinked = (childInfo) => {
  if (!childInfo) return false;
  const schoolId = childInfo.schoolId;
  return Boolean(schoolId && schoolId !== 'explore-schools' && childInfo.studentId);
};

export const readChildInfoRaw = () => {
  try {
    const raw = localStorage.getItem('childInfo');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
