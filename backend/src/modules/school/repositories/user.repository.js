const User = require('../../../database/models/User');
const ParentProfile = require('../../../database/models/ParentProfile');
const ChildProfile = require('../../../database/models/ChildProfile');
const { BaseRepository } = require('../../../repositories');

class SchoolUserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findParentProfileByUserId(userId) {
    return ParentProfile.findOne({ userId, 'softDelete.isDeleted': { $ne: true } }).lean();
  }

  createParentProfile(data) {
    return ParentProfile.create(data);
  }

  createChildProfile(data) {
    return ChildProfile.create(data);
  }

  linkChildToParent(parentProfileId, childId) {
    return ParentProfile.findByIdAndUpdate(
      parentProfileId,
      { $set: { activeChildId: childId } },
      { new: true }
    ).lean();
  }
}

module.exports = new SchoolUserRepository();
