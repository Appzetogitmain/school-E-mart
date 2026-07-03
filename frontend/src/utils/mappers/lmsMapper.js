const DEFAULT_LESSON_IMAGE =
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=500&fit=crop';

const defaultAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Teacher')}&background=7F56D9&color=fff`;

export const mapCourseToLesson = (course, progress = 0) => {
  const gradeClass = course?.gradeClass || '';
  const category = course?.category || 'Course';
  const instructor = course?.instructorName || 'Instructor';

  return {
    id: course?._id || course?.id,
    title: course?.title || 'Untitled Course',
    subject: course?.subject || category || 'General',
    chapter: gradeClass ? `${gradeClass} • ${category}` : category,
    progress: Number(progress) || 0,
    duration: course?.durationLabel || course?.duration || '—',
    image:
      course?.thumbnailUrl ||
      course?.thumbnail?.url ||
      course?.imageUrl ||
      DEFAULT_LESSON_IMAGE,
    videoUrl: course?.videoUrl || '',
    teacher: instructor,
    teacherImg: course?.instructorAvatarUrl || defaultAvatar(instructor),
    type: course?.contentType || 'Video',
    language: course?.language || 'English',
    notes: course?.description ? course.description.split(';').map((n) => n.trim()).filter(Boolean) : [],
  };
};

export const mapResumeToContinueLesson = (resume) => {
  if (!resume?.lesson && !resume?.bookmark) return null;

  const course = resume.lesson?.course || resume.course || {};
  const lesson = resume.lesson || {};
  const progressPercent = resume.progress?.percentComplete ?? resume.progress?.progress ?? 0;

  return mapCourseToLesson(
    {
      ...course,
      title: lesson.title || course.title,
      description: lesson.description || course.description,
    },
    progressPercent
  );
};
