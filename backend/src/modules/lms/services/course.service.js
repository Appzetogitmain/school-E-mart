const mongoose = require('mongoose');
const { NotFoundError, BadRequestError } = require('../../../common/errors');
const courseRepository = require('../repositories/course.repository');
const { uniqueSlug } = require('../utils/slug');
const LmsCourse = require('../../../database/models/LmsCourse');

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const buildCourseScopeFilter = (schoolId, { includePlatform = false, platformOnly = false } = {}) => {
  if (platformOnly) {
    return { schoolId: null };
  }

  const scopedSchoolId = toObjectId(schoolId);
  if (!scopedSchoolId) {
    return { schoolId: null };
  }

  if (includePlatform) {
    return { $or: [{ schoolId: scopedSchoolId }, { schoolId: null }] };
  }

  return { schoolId: scopedSchoolId };
};

const courseService = {
  async createCourse(schoolId, payload) {
    const slug = await uniqueSlug(LmsCourse, payload.title);
    return courseRepository.create({
      ...payload,
      schoolId: toObjectId(schoolId),
      slug,
      status: payload.status || 'draft',
    });
  },

  async getCourse(schoolId, courseId, options = {}) {
    const filter = {
      _id: courseId,
      ...buildCourseScopeFilter(schoolId, options),
    };
    const course = await courseRepository.findOne(filter);
    if (!course) throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    return course;
  },

  async listCourses(schoolId, query, options = {}) {
    const filter = buildCourseScopeFilter(schoolId, options);
    if (query.status) filter.status = query.status;
    if (query.subject) filter.subject = query.subject;
    if (query.gradeClass) filter.gradeClass = query.gradeClass;
    return courseRepository.paginateCourses(filter, query);
  },

  async updateCourse(schoolId, courseId, payload, options = {}) {
    if (payload.title && !payload.slug) {
      payload.slug = await uniqueSlug(LmsCourse, payload.title, { schoolId: toObjectId(schoolId) });
    }
    const course = await courseRepository.updateById(
      courseId,
      { $set: payload },
      buildCourseScopeFilter(schoolId, options)
    );
    if (!course) throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    return course;
  },

  async deleteCourse(schoolId, courseId, deletedBy, options = {}) {
    const course = await courseRepository.softDeleteById(courseId, { deletedBy });
    if (!course) {
      throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    }

    const scopedSchoolId = toObjectId(schoolId);
    const courseSchoolId = course.schoolId ? course.schoolId.toString() : null;
    const expectedSchoolId = scopedSchoolId ? scopedSchoolId.toString() : null;

    if (options.platformOnly && courseSchoolId !== null) {
      throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    }

    if (!options.platformOnly && expectedSchoolId && courseSchoolId !== expectedSchoolId) {
      throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    }

    return course;
  },

  async setCourseStatus(schoolId, courseId, status, options = {}) {
    if (!['draft', 'published', 'archived'].includes(status)) {
      throw new BadRequestError('Invalid course status', null, 'INVALID_COURSE_STATUS');
    }
    const course = await courseRepository.updateById(
      courseId,
      { $set: { status } },
      buildCourseScopeFilter(schoolId, options)
    );
    if (!course) throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
    return course;
  },
};

module.exports = courseService;
