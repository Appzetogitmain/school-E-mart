const express = require('express');
const walletController = require('../controllers/wallet.controller');
const { validateBody, validateQuery } = require('../../../middlewares/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { Joi } = require('../../../common/validation');

const router = express.Router();

const authed = protectedRoute();

const txnQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid('credit', 'debit').optional(),
  category: Joi.string()
    .valid('order_payment', 'order_refund', 'payout', 'commission', 'referral', 'adjustment')
    .optional(),
});

const inviteSchema = Joi.object({
  phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).required(),
});

router.get('/wallet', ...authed, walletController.getWallet);
router.get('/wallet/transactions', ...authed, validateQuery(txnQuery), walletController.listTransactions);
router.get('/referral', ...authed, walletController.getReferral);
router.post('/referral/invites', ...authed, validateBody(inviteSchema), walletController.recordInvite);

module.exports = router;
