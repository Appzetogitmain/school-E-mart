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

// --- School finance: kit-commission earnings + withdrawals ---
export const getSchoolFinanceSummary = async (schoolId) => {
  const response = await apiClient.get(schoolPath(schoolId, '/finance/summary'));
  return unwrapData(response)?.summary;
};

export const listSchoolFinanceTransactions = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/finance/transactions'), { params });
  return extractPaginated(response, 'transactions');
};

export const getSchoolBank = async (schoolId) => {
  const response = await apiClient.get(schoolPath(schoolId, '/finance/bank'));
  return unwrapData(response)?.bank;
};

export const updateSchoolBank = async (schoolId, payload) => {
  const response = await apiClient.put(schoolPath(schoolId, '/finance/bank'), payload);
  return unwrapData(response)?.bank;
};

export const listSchoolPayouts = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/finance/payouts'), { params });
  return extractPaginated(response, 'payouts');
};

export const createSchoolPayout = async (schoolId, amountPaise) => {
  const response = await apiClient.post(schoolPath(schoolId, '/finance/payouts'), { amountPaise });
  return unwrapData(response)?.payout;
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

// Teacher ↔ class/section/subject assignments (Class & Teacher Assignments page)
export const listTeacherAssignments = async (schoolId) => {
  const response = await apiClient.get(schoolPath(schoolId, '/teacher-assignments'));
  return unwrapData(response)?.assignments || [];
};

export const upsertTeacherAssignment = async (schoolId, teacherProfileId, payload) => {
  const response = await apiClient.put(
    schoolPath(schoolId, `/teachers/${teacherProfileId}/assignments`),
    payload
  );
  return unwrapData(response)?.assignments || [];
};

export const removeTeacherAssignment = async (schoolId, teacherProfileId, { classGrade, section }) => {
  const response = await apiClient.delete(
    schoolPath(schoolId, `/teachers/${teacherProfileId}/assignments`),
    { params: { classGrade, section } }
  );
  return unwrapData(response)?.assignments || [];
};

export const listSubjects = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/subjects'), { params });
  return extractPaginated(response, 'subjects');
};

export const createSubject = async (schoolId, payload) => {
  const response = await apiClient.post(schoolPath(schoolId, '/subjects'), payload);
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
  const data = unwrapData(response);
  // `skipped` carries students the server refused to mark (moved class, deactivated).
  // Callers must surface it — the request still succeeds.
  return { records: data?.records || [], skipped: data?.skipped || [] };
};

export const getMonthlyAttendanceSummary = async (schoolId, params) => {
  const response = await apiClient.get(schoolPath(schoolId, '/attendance/summary/monthly'), { params });
  return unwrapData(response)?.summary;
};

export const getAttendanceHistory = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/attendance/history'), { params });
  const data = unwrapData(response);
  return { data: data?.records || [], pagination: data?.pagination || null };
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

export const listVendors = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/vendors'), { params });
  return extractPaginated(response, 'vendors');
};

// Events
export const createEvent = async (schoolId, payload) => {
  const response = await apiClient.post(schoolPath(schoolId, '/events'), payload);
  return unwrapData(response)?.event;
};

export const listEvents = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/events'), { params });
  return extractPaginated(response, 'events');
};

export const getEvent = async (schoolId, eventId) => {
  const response = await apiClient.get(schoolPath(schoolId, `/events/${eventId}`));
  return unwrapData(response)?.event;
};

export const updateEvent = async (schoolId, eventId, payload) => {
  const response = await apiClient.patch(schoolPath(schoolId, `/events/${eventId}`), payload);
  return unwrapData(response)?.event;
};

export const deleteEvent = async (schoolId, eventId) => {
  await apiClient.delete(schoolPath(schoolId, `/events/${eventId}`));
};

// Phonebook
export const listPhonebook = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/phonebook'), { params });
  return unwrapData(response)?.entries || [];
};

// Parent-facing: relevant teachers (by child class/section) + emergency numbers
export const listPhonebookContacts = async (schoolId, studentId) => {
  const response = await apiClient.get(schoolPath(schoolId, '/phonebook/contacts'), {
    params: studentId ? { studentId } : {},
  });
  const data = unwrapData(response) || {};
  return {
    teachers: data.teachers || [],
    emergency: data.emergency || [],
    general: data.general || [],
  };
};

export const createPhonebookEntry = async (schoolId, payload) => {
  const response = await apiClient.post(schoolPath(schoolId, '/phonebook'), payload);
  return unwrapData(response)?.entry;
};

