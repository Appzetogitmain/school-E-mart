const createModule = require('../../common/routing/createModule');
const notificationsRoutes = require('./routes/notifications.routes');

const notificationsModule = createModule({
  name: 'notifications',
  mountPath: '/notifications',
  routes: notificationsRoutes,
});

module.exports = {
  notificationsModule,
  notificationsRoutes,
};
