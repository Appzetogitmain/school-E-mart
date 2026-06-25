import apiClient from './apiClient';
import { listCourses, listAssignments, submitAssignment, getMySubmission } from './lmsApi';
import { parseClassGrade } from '../utils/mappers/teacherMapper';

const extractRecords = (response) => response.data?.data?.records || [];

export const getAttendanceHistory = async (schoolId, params = {}) => {
  const response = await apiClient.get(`/schools/${schoolId}/attendance/history`, { params });
  return {
    data: extractRecords(response),
    pagination: response.data?.pagination || null,
  };
};

export const fetchParentHomework = async (schoolId, gradeLabel, studentId) => {
  const classGrade = parseClassGrade(gradeLabel || '');
  const { data: courses } = await listCourses(schoolId, { limit: 50 });

  const matchingCourses = (courses || []).filter(
    (course) =>
      course.status === 'published' &&
      (course.gradeClass === classGrade ||
        course.title?.includes(classGrade) ||
        !classGrade)
  );

  const assignments = [];
  for (const course of matchingCourses) {
    const courseId = course._id || course.id;
    const { data: rows } = await listAssignments(schoolId, courseId, {
      limit: 50,
      status: 'published',
    });
    for (const assignment of rows || []) {
      const assignmentId = assignment._id || assignment.id;
      let submission = null;
      if (studentId) {
        try {
          submission = await getMySubmission(schoolId, courseId, assignmentId, { studentId });
        } catch {
          submission = null;
        }
      }
      assignments.push({ assignment, course, submission });
    }
  }

  return assignments;
};

export const listParentNotices = async (schoolId, params = {}) => {
  const response = await apiClient.get(`/schools/${schoolId}/notices`, { params });
  const { data, pagination } = response.data;
  return { data: data?.notices || [], pagination: pagination || null };
};

export const listParentDiary = async (schoolId, params = {}) => {
  const response = await apiClient.get(`/schools/${schoolId}/diary`, { params });
  const { data, pagination } = response.data;
  return { data: data?.entries || [], pagination: pagination || null };
};

export const markParentDiaryRead = async (schoolId, entryId, params = {}) => {
  const response = await apiClient.patch(`/schools/${schoolId}/diary/${entryId}/read`, null, { params });
  return response.data?.data?.entry;
};

export const submitHomework = async (schoolId, courseId, assignmentId, payload) =>
  submitAssignment(schoolId, courseId, assignmentId, payload);
