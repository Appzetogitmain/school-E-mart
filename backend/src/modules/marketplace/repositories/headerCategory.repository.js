const HeaderCategory = require('../../../database/models/HeaderCategory');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class HeaderCategoryRepository extends BaseRepository {
  constructor() {
    super(HeaderCategory);
  }

  paginate(filter, queryString, options = {}) {
    return executePaginatedQuery(HeaderCategory, this.mergeFilter(filter), queryString, {
      defaultSort: 'displayOrder',
      ...options,
    });
  }

  async reorder(orderedIds) {
    await Promise.all(
      orderedIds.map((id, index) =>
        HeaderCategory.updateOne(this.mergeFilter({ _id: id }), { $set: { displayOrder: index + 1 } })
      )
    );
    return this.findMany({}, { sort: { displayOrder: 1 } });
  }
}

module.exports = new HeaderCategoryRepository();
