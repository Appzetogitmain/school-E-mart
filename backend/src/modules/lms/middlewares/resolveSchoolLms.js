const { assertSchoolAccess } = require('../../school/policies/schoolAccess.policy');

const resolveSchoolLms =
  () =>
  async (req, _res, next) => {
    try {
      await assertSchoolAccess(req);
      return next();
    } catch (error) {
      return next(error);
    }
  };

module.exports = {
  resolveSchoolLms,
};
