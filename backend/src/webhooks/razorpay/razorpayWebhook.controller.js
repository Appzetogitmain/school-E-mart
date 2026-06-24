const asyncHandler = require('../../utils/asyncHandler');
const { processRazorpayWebhook } = require('./razorpayWebhook.service');

const razorpayWebhookController = {
  handleWebhook: asyncHandler(async (req, res) => {
    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }

    try {
      await processRazorpayWebhook(rawBody, req.headers);
      return res.status(200).json({ success: true });
    } catch (error) {
      if (error.statusCode === 401) {
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }
      return res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
  }),
};

module.exports = razorpayWebhookController;
