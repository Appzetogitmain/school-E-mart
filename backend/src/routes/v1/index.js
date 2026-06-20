const express = require('express');
const { authRoutes } = require('../../modules/auth');
const { getHealth } = require('../../controllers/health.controller');

const registerV1Routes = (router) => {
  router.get('/health', getHealth);
  router.use('/auth', authRoutes);
};

module.exports = {
  registerV1Routes,
};
