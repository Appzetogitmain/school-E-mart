import apiClient from './apiClient';
import { submitAssignment, getStudentHomework } from './lmsApi';

const extractRecords = (response) => response.data?.data?.records || [];

export const getAttendanceHistory = async (schoolId, params = {}) => {
  const response = await apiClient.get(`/schools/${schoolId}/attendance/history`, { params });
  return {
    data: extractRecords(response),
    pagination: response.data?.pagination || null,
  };
};

/**
 * The server returns the child's homework already filtered to their class AND section,
 * with each submission joined on. Previously this walked every course and then every
 * assignment one request at a time, and — because it only ever filtered by grade — showed
 * a child the homework set for other sections.
 */
export const fetchParentHomework = async (schoolId, gradeLabel, studentId) =>
  getStudentHomework(schoolId, studentId ? { studentId } : {});

export const listParentNotices = async (schoolId, params = {}) => {
  const response = await apiClient.get(`/schools/${schoolId}/notices`, { params });
  const { data, pagination } = response.data;
  return { data: data?.notices || [], pagination: pagination || null };
};

export const acknowledgeParentNotice = async (schoolId, noticeId, params = {}) => {
  const response = await apiClient.post(
    `/schools/${schoolId}/notices/${noticeId}/acknowledge`,
    null,
    { params }
  );
  return response.data?.data;
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

export const getMyProfile = async () => {
  const response = await apiClient.get('/users/me');
  return response.data?.data;
};

export const updateMyProfile = async (payload) => {
  const response = await apiClient.patch('/users/me', payload);
  return response.data?.data;
};

// Switch the active linked child. Returns the fresh profile (childProfile +
// children) so the caller can re-sync childInfo for the whole app.
export const setActiveChild = async (childProfileId) => {
  const response = await apiClient.post('/users/me/active-child', { childProfileId });
  return response.data?.data;
};
