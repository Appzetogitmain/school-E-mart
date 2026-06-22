const { assertSchoolAccess } = require('../policies/schoolAccess.policy');

const resolveSchool =
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
  resolveSchool,
};
