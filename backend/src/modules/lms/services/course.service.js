const { NotFoundError, BadRequestError } = require('../../../common/errors');
const courseRepository = require('../repositories/course.repository');
const { uniqueSlug } = require('../utils/slug');
const LmsCourse = require('../../../database/models/LmsCourse');

const courseService = {
  async createCourse(schoolId, payload) {
    const slug = await uniqueSlug(LmsCourse, payload.title);
    return courseRepository.create({
      ...payload,
      schoolId,
      slug,
      status: payload.status || 'draft',
    });
  },

  async getCourse(schoolId, courseId) {
    const course = await courseRepository.findOne({ _id: courseId, schoolId });
    if (!course) throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    return course;
  },

  async listCourses(schoolId, query) {
    const filter = { schoolId };
    if (query.status) filter.status = query.status;
    if (query.subject) filter.subject = query.subject;
    if (query.gradeClass) filter.gradeClass = query.gradeClass;
    return courseRepository.paginateCourses(filter, query);
  },

  async updateCourse(schoolId, courseId, payload) {
    if (payload.title && !payload.slug) {
      payload.slug = await uniqueSlug(LmsCourse, payload.title, { schoolId });
    }
    const course = await courseRepository.updateById(courseId, { $set: payload }, { schoolId });
    if (!course) throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    return course;
  },

  async deleteCourse(schoolId, courseId, deletedBy) {
    const course = await courseRepository.softDeleteById(courseId, { deletedBy });
    if (!course || String(course.schoolId) !== String(schoolId)) {
      throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    }
    return course;
  },

  async setCourseStatus(schoolId, courseId, status) {
    if (!['draft', 'published', 'archived'].includes(status)) {
      throw new BadRequestError('Invalid course status', 'INVALID_COURSE_STATUS');
    }
    const course = await courseRepository.updateById(courseId, { $set: { status } }, { schoolId });
    if (!course) throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    return course;
  },
};

module.exports = courseService;
