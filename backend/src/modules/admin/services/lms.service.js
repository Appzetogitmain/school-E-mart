const courseService = require('../../lms/services/course.service');
const lessonService = require('../../lms/services/lesson.service');

const PLATFORM_SCOPE = { platformOnly: true };

const adminLmsService = {
  listPlatformCourses(query) {
    return courseService.listCourses(null, query, PLATFORM_SCOPE);
  },

  createPlatformCourse(payload) {
    return courseService.createCourse(null, {
      ...payload,
      targetAudience: payload.targetAudience || 'parents',
    });
  },

  updatePlatformCourse(courseId, payload) {
    return courseService.updateCourse(null, courseId, payload, PLATFORM_SCOPE);
  },

  deletePlatformCourse(courseId, deletedBy) {
    return courseService.deleteCourse(null, courseId, deletedBy, PLATFORM_SCOPE);
  },

  setPlatformCourseStatus(courseId, status) {
    return courseService.setCourseStatus(null, courseId, status, PLATFORM_SCOPE);
  },

  listPlatformLessons(courseId, query) {
    return lessonService.listLessons(null, courseId, query, PLATFORM_SCOPE);
  },

  createPlatformLesson(courseId, payload) {
    return lessonService.createLesson(null, courseId, payload, PLATFORM_SCOPE);
  },

  updatePlatformLesson(courseId, lessonId, payload) {
    return lessonService.updateLesson(null, courseId, lessonId, payload, PLATFORM_SCOPE);
  },

  deletePlatformLesson(courseId, lessonId, deletedBy) {
    return lessonService.deleteLesson(null, courseId, lessonId, deletedBy, PLATFORM_SCOPE);
  },
};

module.exports = adminLmsService;
