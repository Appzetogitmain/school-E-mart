import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

const schoolPath = (schoolId, suffix = '') => `/schools/${schoolId}${suffix}`;

const extractPaginated = (response, key) => {
  const { data, pagination } = response.data;
  return {
    data: data?.[key] || [],
    pagination: pagination || null,
  };
};

export const listSchools = async (params = {}) => {
  const response = await apiClient.get('/schools', { params });
  return extractPaginated(response, 'schools');
};

export const getSchool = async (schoolId) => {
  const response = await apiClient.get(schoolPath(schoolId));
  return unwrapData(response)?.school;
};

export const updateSchool = async (schoolId, payload) => {
  const response = await apiClient.patch(schoolPath(schoolId), payload);
  return unwrapData(response)?.school;
};

export const listStudents = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/students'), { params });
  return extractPaginated(response, 'students');
};

export const registerStudent = async (schoolId, payload) => {
  const response = await apiClient.post(schoolPath(schoolId, '/students'), payload);
  return unwrapData(response)?.student;
};

export const updateStudent = async (schoolId, studentId, payload) => {
  const response = await apiClient.patch(schoolPath(schoolId, `/students/${studentId}`), payload);
  return unwrapData(response)?.student;
};

export const updateStudentStatus = async (schoolId, studentId, status) => {
  const response = await apiClient.patch(schoolPath(schoolId, `/students/${studentId}/status`), {
    status,
  });
  return unwrapData(response)?.student;
};

export const deleteStudent = async (schoolId, studentId) => {
  const response = await apiClient.delete(schoolPath(schoolId, `/students/${studentId}`));
  return unwrapData(response);
};

export const listTeachers = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/teachers'), { params });
  return extractPaginated(response, 'teachers');
};

export const getMyTeacherProfile = async (schoolId) => {
  const response = await apiClient.get(schoolPath(schoolId, '/teachers/me'));
  return unwrapData(response)?.teacher;
};

export const setTeacherStatus = async (schoolId, teacherId, payload) => {
  const response = await apiClient.patch(
    schoolPath(schoolId, `/teachers/${teacherId}/status`),
    payload
  );
  return unwrapData(response)?.teacher;
};

export const listClasses = async (schoolId) => {
  const response = await apiClient.get(schoolPath(schoolId, '/classes'));
  return unwrapData(response)?.classes || [];
};

export const createClass = async (schoolId, payload) => {
  const response = await apiClient.post(schoolPath(schoolId, '/classes'), payload);
  return unwrapData(response)?.school;
};

export const createSection = async (schoolId, classGrade, section) => {
  const response = await apiClient.post(
    schoolPath(schoolId, `/classes/${encodeURIComponent(classGrade)}/sections`),
    { section }
  );
  return unwrapData(response)?.school;
};

export const assignClassTeacher = async (schoolId, classGrade, payload) => {
  const response = await apiClient.post(
    schoolPath(schoolId, `/classes/${encodeURIComponent(classGrade)}/class-teacher`),
    payload
  );
  return unwrapData(response);
};

export const getTeacher = async (schoolId, teacherId) => {
  const response = await apiClient.get(schoolPath(schoolId, `/teachers/${teacherId}`));
  return unwrapData(response)?.teacher;
};

export const updateTeacher = async (schoolId, teacherId, payload) => {
  const response = await apiClient.patch(schoolPath(schoolId, `/teachers/${teacherId}`), payload);
  return unwrapData(response)?.teacher;
};

export const getDailyAttendance = async (schoolId, params) => {
  const response = await apiClient.get(schoolPath(schoolId, '/attendance/daily'), { params });
  return unwrapData(response)?.attendance || [];
};

export const markAttendance = async (schoolId, payload) => {
  const response = await apiClient.post(schoolPath(schoolId, '/attendance'), payload);
  return unwrapData(response)?.records || [];
};

export const getMonthlyAttendanceSummary = async (schoolId, params) => {
  const response = await apiClient.get(schoolPath(schoolId, '/attendance/summary/monthly'), { params });
  return unwrapData(response)?.summary;
};

export const createNotice = async (schoolId, payload) => {
  const response = await apiClient.post(schoolPath(schoolId, '/notices'), payload);
  return unwrapData(response)?.notice;
};

export const listNotices = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/notices'), { params });
  return extractPaginated(response, 'notices');
};

export const createDiaryEntry = async (schoolId, payload) => {
  const response = await apiClient.post(schoolPath(schoolId, '/diary'), payload);
  return unwrapData(response)?.entry;
};

export const listDiaryEntries = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/diary'), { params });
  return extractPaginated(response, 'entries');
};

export const markDiaryRead = async (schoolId, entryId, params = {}) => {
  const response = await apiClient.patch(schoolPath(schoolId, `/diary/${entryId}/read`), null, { params });
  return unwrapData(response)?.entry;
};
