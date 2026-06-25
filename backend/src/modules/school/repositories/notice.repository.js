const Notice = require('../../../database/models/Notice');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class NoticeRepository extends BaseRepository {
  constructor() {
    super(Notice);
  }

  paginateNotices(filter, queryString, options = {}) {
    return executePaginatedQuery(Notice, this.mergeFilter(filter), queryString, {
      defaultSort: '-publishDate',
      ...options,
    });
  }
}

module.exports = new NoticeRepository();
