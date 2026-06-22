const createModule = require('../../common/routing/createModule');
const catalogRoutes = require('./routes/catalog.routes');

const catalogModule = createModule({
  name: 'catalog',
  mountPath: '/catalog',
  routes: catalogRoutes,
});

module.exports = {
  catalogModule,
  catalogRoutes,
};
