const { parsePagination, buildPaginationMeta } = require('../../common/pagination');

class BaseRepository {
  constructor(model, options = {}) {
    this.model = model;
    this.useSoftDelete = options.useSoftDelete !== false;
    this.softDeletePath = options.softDeletePath || 'softDelete.isDeleted';
  }

  get activeFilter() {
    if (!this.useSoftDelete) return {};
    return { [this.softDeletePath]: { $ne: true } };
  }

  mergeFilter(filter = {}) {
    return { ...this.activeFilter, ...filter };
  }

  findById(id, filter = {}, queryOptions = {}) {
    return this.model
      .findOne(this.mergeFilter({ _id: id, ...filter }))
      .setOptions(queryOptions)
      .lean();
  }

  findOne(filter = {}, queryOptions = {}) {
    return this.model.findOne(this.mergeFilter(filter)).setOptions(queryOptions).lean();
  }

  findMany(filter = {}, queryOptions = {}) {
    return this.model.find(this.mergeFilter(filter)).setOptions(queryOptions).lean();
  }

  create(data, queryOptions = {}) {
    return this.model.create([data], queryOptions).then((docs) => docs[0]);
  }

  updateById(id, data, filter = {}, queryOptions = {}) {
    return this.model
      .findOneAndUpdate(this.mergeFilter({ _id: id, ...filter }), data, {
        new: true,
        runValidators: true,
        ...queryOptions,
      })
      .lean();
  }

  softDeleteById(id, { deletedBy = null, reason = null } = {}) {
    return this.model
      .findOneAndUpdate(
        this.mergeFilter({ _id: id }),
        {
          $set: {
            'softDelete.isDeleted': true,
            'softDelete.deletedAt': new Date(),
            'softDelete.deletedBy': deletedBy,
            'softDelete.reason': reason,
          },
        },
        { new: true }
      )
      .lean();
  }

  count(filter = {}, queryOptions = {}) {
    return this.model.countDocuments(this.mergeFilter(filter)).setOptions(queryOptions);
  }

  async paginate(filter = {}, queryString = {}, options = {}) {
    const { page, limit, skip } = parsePagination(queryString, options);
    const mergedFilter = this.mergeFilter(filter);

    const [data, total] = await Promise.all([
      this.model
        .find(mergedFilter)
        .sort(options.sort || { 'audit.createdAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(mergedFilter),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ total, page, limit }),
    };
  }
}

module.exports = BaseRepository;
