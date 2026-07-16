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
      // Without this, attachments come back as bare ObjectIds and the client can
      // only count them — it has no storageKey to actually open the file with.
      populate: { path: 'attachments', select: 'storageKey mime sizeBytes purpose' },
      ...options,
    });
  }
}

module.exports = new NoticeRepository();
