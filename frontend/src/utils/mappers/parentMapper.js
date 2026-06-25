const SUBJECT_IMAGES = {
  Mathematics: '/assets/math_homework.png',
  Science: '/assets/science_homework.png',
  English: '/assets/english_homework.png',
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const daysRemainingLabel = (dueDate) => {
  if (!dueDate) return '—';
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)} Day${Math.abs(diff) === 1 ? '' : 's'} Overdue`;
  if (diff === 0) return 'Due Today';
  return `${diff} Day${diff === 1 ? '' : 's'} Left`;
};

export const getSubmissionCache = (studentId) => {
  if (!studentId) return {};
  try {
    const raw = localStorage.getItem(`parentHomeworkSubmissions_${studentId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setSubmissionCache = (studentId, assignmentId, data) => {
  if (!studentId || !assignmentId) return;
  const cache = getSubmissionCache(studentId);
  cache[assignmentId] = data;
  localStorage.setItem(`parentHomeworkSubmissions_${studentId}`, JSON.stringify(cache));
};

export const mapAssignmentForParentHomework = (assignment, course, submissionCache = {}) => {
  const id = assignment?._id?.toString?.() || assignment?.id;
  const cached = submissionCache[id];
  const dueDate = assignment?.dueDate ? new Date(assignment.dueDate) : null;
  const now = new Date();
  const subject = course?.subject || 'General';

  let tabType = 'Pending';
  let status = 'On Track';
  let statusColor = 'bg-[#EBFBF0] text-[#34A853] border-[#34A853]/10';

  if (cached?.status === 'graded') {
    tabType = 'Completed';
    status = 'Completed';
  } else if (cached?.status === 'submitted') {
    tabType = 'Submitted';
    status = 'Submitted';
    statusColor = 'bg-[#F9F5FF] text-[#7F56D9] border-[#7F56D9]/10';
  } else if (dueDate && dueDate < now) {
    status = 'Overdue';
    statusColor = 'bg-[#FEF3F2] text-[#D93025] border-[#D93025]/10';
  } else if (dueDate) {
    const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 2) {
      status = 'Due Soon';
      statusColor = 'bg-[#FFF6ED] text-[#F2994A] border-[#F2994A]/10';
    }
  }

  return {
    id,
    courseId: course?._id?.toString?.() || course?.id,
    subject,
    title: assignment?.title,
    description: assignment?.description || assignment?.instructions || assignment?.title,
    image: SUBJECT_IMAGES[subject] || '/assets/math_homework.png',
    isHighPriority: status === 'Overdue' || status === 'Due Soon',
    status,
    statusColor,
    assignedDate: formatDate(assignment?.audit?.createdAt || assignment?.createdAt),
    dueDate: formatDate(assignment?.dueDate),
    daysRemaining: daysRemainingLabel(assignment?.dueDate),
    teacher: course?.instructorName || '—',
    attachmentsCount: assignment?.attachments?.length || 0,
    tabType,
    maxScore: assignment?.maxScore ?? 100,
    submissionStatus: cached?.status || 'Not Submitted',
    raw: assignment,
  };
};

export const buildHomeworkStats = (items = []) => ({
  pending: items.filter((item) => item.tabType === 'Pending').length,
  submitted: items.filter((item) => item.tabType === 'Submitted').length,
  completed: items.filter((item) => item.tabType === 'Completed').length,
  overdue: items.filter((item) => item.status === 'Overdue').length,
});

export const mapAttendanceStatus = (status) => {
  if (status === 'present') return { label: 'Present', color: 'text-[#34A853]' };
  if (status === 'absent') return { label: 'Absent', color: 'text-[#D93025]' };
  if (status === 'half_day') return { label: 'Late', color: 'text-[#F2994A]' };
  if (status === 'leave') return { label: 'Leave', color: 'text-[#7F56D9]' };
  if (status === 'holiday') return { label: 'Holiday', color: 'text-[#2E90FA]' };
  return { label: '—', color: 'text-gray-400' };
};
