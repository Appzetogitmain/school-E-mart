const DiaryEntry = require('../../../database/models/DiaryEntry');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class DiaryRepository extends BaseRepository {
  constructor() {
    super(DiaryEntry);
  }

  paginateDiary(filter, queryString, options = {}) {
    return executePaginatedQuery(DiaryEntry, this.mergeFilter(filter), queryString, {
      defaultSort: '-audit.createdAt',
      ...options,
    });
  }
}

module.exports = new DiaryRepository();
