const Wallet = require('../../../database/models/Wallet');
const WalletTransaction = require('../../../database/models/WalletTransaction');
const { executePaginatedQuery } = require('../../../repositories');

const userWalletService = {
  /** Lazily create the wallet on first read so every user always has one. */
  async getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ userId }).lean();
    if (!wallet) {
      const createdDoc = await Wallet.create({ userId });
      wallet = createdDoc.toObject();
    }
    return wallet;
  },

  async getBalance(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      balancePaise: wallet.balancePaise,
      onHoldPaise: wallet.onHoldPaise,
      pendingPaise: wallet.pendingPaise,
      lifetimeCreditPaise: wallet.lifetimeCreditPaise,
      lifetimeDebitPaise: wallet.lifetimeDebitPaise,
      currency: wallet.currency,
    };
  },

  async listTransactions(userId, query = {}) {
    const filter = { userId };
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    return executePaginatedQuery(WalletTransaction, filter, query, {
      defaultSort: '-audit.createdAt',
    });
  },

  /** Post a credit/debit and keep the wallet aggregates consistent. */
  async postTransaction(userId, { type, category, amountPaise, reference, description }) {
    const wallet = await this.getOrCreateWallet(userId);
    const signed = type === 'debit' ? -amountPaise : amountPaise;
    const newBalance = wallet.balancePaise + signed;
    if (newBalance < 0) {
      const { BadRequestError } = require('../../../common/errors');
      throw new BadRequestError('Insufficient wallet balance');
    }

    const txn = await WalletTransaction.create({
      walletId: wallet._id,
      userId,
      type,
      category,
      amountPaise,
      runningBalancePaise: newBalance,
      reference,
      description,
      status: 'posted',
    });

    await Wallet.updateOne(
      { _id: wallet._id },
      {
        $set: { balancePaise: newBalance },
        $inc:
          type === 'credit'
            ? { lifetimeCreditPaise: amountPaise }
            : { lifetimeDebitPaise: amountPaise },
      }
    );

    return txn.toObject();
  },
};

module.exports = userWalletService;
