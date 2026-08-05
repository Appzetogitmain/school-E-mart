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

export const updateCourse = async (schoolId, courseId, payload) => {
  const response = await apiClient.patch(lmsPath(schoolId, `/courses/${courseId}`), payload);
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

export const updateAssignment = async (schoolId, courseId, assignmentId, payload) => {
  const response = await apiClient.patch(
    lmsPath(schoolId, `/courses/${courseId}/assignments/${assignmentId}`),
    payload
  );
  return unwrapData(response)?.assignment;
};

export const deleteAssignment = async (schoolId, courseId, assignmentId) => {
  const response = await apiClient.delete(
    lmsPath(schoolId, `/courses/${courseId}/assignments/${assignmentId}`)
  );
  return unwrapData(response);
};

export const submitAssignment = async (schoolId, courseId, assignmentId, payload) => {
  const response = await apiClient.post(
    lmsPath(schoolId, `/courses/${courseId}/assignments/${assignmentId}/submissions`),
    payload
  );
  return unwrapData(response)?.submission;
};

export const listSubmissions = async (schoolId, courseId, assignmentId, params = {}) => {
  const response = await apiClient.get(
    lmsPath(schoolId, `/courses/${courseId}/assignments/${assignmentId}/submissions`),
    { params }
  );
  return extractPaginated(response, 'submissions');
};

export const getMySubmission = async (schoolId, courseId, assignmentId, params = {}) => {
  const response = await apiClient.get(
    lmsPath(schoolId, `/courses/${courseId}/assignments/${assignmentId}/submissions/mine`),
    { params }
  );
  return unwrapData(response)?.submission || null;
};

export const evaluateSubmission = async (schoolId, courseId, assignmentId, submissionId, payload) => {
  const response = await apiClient.patch(
    lmsPath(schoolId, `/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/evaluate`),
    payload
  );
  return unwrapData(response)?.submission;
};

export const returnSubmission = async (schoolId, courseId, assignmentId, submissionId, payload) => {
  const response = await apiClient.patch(
    lmsPath(schoolId, `/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/return`),
    payload
  );
  return unwrapData(response)?.submission;
};

/**
 * Every student the homework was set for, each with their submission or null.
 * Server-side join, so names and roll numbers are always resolved and no student is
 * lost to a page limit.
 */
export const getSubmissionRoster = async (schoolId, courseId, assignmentId) => {
  const response = await apiClient.get(
    lmsPath(schoolId, `/courses/${courseId}/assignments/${assignmentId}/roster`)
  );
  const data = unwrapData(response);
  return { assignment: data?.assignment || null, roster: data?.roster || [] };
};

/** All published homework for one student, already filtered to their class AND section. */
export const getStudentHomework = async (schoolId, params = {}) => {
  const response = await apiClient.get(lmsPath(schoolId, '/homework'), { params });
  return unwrapData(response)?.homework || [];
};

/**
 * Submitted work is not public. It is fetched through an authorized endpoint, so the
 * browser must send credentials rather than pointing an <img> at a static path.
 */
export const fetchSubmissionAttachment = async (schoolId, attachmentId) => {
  const response = await apiClient.get(
    lmsPath(schoolId, `/submission-attachments/${attachmentId}`),
    { responseType: 'blob' }
  );
  return URL.createObjectURL(response.data);
};

export const getLearningHistory = async (schoolId, params = {}) => {
  const response = await apiClient.get(lmsPath(schoolId, '/learning-history'), { params });
  return extractPaginated(response, 'history');
};

export const getResumeBookmark = async (schoolId, params = {}) => {
  const response = await apiClient.get(lmsPath(schoolId, '/bookmarks/resume'), { params });
  return unwrapData(response)?.bookmark || null;
};

export const listLessons = async (schoolId, courseId, params = {}) => {
  const response = await apiClient.get(lmsPath(schoolId, `/courses/${courseId}/lessons`), { params });
  return extractPaginated(response, 'lessons');
};

export const getCourseProgress = async (schoolId, courseId, params = {}) => {
  const response = await apiClient.get(lmsPath(schoolId, `/courses/${courseId}/progress`), { params });
  return unwrapData(response)?.progress || null;
};

/**
 * Record how far a learner got through a lesson. progressPercent is required by
 * the server; pass 100 to complete it.
 */
export const updateLessonProgress = async (schoolId, courseId, lessonId, payload) => {
  const response = await apiClient.post(
    lmsPath(schoolId, `/courses/${courseId}/lessons/${lessonId}/progress`),
    payload
  );
  return unwrapData(response)?.progress || null;
};
