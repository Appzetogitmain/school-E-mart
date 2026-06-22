const Subcategory = require('../../../database/models/Subcategory');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class SubcategoryRepository extends BaseRepository {
  constructor() {
    super(Subcategory);
  }

  paginate(filter, queryString, options = {}) {
    return executePaginatedQuery(Subcategory, this.mergeFilter(filter), queryString, {
      defaultSort: 'displayOrder',
      ...options,
    });
  }

  findByCategory(categoryId) {
    return this.findMany({ categoryId }, { sort: { displayOrder: 1 } });
  }

  async reorder(categoryId, orderedIds) {
    await Promise.all(
      orderedIds.map((id, index) =>
        Subcategory.updateOne(this.mergeFilter({ _id: id, categoryId }), { $set: { displayOrder: index + 1 } })
      )
    );
    return this.findByCategory(categoryId);
  }
}

module.exports = new SubcategoryRepository();
