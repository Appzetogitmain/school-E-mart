const createModule = require('../../common/routing/createModule');
const supportRoutes = require('./routes/support.routes');

const supportModule = createModule({
  name: 'support',
  mountPath: '/support',
  routes: supportRoutes,
});

module.exports = {
  supportModule,
};
