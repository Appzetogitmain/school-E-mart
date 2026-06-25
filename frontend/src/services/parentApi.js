import apiClient from './apiClient';
import { listCourses, listAssignments, submitAssignment } from './lmsApi';
import { parseClassGrade } from '../utils/mappers/teacherMapper';

const extractRecords = (response) => response.data?.data?.records || [];

export const getAttendanceHistory = async (schoolId, params = {}) => {
  const response = await apiClient.get(`/schools/${schoolId}/attendance/history`, { params });
  return {
    data: extractRecords(response),
    pagination: response.data?.pagination || null,
  };
};

export const fetchParentHomework = async (schoolId, gradeLabel) => {
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
    (rows || []).forEach((assignment) => {
      assignments.push({ assignment, course });
    });
  }

  return assignments;
};

export const submitHomework = async (schoolId, courseId, assignmentId, payload) =>
  submitAssignment(schoolId, courseId, assignmentId, payload);
