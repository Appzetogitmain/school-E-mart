const express = require('express');
const catalogController = require('../controllers/catalog.controller');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { PERMISSIONS } = require('../../../constants/permissions');

const router = express.Router();

router.get('/status', catalogController.getStatus);

router.get(
  '/categories',
  ...protectedRoute({ permissions: [PERMISSIONS.CATALOG_READ] }),
  catalogController.listCategories
);

module.exports = router;
