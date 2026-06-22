const Lookup = require('../../../database/models/Lookup');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class LookupRepository extends BaseRepository {
  constructor() {
    super(Lookup, { useSoftDelete: false });
  }

  paginateLookups(filter, queryString, options = {}) {
    return executePaginatedQuery(Lookup, filter, queryString, {
      defaultSort: 'displayOrder',
      ...options,
    });
  }

  findByTypeAndCode(type, code, group = null) {
    const filter = { type, code };
    if (group) filter.group = group;
    return this.findOne(filter);
  }
}

module.exports = new LookupRepository();
