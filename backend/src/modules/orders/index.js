const createModule = require('../../common/routing/createModule');
const ordersRoutes = require('./routes/orders.routes');

const ordersModule = createModule({
  name: 'orders',
  mountPath: '/orders',
  routes: ordersRoutes,
});

module.exports = {
  ordersModule,
  ordersRoutes,
};
