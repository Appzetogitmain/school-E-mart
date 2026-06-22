const createModule = require('../../common/routing/createModule');
const schoolRoutes = require('./routes/school.routes');

const schoolModule = createModule({
  name: 'school',
  mountPath: '/schools',
  routes: schoolRoutes,
});

module.exports = {
  schoolModule,
  schoolRoutes,
};
