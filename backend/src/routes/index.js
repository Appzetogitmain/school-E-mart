const express = require('express');
const { registerV1Routes } = require('./v1');

const router = express.Router();

registerV1Routes(router);

module.exports = router;
