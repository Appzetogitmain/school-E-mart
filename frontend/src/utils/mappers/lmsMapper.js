import { toAbsoluteUrl } from '../url';

const DEFAULT_LESSON_IMAGE =
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=500&fit=crop';

const defaultAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Teacher')}&background=7F56D9&color=fff`;

/**
 * `lessons` is the course's own published lessons (if the caller resolved
 * them) — the admin console uploads video content as lessons *within* a
 * course, not onto the course record itself (LmsCourse.videoUrl is normally
 * never set), so a course card with no lessons attached has no video to
 * play. Pass the resolved lessons through here rather than relying on
 * `course.videoUrl` alone.
 */
export const mapCourseToLesson = (course, progress = 0, lessons = []) => {
  const gradeClass = course?.gradeClass || '';
  const category = course?.category || 'Course';
  const instructor = course?.instructorName || 'Instructor';
  const lessonList = Array.isArray(lessons) ? lessons : [lessons].filter(Boolean);
  const primaryLesson = lessonList[0] || null;

  return {
    id: course?._id || course?.id,
    // These cards render a course, but progress is recorded per lesson, so all
    // of the course's lesson ids have to survive the mapping — "Mark Completed"
    // and the resume bookmark both need them.
    courseId: course?._id || course?.id,
    lessonId: primaryLesson?._id || primaryLesson?.id || null,
    lessonIds: lessonList.map((l) => l?._id || l?.id).filter(Boolean),
    title: course?.title || 'Untitled Course',
    subject: course?.subject || category || 'General',
    chapter: gradeClass ? `${gradeClass} • ${category}` : category,
    progress: Number(progress) || 0,
    duration: course?.durationLabel || course?.duration || '—',
    image:
      toAbsoluteUrl(course?.thumbnailUrl || course?.thumbnail?.url || course?.imageUrl) ||
      DEFAULT_LESSON_IMAGE,
    videoUrl:
      toAbsoluteUrl(primaryLesson?.contentHtml || primaryLesson?.videoUrl || course?.videoUrl) || '',
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
    progressPercent,
    lesson
  );
};
