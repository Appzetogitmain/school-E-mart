import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

const lmsPath = (schoolId, suffix = '') => `/schools/${schoolId}/lms${suffix}`;

const extractPaginated = (response, key) => {
  const { data, pagination } = response.data;
  return {
    data: data?.[key] || [],
    pagination: pagination || null,
  };
};

export const listCourses = async (schoolId, params = {}) => {
  const response = await apiClient.get(lmsPath(schoolId, '/courses'), { params });
  return extractPaginated(response, 'courses');
};

export const createCourse = async (schoolId, payload) => {
  const response = await apiClient.post(lmsPath(schoolId, '/courses'), payload);
  return unwrapData(response)?.course;
};

export const listAssignments = async (schoolId, courseId, params = {}) => {
  const response = await apiClient.get(lmsPath(schoolId, `/courses/${courseId}/assignments`), { params });
  return extractPaginated(response, 'assignments');
};

export const createAssignment = async (schoolId, courseId, payload) => {
  const response = await apiClient.post(lmsPath(schoolId, `/courses/${courseId}/assignments`), payload);
  return unwrapData(response)?.assignment;
};

export const listSubmissions = async (schoolId, courseId, assignmentId, params = {}) => {
  const response = await apiClient.get(
    lmsPath(schoolId, `/courses/${courseId}/assignments/${assignmentId}/submissions`),
    { params }
  );
  return extractPaginated(response, 'submissions');
};

export const evaluateSubmission = async (schoolId, courseId, assignmentId, submissionId, payload) => {
  const response = await apiClient.patch(
    lmsPath(schoolId, `/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/evaluate`),
    payload
  );
  return unwrapData(response)?.submission;
};
