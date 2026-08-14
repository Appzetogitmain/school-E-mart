import { getMyTeacherProfile } from '../services/schoolApi';
import { listCourses, createCourse, updateCourse } from '../services/lmsApi';
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

  // Match on grade + subject only. Sections share a course; the section a piece of
  // homework targets is recorded on the assignment itself.
  //
  // Platform courses (`schoolId: null`) are excluded deliberately. They belong to the
  // catalogue, not to this school, and homework filed under one used to disappear from
  // every parent's feed while still showing in the teacher's own list. Grade is
  // compared normalized because "5" and "Class 5" are the same class.
  const matches = (item) =>
    item?.schoolId &&
    String(item.schoolId) === String(schoolId) &&
    normalizeGrade(item.gradeClass) === normalizeGrade(grade) &&
    sameSubject(item.subject, subject);

  // Walked page by page rather than in one oversized request: the API caps `limit` at
  // 100, and a school with more courses than that used to silently miss its own course
  // and create a duplicate every time homework was set.
  let course = null;
  for (let page = 1; page <= 10 && !course; page += 1) {
    const { data: courses, pagination } = await listCourses(schoolId, { page, limit: 100 });
    course = (courses || []).find(matches) || null;
    const totalPages = pagination?.totalPages ?? pagination?.pages ?? null;
    if (!courses?.length || (totalPages !== null && page >= totalPages)) break;
  }

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
  } else if (course.status !== 'published') {
    // A course left in draft by whoever created it first must not keep this class's
    // homework out of the parents' hands.
    try {
      const updated = await updateCourse(schoolId, course._id || course.id, {
        status: 'published',
        ...(instructorName && !course.instructorName ? { instructorName } : {}),
        ...(instructorUserId && !course.instructorUserId ? { instructorUserId } : {}),
      });
      if (updated) course = updated;
    } catch {
      // Non-fatal: the homework feed no longer depends on the course's status.
    }
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
