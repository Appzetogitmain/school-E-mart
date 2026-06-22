const createModule = require('../../common/routing/createModule');
const lmsRoutes = require('./routes/lms.routes');

const lmsModule = createModule({
  name: 'lms',
  mountPath: '/schools',
  routes: lmsRoutes,
});

module.exports = {
  lmsModule,
  lmsRoutes,
};
