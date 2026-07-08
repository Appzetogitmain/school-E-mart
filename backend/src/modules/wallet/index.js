const createModule = require('../../common/routing/createModule');
const walletRoutes = require('./routes/wallet.routes');

const walletModule = createModule({
  name: 'wallet',
  mountPath: '/me',
  routes: walletRoutes,
});

module.exports = {
  walletModule,
};
