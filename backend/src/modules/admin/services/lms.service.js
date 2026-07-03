const courseService = require('../../lms/services/course.service');

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
};

module.exports = adminLmsService;
