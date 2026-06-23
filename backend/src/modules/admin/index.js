const createModule = require('../../common/routing/createModule');
const adminRoutes = require('./routes/admin.routes');

const adminModule = createModule({
  name: 'admin',
  mountPath: '/admin',
  routes: adminRoutes,
});

module.exports = {
  adminModule,
  adminRoutes,
};
