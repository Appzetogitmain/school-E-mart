const express = require('express');
const razorpayWebhookController = require('./razorpayWebhook.controller');

const router = express.Router();

router.post('/', razorpayWebhookController.handleWebhook);

module.exports = router;
