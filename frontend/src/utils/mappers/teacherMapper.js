export const parseClassGrade = (label = '') => {
  const trimmed = String(label).trim();
  if (/^class\s+/i.test(trimmed)) return trimmed;
  if (/^\d+$/.test(trimmed)) return `Class ${trimmed}`;
  return trimmed;
};

export const parseSection = (label = '') =>
  String(label).replace(/^section\s*/i, '').trim().toUpperCase();

export const mapStudentForTeacherManage = (student) => ({
  id: student?._id?.toString?.() || student?.id,
  mongoId: student?._id?.toString?.() || student?.id,
  rollNo: student?.rollNo || '—',
  name: student?.name,
  parentName: '—',
  motherName: '—',
  phone: '—',
  gender: student?.gender === 'female' ? 'Female' : student?.gender === 'male' ? 'Male' : '—',
  dob: student?.dob ? new Date(student.dob).toISOString().slice(0, 10) : '',
  admissionNo: student?.schoolRefNo || student?._id?.toString?.()?.slice(-6) || '—',
  classGrade: student?.classGrade,
  section: student?.section,
  raw: student,
});

const UI_TO_API_STATUS = {
  P: 'present',
  A: 'absent',
  L: 'leave',
  Late: 'half_day',
};

const API_TO_UI_STATUS = {
  present: 'P',
  absent: 'A',
  leave: 'L',
  half_day: 'Late',
  holiday: 'L',
};

export const mapAttendanceRow = (row, index = 0) => ({
  roll: Number(row?.student?.rollNo) || index + 1,
  mongoId: row?.student?._id?.toString?.(),
  name: row?.student?.name || 'Student',
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row?.student?.name || 'S')}&background=3b2d7d&color=fff`,
  status: API_TO_UI_STATUS[row?.attendance?.status] || 'P',
  statusRaw: row?.attendance?.status || 'present',
  raw: row,
});

export const mapUiStatusToApi = (status) => UI_TO_API_STATUS[status] || 'present';

export const mapAssignmentForHomework = (assignment, course) => ({
  id: assignment?._id?.toString?.(),
  mongoId: assignment?._id?.toString?.(),
  courseId: course?._id?.toString?.() || course?.id,
  title: assignment?.title,
  subject: course?.subject || 'General',
  dateAssigned: assignment?.audit?.createdAt || assignment?.createdAt,
  dueDate: assignment?.dueDate,
  type: 'Written',
  maxScore: assignment?.maxScore ?? 100,
  raw: assignment,
});

export const mapSubmissionForCheck = (submission, studentLookup = {}) => {
  const student = submission?.student || studentLookup[submission?.studentId] || {};
  const graded = submission?.status === 'graded';
  const submitted = submission?.status === 'submitted' || graded;

  return {
    roll: Number(student?.rollNo) || 0,
    mongoId: submission?._id?.toString?.(),
    studentId: submission?.studentId?.toString?.(),
    name: student?.name || 'Student',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'S')}&background=3b2d7d&color=fff`,
    status: graded ? 'Checked' : submitted ? 'Submitted' : 'Not Submitted',
    submittedAt: submission?.submittedAt || null,
    files: [],
    grade: submission?.score != null ? String(submission.score) : '',
    remarks: submission?.feedback || '',
    raw: submission,
  };
};
