import { getMyTeacherProfile } from '../services/schoolApi';
import { listCourses, createCourse } from '../services/lmsApi';
import { parseClassGrade, normalizeGrade } from './mappers/teacherMapper';

export const gradeToScore = (grade) => {
  const letterMap = { 'A+': 95, A: 90, 'B+': 85, B: 80, C: 70, D: 60, F: 40 };
  if (letterMap[grade]) return letterMap[grade];
  const num = Number(grade);
  return Number.isFinite(num) ? num : 80;
};

export const resolveTeacherProfile = async (schoolId) => {
  if (!schoolId) return null;
  try {
    return await getMyTeacherProfile(schoolId);
  } catch {
    return null;
  }
};

const sameSubject = (a, b) =>
  String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

export const ensureCourse = async (
  schoolId,
  { classGrade, subject, instructorName, instructorUserId }
) => {
  const grade = parseClassGrade(classGrade);
  const matches = (item) =>
    normalizeGrade(item?.gradeClass) === normalizeGrade(grade) &&
    sameSubject(item?.subject, subject);

  try {
    const { data: courses } = await listCourses(schoolId, { limit: 100 });
    const existing = (courses || []).find(matches);
    if (existing) return existing;

    return await createCourse(schoolId, {
      title: `${subject} - ${grade}`,
      subject,
      gradeClass: grade,
      status: 'published',
      targetAudience: 'students',
      ...(instructorName ? { instructorName } : {}),
      ...(instructorUserId ? { instructorUserId } : {}),
    });
  } catch {
    return null;
  }
};