export const updatePhonebookEntry = async (schoolId, entryId, payload) => {
  const response = await apiClient.patch(schoolPath(schoolId, `/phonebook/${entryId}`), payload);
  return unwrapData(response)?.entry;
};

export const deletePhonebookEntry = async (schoolId, entryId) => {
  await apiClient.delete(schoolPath(schoolId, `/phonebook/${entryId}`));
};

// Kits
export const listKitCategories = async (schoolId) => {
  const response = await apiClient.get(schoolPath(schoolId, '/kit-categories'));
  return unwrapData(response) || { defaults: [], custom: [], all: [] };
};

export const createKitCategory = async (schoolId, name) => {
  const response = await apiClient.post(schoolPath(schoolId, '/kit-categories'), { name });
  return unwrapData(response)?.category;
};

export const deleteKitCategory = async (schoolId, categoryId) => {
  const response = await apiClient.delete(schoolPath(schoolId, `/kit-categories/${categoryId}`));
  return unwrapData(response);
};

export const listMasterKitProductsForSchool = async (params = {}) => {
  const response = await apiClient.get('/admin/kit-products', { params });
  return extractPaginated(response, 'products');
};

export const createKit = async (schoolId, payload) => {
  const response = await apiClient.post(schoolPath(schoolId, '/kits'), payload);
  return unwrapData(response)?.kit;
};

export const listKits = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/kits'), { params });
  return extractPaginated(response, 'kits');
};

export const getKit = async (schoolId, kitId) => {
  const response = await apiClient.get(schoolPath(schoolId, `/kits/${kitId}`));
  return unwrapData(response)?.kit;
};

export const updateKit = async (schoolId, kitId, payload) => {
  const response = await apiClient.patch(schoolPath(schoolId, `/kits/${kitId}`), payload);
  return unwrapData(response)?.kit;
};

export const deleteKit = async (schoolId, kitId) => {
  await apiClient.delete(schoolPath(schoolId, `/kits/${kitId}`));
};

// Parent Management APIs (parents are created automatically via student
// enrollment — see registerStudent's parentName/parentPhone fields)
export const listParents = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolPath(schoolId, '/parents'), { params });
  return extractPaginated(response, 'parents');
};

export const updateParent = async (schoolId, parentId, payload) => {
  const response = await apiClient.patch(schoolPath(schoolId, `/parents/${parentId}`), payload);
  return unwrapData(response)?.parent;
};

export const deleteParent = async (schoolId, parentId) => {
  const response = await apiClient.delete(schoolPath(schoolId, `/parents/${parentId}`));
  return unwrapData(response);
};

export const resendParentWelcome = async (schoolId, parentId) => {
  const response = await apiClient.post(
    schoolPath(schoolId, `/parents/${parentId}/resend-welcome`)
  );
  return unwrapData(response);
};

export const resendParentWelcomeBulk = async (schoolId, parentIds) => {
  const response = await apiClient.post(schoolPath(schoolId, '/parents/resend-welcome'), {
    parentIds,
  });
  return unwrapData(response);
};

// Teacher Direct Creation API
export const createTeacher = async (schoolId, payload) => {
  const response = await apiClient.post(schoolPath(schoolId, '/teachers'), payload);
  return unwrapData(response);
};

export const deleteTeacher = async (schoolId, teacherId) => {
  const response = await apiClient.delete(schoolPath(schoolId, `/teachers/${teacherId}`));
  return unwrapData(response);
};

export const uploadSchoolFile = async (schoolId, file, purpose = 'kit_image') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);
  const response = await apiClient.post(schoolPath(schoolId, '/uploads'), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrapData(response)?.attachment;
};

export const updateClass = async (schoolId, classGrade, payload) => {
  const response = await apiClient.patch(
    schoolPath(schoolId, `/classes/${encodeURIComponent(classGrade)}`),
    payload
  );
  return unwrapData(response)?.school;
};

export const deleteClass = async (schoolId, classGrade) => {
  const response = await apiClient.delete(
    schoolPath(schoolId, `/classes/${encodeURIComponent(classGrade)}`)
  );
  return unwrapData(response)?.school;
};

export const updateSection = async (schoolId, classGrade, section, newSection) => {
  const response = await apiClient.patch(
    schoolPath(
      schoolId,
      `/classes/${encodeURIComponent(classGrade)}/sections/${encodeURIComponent(section)}`
    ),
    { newSection }
  );
  return unwrapData(response)?.school;
};

export const deleteSection = async (schoolId, classGrade, section) => {
  const response = await apiClient.delete(
    schoolPath(
      schoolId,
      `/classes/${encodeURIComponent(classGrade)}/sections/${encodeURIComponent(section)}`
    )
  );
  return unwrapData(response)?.school;
};
