const asyncHandler = require('../../../utils/asyncHandler');
const { success, created, paginated } = require('../../../common/response');
const walletService = require('../services/wallet.service');
const referralService = require('../services/referral.service');

const walletController = {
  getWallet: asyncHandler(async (req, res) => {
    const wallet = await walletService.getBalance(req.auth.userId);
    return success(res, { wallet }, 'Wallet fetched', undefined, req);
  }),

  listTransactions: asyncHandler(async (req, res) => {
    const { data, pagination } = await walletService.listTransactions(req.auth.userId, req.query);
    return paginated(res, { transactions: data }, pagination, 'Transactions fetched', req);
  }),

  getReferral: asyncHandler(async (req, res) => {
    const data = await referralService.getMyReferral(req.auth.userId);
    return success(res, data, 'Referral fetched', undefined, req);
  }),

  recordInvite: asyncHandler(async (req, res) => {
    const invitee = await referralService.recordInvite(req.auth.userId, req.body.phone);
    return created(res, { invitee }, 'Invite recorded', req);
  }),
};

module.exports = walletController;
