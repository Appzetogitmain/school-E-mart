const express = require('express');
const shiprocketWebhookRoute = require('../modules/delivery/webhooks/shiprocketWebhookRoute');

const router = express.Router();
router.use('/', shiprocketWebhookRoute);

module.exports = router;
