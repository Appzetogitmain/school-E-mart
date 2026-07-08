const createModule = require('../../common/routing/createModule');
const academicsRoutes = require('./routes/academics.routes');

const academicsModule = createModule({
  name: 'academics',
  mountPath: '/schools',
  routes: academicsRoutes,
});

module.exports = {
  academicsModule,
};
