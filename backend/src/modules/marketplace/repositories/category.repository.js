const Category = require('../../../database/models/Category');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  paginate(filter, queryString, options = {}) {
    return executePaginatedQuery(Category, this.mergeFilter(filter), queryString, {
      defaultSort: 'displayOrder',
      ...options,
    });
  }

  findByHeader(headerId) {
    return this.findMany({ headerId }, { sort: { displayOrder: 1 } });
  }

  async reorder(headerId, orderedIds) {
    await Promise.all(
      orderedIds.map((id, index) =>
        Category.updateOne(this.mergeFilter({ _id: id, headerId }), { $set: { displayOrder: index + 1 } })
      )
    );
    return this.findByHeader(headerId);
  }
}

module.exports = new CategoryRepository();
