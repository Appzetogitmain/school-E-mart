const { success } = require('../../../common/response');
const asyncHandler = require('../../../utils/asyncHandler');

const catalogController = {
  getStatus: asyncHandler(async (req, res) => {
    return success(
      res,
      {
        module: 'catalog',
        status: 'scaffolded',
        version: '0.0.0',
      },
      'Catalog module is scaffolded',
      undefined,
      req
    );
  }),

  listCategories: asyncHandler(async (req, res) => {
    return success(
      res,
      { categories: [] },
      'Catalog listing is not implemented yet',
      undefined,
      req
    );
  }),
};

module.exports = catalogController;
