import { getMyTeacherProfile } from '../services/schoolApi';
import { listCourses, createCourse } from '../services/lmsApi';
import { parseClassGrade } from './mappers/teacherMapper';

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

export const ensureCourse = async (schoolId, { classGrade, section, subject }) => {
  const grade = parseClassGrade(classGrade);
  const { data: courses } = await listCourses(schoolId, { limit: 50 });
  let course = (courses || []).find(
    (item) =>
      item.gradeClass === grade &&
      (item.subject === subject || item.title?.includes(subject))
  );

  if (!course) {
    course = await createCourse(schoolId, {
      title: `${subject} - ${grade} ${section}`,
      subject,
      gradeClass: grade,
      status: 'published',
      targetAudience: 'students',
    });
  }

  return course;
};
