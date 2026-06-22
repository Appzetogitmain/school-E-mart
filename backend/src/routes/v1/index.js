const express = require('express');
const { authRoutes } = require('../../modules/auth');

const registerV1Routes = (router) => {
  router.use('/auth', authRoutes);
};

module.exports = {
  registerV1Routes,
};
