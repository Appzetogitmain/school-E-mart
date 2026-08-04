const { parsePagination } = require('../common/pagination');

class ApiFeatures {
  constructor(query, queryString = {}) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const excluded = ['page', 'sort', 'limit', 'fields', 'search', 'studentId'];
    const queryObj = { ...this.queryString };
    excluded.forEach((field) => delete queryObj[field]);

    const parsed = {};
    Object.entries(queryObj).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;

      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        parsed[key] = { $in: value.slice(1, -1).split(',').map((item) => item.trim()) };
        return;
      }

      if (typeof value === 'string' && (value.startsWith('>') || value.startsWith('<'))) {
        const operator = value.startsWith('>=') || value.startsWith('<=') ? value.slice(0, 2) : value[0];
        const operand = Number(value.slice(operator.length));
        const operatorMap = {
          '>': '$gt',
          '>=': '$gte',
          '<': '$lt',
          '<=': '$lte',
        };
        parsed[key] = { [operatorMap[operator]]: operand };
        return;
      }

      parsed[key] = value;
    });

    this.query = this.query.find(parsed);
    return this;
  }

  sort(defaultSort = '-audit.createdAt') {
    const sortBy = this.queryString.sort
      ? this.queryString.sort.split(',').join(' ')
      : defaultSort;
    this.query = this.query.sort(sortBy);
    return this;
  }

  limitFields(defaultFields = '') {
    const fields = this.queryString.fields
      ? this.queryString.fields.split(',').join(' ')
      : defaultFields;
    if (fields) {
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate(defaults = {}) {
    const { page, limit, skip } = parsePagination(this.queryString, defaults);
    this.page = page;
    this.limit = limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;
