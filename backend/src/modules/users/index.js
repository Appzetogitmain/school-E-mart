const createModule = require('../../common/routing/createModule');
const usersRoutes = require('./routes/users.routes');

const usersModule = createModule({
  name: 'users',
  mountPath: '/users',
  routes: usersRoutes,
});

module.exports = {
  usersModule,
};
