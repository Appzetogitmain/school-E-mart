const { authModule } = require('../modules/auth');
const { catalogModule } = require('../modules/catalog');
const { schoolModule } = require('../modules/school');
const { lmsModule } = require('../modules/lms');

const v1Modules = [authModule, catalogModule, schoolModule, lmsModule];

const registerV1Routes = (router) => {
  v1Modules.forEach(({ mountPath, routes }) => {
    router.use(mountPath, routes);
  });
};

module.exports = {
  v1Modules,
  registerV1Routes,
};
