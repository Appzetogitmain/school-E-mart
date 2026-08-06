const createModule = require('../../common/routing/createModule');
const contentRoutes = require('./routes/content.routes');

const contentModule = createModule({
  name: 'content',
  mountPath: '/content',
  routes: contentRoutes,
});

module.exports = {
  contentModule,
  contentRoutes,
};
