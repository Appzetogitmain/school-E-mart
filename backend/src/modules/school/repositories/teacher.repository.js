const TeacherProfile = require('../../../database/models/TeacherProfile');
const User = require('../../../database/models/User');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class TeacherRepository extends BaseRepository {
  constructor() {
    super(TeacherProfile);
  }

  paginateTeachers(filter, queryString, options = {}) {
    return executePaginatedQuery(TeacherProfile, this.mergeFilter(filter), queryString, {
      defaultSort: '-audit.createdAt',
      ...options,
    });
  }

  findByUserId(userId) {
    return this.findOne({ userId });
  }

  findBySchoolAndStatus(schoolId, approvalStatus) {
    return TeacherProfile.find({
      schoolId,
      approvalStatus,
      'softDelete.isDeleted': { $ne: true },
    })
      .sort({ 'audit.createdAt': -1 })
      .lean();
  }

  async findWithUsers(filter, queryString) {
    const { data, pagination } = await this.paginateTeachers(filter, queryString);
    const userIds = data.map((item) => item.userId);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((user) => [String(user._id), user]));
    return {
      data: data.map((profile) => ({
        ...profile,
        user: userMap.get(String(profile.userId)) || null,
      })),
      pagination,
    };
  }
}

module.exports = new TeacherRepository();
