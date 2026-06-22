const SchoolMembership = require('../../../database/models/SchoolMembership');
const { BaseRepository } = require('../../../repositories');

class MembershipRepository extends BaseRepository {
  constructor() {
    super(SchoolMembership);
  }

  findByUserSchoolRole(userId, schoolId, role) {
    return this.findOne({ userId, schoolId, role });
  }
}

module.exports = new MembershipRepository();
