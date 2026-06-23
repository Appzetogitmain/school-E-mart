const createModule = require('../../common/routing/createModule');
const vendorRoutes = require('./routes/vendor.routes');

const vendorModule = createModule({
  name: 'vendor',
  mountPath: '/vendor',
  routes: vendorRoutes,
});

module.exports = {
  vendorModule,
  vendorRoutes,
};
