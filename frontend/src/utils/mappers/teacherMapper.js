import { ENV } from '../../config/env';

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
  classGrade: assignment?.classGrade || course?.gradeClass || '',
  section: assignment?.section || '',
  dateAssigned: assignment?.assignedDate || assignment?.audit?.createdAt || assignment?.createdAt,
  dueDate: assignment?.dueDate,
  type: assignment?.homeworkType || 'Written',
  priority: assignment?.priority || null,
  maxScore: assignment?.maxScore ?? 100,
  raw: assignment,
});

// The teacher grades with letters but the API stores a numeric score, so map back
// to the nearest letter for display and to preselect the grade buttons.
const SCORE_TO_GRADE = [
  [95, 'A+'],
  [90, 'A'],
  [85, 'B+'],
  [80, 'B'],
  [70, 'C'],
  [60, 'D'],
];

export const scoreToGrade = (score) => {
  if (score == null) return '';
  const match = SCORE_TO_GRADE.find(([min]) => Number(score) >= min);
  return match ? match[1] : 'F';
};

// Submissions store server-relative paths like /uploads/homework-123.jpg. In dev the
// API_URL is just "/api/v1" and Vite proxies /uploads, so this resolves to a relative
// path; in prod it resolves against the API host.
const toAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const origin = ENV.API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  return `${origin}${url}`;
};

export const mapSubmissionForCheck = (submission, studentLookup = {}) => {
  const student = submission?.student || studentLookup[submission?.studentId] || {};
  const graded = submission?.status === 'graded';
  const submitted = submission?.status === 'submitted' || graded;

  const files = (submission?.attachmentUrls || []).map((url, idx) => {
    const name = url.split('/').pop() || `Attachment ${idx + 1}`;
    const isImage = /\.(png|jpe?g|webp|gif)$/i.test(name);
    return {
      name,
      url: toAbsoluteUrl(url),
      isImage,
      // PDFs cannot render in an <img>; the teacher opens them in a new tab instead.
      kind: isImage ? 'image' : /\.pdf$/i.test(name) ? 'pdf' : 'file',
    };
  });

  return {
    roll: Number(student?.rollNo) || 0,
    mongoId: submission?._id?.toString?.(),
    // Students who have not submitted have no submission document, so fall back to
    // the student's own id — it is the only stable key for those rows.
    studentId: submission?.studentId?.toString?.() || student?._id?.toString?.(),
    name: student?.name || 'Student',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'S')}&background=3b2d7d&color=fff`,
    status: graded ? 'Checked' : submitted ? 'Submitted' : 'Not Submitted',
    submittedAt: submission?.submittedAt
      ? new Date(submission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : null,
    files,
    content: submission?.content || '',
    score: submission?.score ?? null,
    grade: scoreToGrade(submission?.score),
    remarks: submission?.feedback || '',
    raw: submission,
  };
};
