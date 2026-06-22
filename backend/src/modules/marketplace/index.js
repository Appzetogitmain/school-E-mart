const createModule = require('../../common/routing/createModule');
const marketplaceRoutes = require('./routes/marketplace.routes');

const marketplaceModule = createModule({
  name: 'marketplace',
  mountPath: '/catalog',
  routes: marketplaceRoutes,
});

module.exports = {
  marketplaceModule,
  marketplaceRoutes,
};
