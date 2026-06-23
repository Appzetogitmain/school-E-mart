const VendorProfile = require('../../../database/models/VendorProfile');
const Order = require('../../../database/models/Order');
const ledgerRepository = require('../repositories/ledger.repository');
const payoutRepository = require('../repositories/payout.repository');
const VendorLedger = require('../../../database/models/VendorLedger');

const settlementService = {
  calculateCommission(lineTotalPaise, commissionPercent) {
    const rate = Number(commissionPercent) || 0;
    const commissionPaise = Math.round((lineTotalPaise * rate) / 100);
    const vendorEarningPaise = lineTotalPaise - commissionPaise;
    return { commissionPaise, vendorEarningPaise };
  },

  async getVendorCommissionRate(vendorId) {
    const vendor = await VendorProfile.findById(vendorId).lean();
    return Number(vendor?.commissionPercent) || 10;
  },

  async recordOrderSettlement(vendorId, orderId, actorUserId = null) {
    const order = await Order.findById(orderId).lean();
    if (!order || order.orderStatus !== 'delivered') return null;

    const existing = await ledgerRepository.findOne({
      vendorId,
      'reference.kind': 'Order',
      'reference.id': orderId,
      transactionType: 'order_credit',
    });
    if (existing) return existing;

    const commissionRate = await this.getVendorCommissionRate(vendorId);
    const vendorItems = order.items.filter((item) => String(item.vendorId) === String(vendorId));
    const grossPaise = vendorItems.reduce((sum, item) => sum + item.lineTotalPaise, 0);
    const { commissionPaise, vendorEarningPaise } = this.calculateCommission(grossPaise, commissionRate);

    const latest = await ledgerRepository.findLatestBalance(vendorId);
    const currentBalance = latest?.balancePaise || 0;
    const creditBalance = currentBalance + vendorEarningPaise;

    const credit = await VendorLedger.create({
      vendorId,
      transactionType: 'order_credit',
      amountPaise: vendorEarningPaise,
      balancePaise: creditBalance,
      reference: { kind: 'Order', id: orderId },
      description: `Order ${order.orderNumber} earnings`,
    });

    if (commissionPaise > 0) {
      await VendorLedger.create({
        vendorId,
        transactionType: 'commission_deduction',
        amountPaise: -commissionPaise,
        balancePaise: creditBalance,
        reference: { kind: 'Order', id: orderId },
        description: `Commission ${commissionRate}% on order ${order.orderNumber}`,
      });
    }

    return credit;
  },

  async getEarningsSummary(vendorId) {
    const [credits, commissions, debits, pendingPayouts, latest] = await Promise.all([
      ledgerRepository.sumByType(vendorId, 'order_credit'),
      ledgerRepository.sumByType(vendorId, 'commission_deduction'),
      ledgerRepository.sumByType(vendorId, 'payout_debit'),
      payoutRepository.sumPendingAmount(vendorId),
      ledgerRepository.findLatestBalance(vendorId),
    ]);

    const totalEarningsPaise = credits[0]?.total || 0;
    const totalCommissionPaise = Math.abs(commissions[0]?.total || 0);
    const totalPayoutsPaise = Math.abs(debits[0]?.total || 0);
    const pendingSettlementPaise = pendingPayouts[0]?.total || 0;
    const availableBalancePaise = latest?.balancePaise || 0;

    return {
      totalEarningsPaise,
      totalCommissionPaise,
      totalPayoutsPaise,
      pendingSettlementPaise,
      availableBalancePaise,
      netEarningsPaise: totalEarningsPaise - totalCommissionPaise,
    };
  },

  async listSettlements(vendorId, query) {
    return ledgerRepository.paginateLedger(vendorId, query);
  },

  async listPendingSettlements(vendorId, query) {
    return payoutRepository.paginatePayouts(vendorId, query, {
      status: { $in: ['pending', 'processing'] },
    });
  },

  async getSettlementHistory(vendorId, query) {
    return ledgerRepository.paginateLedger(vendorId, query);
  },
};

module.exports = settlementService;
