const LmsNote = require('../../../database/models/LmsNote');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class NoteRepository extends BaseRepository {
  constructor() {
    super(LmsNote);
  }

  paginateNotes(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsNote, this.mergeFilter(filter), queryString, {
      defaultSort: '-audit.updatedAt',
      ...options,
    });
  }
}

module.exports = new NoteRepository();
