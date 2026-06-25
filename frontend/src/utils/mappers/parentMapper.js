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

export const mapAssignmentForParentHomework = (assignment, course, submissionOrCache = null) => {
  const id = assignment?._id?.toString?.() || assignment?.id;
  const cached = submissionOrCache?.status
    ? submissionOrCache
    : submissionOrCache?.[id] || submissionOrCache;
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

const toLocalDateString = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatShortDateText = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTimeText = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const mapNoticeForParent = (notice) => {
  const id = notice?._id?.toString?.() || notice?.id;
  const publishedAt = notice?.publishDate || notice?.audit?.createdAt;
  const date = toLocalDateString(publishedAt);

  return {
    id,
    title: notice?.title || 'Notice',
    content: notice?.content || '',
    date,
    dateText: formatShortDateText(publishedAt),
    type: 'general',
    category: 'General',
    iconKey: 'megaphone',
    bgColor: 'bg-[#EBFBF0]',
    iconColor: 'text-[#34A853]',
    attachments: notice?.attachments?.length || 0,
    pinned: false,
    isImportantSpotlight: false,
    raw: notice,
  };
};

export const mapDiaryEntryForParent = (entry) => {
  const id = entry?._id?.toString?.() || entry?.id;
  const createdAt = entry?.audit?.createdAt || entry?.createdAt;
  const date = toLocalDateString(createdAt);

  return {
    id,
    title: entry?.title || 'Diary Entry',
    content: entry?.content || '',
    date,
    timestamp: formatTimeText(createdAt),
    type: 'message',
    sender: 'Class Teacher',
    hasAttachment: (entry?.attachments?.length || 0) > 0,
    badgeText: entry?.isReadByParent ? 'Read' : 'New',
    badgeColor: entry?.isReadByParent
      ? 'bg-gray-50 text-gray-500 border-gray-100'
      : 'bg-[#F3EFFF] text-[#6A47DE] border-[#EAE3FF]',
    iconKey: 'message',
    bgColor: 'bg-[#F3EFFF]',
    iconColor: 'text-[#6A47DE]',
    accentColor: '#6A47DE',
    isRead: Boolean(entry?.isReadByParent),
    raw: entry,
  };
};

export const mapAudienceToNoticePayload = (audience) => {
  if (audience === 'teachers') return 'teachers';
  if (audience === 'specific') return 'specific_classes';
  if (audience === 'students') return 'parents';
  return 'parents';
};
