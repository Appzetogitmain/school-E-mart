const { authModule } = require('../modules/auth');
const { marketplaceModule } = require('../modules/marketplace');
const { schoolModule } = require('../modules/school');
const { lmsModule } = require('../modules/lms');
const { vendorModule } = require('../modules/vendor');
const { ordersModule } = require('../modules/orders');
const { adminModule } = require('../modules/admin');

const v1Modules = [authModule, marketplaceModule, schoolModule, lmsModule, vendorModule, ordersModule, adminModule];

const registerV1Routes = (router) => {
  v1Modules.forEach(({ mountPath, routes }) => {
    router.use(mountPath, routes);
  });
};

module.exports = {
  v1Modules,
  registerV1Routes,
};
