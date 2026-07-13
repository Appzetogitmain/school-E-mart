import { getMyTeacherProfile } from '../services/schoolApi';
import { listCourses, createCourse, updateCourse } from '../services/lmsApi';
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

export const ensureCourse = async (
  schoolId,
  { classGrade, subject, instructorName, instructorUserId }
) => {
  const grade = parseClassGrade(classGrade);
  const { data: courses } = await listCourses(schoolId, { limit: 50 });

  // Match on grade + subject only. Sections share a course; the section a piece of
  // homework targets is recorded on the assignment itself.
  let course = (courses || []).find(
    (item) => item.gradeClass === grade && item.subject === subject
  );

  if (!course) {
    course = await createCourse(schoolId, {
      title: `${subject} - ${grade}`,
      subject,
      gradeClass: grade,
      status: 'published',
      targetAudience: 'students',
      ...(instructorName ? { instructorName } : {}),
      ...(instructorUserId ? { instructorUserId } : {}),
    });
  } else if (instructorName && !course.instructorName) {
    // Courses created before instructors were recorded have no name on them, which
    // left the parent's homework card showing a blank teacher. Backfill it once.
    try {
      const updated = await updateCourse(schoolId, course._id || course.id, {
        instructorName,
        ...(instructorUserId ? { instructorUserId } : {}),
      });
      if (updated) course = updated;
    } catch {
      // Non-fatal: the assignment still carries assignedByName.
    }
  }

  return course;
};
