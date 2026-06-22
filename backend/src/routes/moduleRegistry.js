const { authModule } = require('../modules/auth');
const { catalogModule } = require('../modules/catalog');

const v1Modules = [authModule, catalogModule];

const registerV1Routes = (router) => {
  v1Modules.forEach(({ mountPath, routes }) => {
    router.use(mountPath, routes);
  });
};

module.exports = {
  v1Modules,
  registerV1Routes,
};
