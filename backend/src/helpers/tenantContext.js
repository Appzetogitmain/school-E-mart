const mongoose = require('mongoose');

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

const buildTenantFilter = (req, field = 'tenantSchoolId') => {
  const tenantSchoolId = req.tenant?.schoolId || req.auth?.tenantSchoolId;
  const objectId = toObjectId(tenantSchoolId);
  if (!objectId) return {};
  return { [field]: objectId };
};

const getTenantSchoolId = (req) => req.tenant?.schoolId || req.auth?.tenantSchoolId || null;

module.exports = {
  buildTenantFilter,
  getTenantSchoolId,
  toObjectId,
};
