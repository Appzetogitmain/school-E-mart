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

export const mapAssignmentForParentHomework = (assignment, course, submission = null) => {
  const id = assignment?._id?.toString?.() || assignment?.id;
  const dueDate = assignment?.dueDate ? new Date(assignment.dueDate) : null;
  const now = new Date();
  const subject = course?.subject || 'General';

  // The server is the only source of truth for submission state. Statuses arrive
  // lowercase ('submitted'), so never compare them against display labels.
  const submissionStatus = submission?.status || null;

  let tabType = 'Pending';
  let status = 'On Track';
  let statusColor = 'bg-[#EBFBF0] text-[#34A853] border-[#34A853]/10';

  if (submissionStatus === 'graded') {
    tabType = 'Completed';
    status = 'Completed';
  } else if (submissionStatus === 'returned') {
    // Sent back by the teacher: this needs the student's attention again, so it belongs
    // with the work still to do rather than with the finished work.
    tabType = 'Pending';
    status = 'Needs Revision';
    statusColor = 'bg-[#FEF3F2] text-[#D93025] border-[#D93025]/10';
  } else if (submissionStatus === 'submitted') {
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

  const classGrade = assignment?.classGrade || course?.gradeClass || '';
  const section = assignment?.section || '';
  const priority = assignment?.priority || null;
  const maxScore = assignment?.maxScore ?? 100;

  return {
    id,
    courseId: course?._id?.toString?.() || course?.id,
    subject,
    title: assignment?.title,
    description: assignment?.description || assignment?.instructions || assignment?.title,
    image: SUBJECT_IMAGES[subject] || '/assets/math_homework.png',
    // Reflects what the teacher actually chose, not just how close the due date is.
    isHighPriority: priority === 'High' || status === 'Overdue' || status === 'Due Soon',
    priority,
    status,
    statusColor,
    assignedDate: formatDate(assignment?.assignedDate || assignment?.audit?.createdAt || assignment?.createdAt),
    dueDate: formatDate(assignment?.dueDate),
    daysRemaining: daysRemainingLabel(assignment?.dueDate),
    // The teacher who set this homework; the course instructor is only a fallback
    // because a course can be shared by several teachers.
    teacher: assignment?.assignedByName || course?.instructorName || '—',
    classSection: [classGrade, section].filter(Boolean).join(' - ') || '—',
    homeworkType: assignment?.homeworkType || null,
    instructions: assignment?.instructions || '',
    textbook: assignment?.reference?.textbook || '',
    chapter: assignment?.reference?.chapter || '',
    attachmentsCount: assignment?.attachments?.length || 0,
    tabType,
    maxScore,

    // Submission state, straight from the server. `submissionStatus` is the raw API
    // value ('submitted' | 'graded' | 'returned' | null) — compare against these, not
    // against the human-readable `status` above.
    submissionStatus,
    submissionId: submission?._id?.toString?.() || null,
    submittedAt: submission?.submittedAt || null,
    isLate: Boolean(submission?.isLate),
    submittedNote: submission?.content || '',
    submittedFiles: (submission?.attachments || []).map((attachment) => ({
      id: attachment?._id?.toString?.() || attachment?.toString?.(),
      mime: attachment?.mime || '',
      isImage: String(attachment?.mime || '').startsWith('image/'),
    })),
    // Legacy submissions stored public URLs instead of Attachment records.
    legacyFileUrls: submission?.attachmentUrls || [],

    // What the teacher sent back. Previously stored and never shown to the parent.
    score: submission?.score ?? null,
    letterGrade: submission?.letterGrade || null,
    feedback: submission?.feedback || '',
    gradedAt: submission?.gradedAt || null,

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

  const titleLower = (notice?.title || '').toLowerCase();
  const contentLower = (notice?.content || '').toLowerCase();
  
  let type = 'general';
  let category = 'General';
  let bgColor = 'bg-[#EBFBF0]';
  let iconColor = 'text-[#34A853]';
  let iconKey = 'megaphone';

  if (titleLower.includes('urgent') || titleLower.includes('emergency') || contentLower.includes('urgent') || contentLower.includes('immediate')) {
    type = 'urgent';
    category = 'Urgent';
    bgColor = 'bg-[#FEF3F2]';
    iconColor = 'text-[#D93025]';
    iconKey = 'urgent';
  } else if (titleLower.includes('exam') || titleLower.includes('test') || titleLower.includes('syllabus') || titleLower.includes('homework') || titleLower.includes('class')) {
    type = 'academic';
    category = 'Academic';
    bgColor = 'bg-[#F4F3FF]';
    iconColor = 'text-[#5925DC]';
    iconKey = 'academic';
  } else if (titleLower.includes('event') || titleLower.includes('holiday') || titleLower.includes('annual') || titleLower.includes('celebration') || titleLower.includes('sports')) {
    type = 'event';
    category = 'Events';
    bgColor = 'bg-[#EFF8FF]';
    iconColor = 'text-[#175CD3]';
    iconKey = 'event';
  }

  return {
    id,
    title: notice?.title || 'Notice',
    content: notice?.content || '',
    date,
    dateText: formatShortDateText(publishedAt),
    type,
    category,
    iconKey,
    bgColor,
    iconColor,
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
