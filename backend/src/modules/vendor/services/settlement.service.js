const VendorProfile = require('../../../database/models/VendorProfile');
const Order = require('../../../database/models/Order');
const ledgerRepository = require('../repositories/ledger.repository');
const payoutRepository = require('../repositories/payout.repository');
const VendorLedger = require('../../../database/models/VendorLedger');
const SchoolLedger = require('../../../database/models/SchoolLedger');
const PlatformLedger = require('../../../database/models/PlatformLedger');
const PayoutRequest = require('../../../database/models/PayoutRequest');
const { BadRequestError, NotFoundError } = require('../../../common/errors');

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

  /**
   * Splits a vendor's slice of an order three ways.
   *
   * Kit line items carry a commission snapshot (adminPercent/schoolPercent) taken
   * at order time, and the school that authored the kit — so the platform keeps
   * admin%, the school earns school%, and the vendor is paid the remainder.
   *
   * Ordinary product items have no snapshot, so they fall back to the vendor's
   * flat commission rate with no school share — exactly the prior behaviour.
   */
  async computeSettlementSplit(vendorItems, vendorId, grossPaise) {
    const hasSnapshot = vendorItems.some(
      (item) => item.commission && item.commission.adminPercent != null
    );

    if (hasSnapshot) {
      let adminPaise = 0;
      let schoolPaise = 0;
      const schoolMap = new Map();

      for (const item of vendorItems) {
        const adminPct = Number(item.commission?.adminPercent) || 0;
        const schoolPct = Number(item.commission?.schoolPercent) || 0;
        const line = item.lineTotalPaise;
        const itemAdmin = Math.round((line * adminPct) / 100);
        const itemSchool = item.schoolId ? Math.round((line * schoolPct) / 100) : 0;
        adminPaise += itemAdmin;
        schoolPaise += itemSchool;
        if (itemSchool > 0) {
          const isKit = Boolean(item.kitId);
          const type = isKit ? 'kit_commission_credit' : 'retail_commission_credit';
          const key = `${item.schoolId}:${type}`;
          const current = schoolMap.get(key) || { schoolId: item.schoolId, amountPaise: 0, transactionType: type, isKit };
          current.amountPaise += itemSchool;
          schoolMap.set(key, current);
        }
      }

      return {
        adminPaise,
        schoolPaise,
        vendorEarningPaise: grossPaise - adminPaise - schoolPaise,
        schoolBreakdown: [...schoolMap.values()],
      };
    }

    const rate = await this.getVendorCommissionRate(vendorId);
    const { commissionPaise, vendorEarningPaise } = this.calculateCommission(grossPaise, rate);
    return { adminPaise: commissionPaise, schoolPaise: 0, vendorEarningPaise, schoolBreakdown: [] };
  },

  async creditSchoolLedger(schoolId, amountPaise, orderId, orderNumber, transactionType = 'kit_commission_credit', customDescription = null) {
    const latest = await SchoolLedger.findOne({ schoolId }).sort({ 'audit.createdAt': -1 }).lean();
    const balancePaise = (latest?.balancePaise || 0) + amountPaise;
    const defaultDesc = transactionType === 'retail_commission_credit'
      ? `Marketplace product commission on order ${orderNumber}`
      : `Kit commission on order ${orderNumber}`;
    return SchoolLedger.create({
      schoolId,
      transactionType,
      amountPaise,
      balancePaise,
      reference: { kind: 'Order', id: orderId },
      description: customDescription || defaultDesc,
    });
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

    const vendorItems = order.items.filter((item) => String(item.vendorId) === String(vendorId));
    const grossPaise = vendorItems.reduce((sum, item) => sum + item.lineTotalPaise, 0);
    const split = await this.computeSettlementSplit(vendorItems, vendorId, grossPaise);

    const latest = await ledgerRepository.findLatestBalance(vendorId);
    const currentBalance = latest?.balancePaise || 0;
    const creditBalance = currentBalance + split.vendorEarningPaise;

    const credit = await VendorLedger.create({
      vendorId,
      transactionType: 'order_credit',
      amountPaise: split.vendorEarningPaise,
      balancePaise: creditBalance,
      reference: { kind: 'Order', id: orderId },
      description: `Order ${order.orderNumber} earnings`,
    });

    const totalCommissionPaise = split.adminPaise + split.schoolPaise;
    if (totalCommissionPaise > 0) {
      await VendorLedger.create({
        vendorId,
        transactionType: 'commission_deduction',
        amountPaise: -totalCommissionPaise,
        balancePaise: creditBalance,
        reference: { kind: 'Order', id: orderId },
        description: `Commission on order ${order.orderNumber}`,
      });
    }

    // Credit each school its share, and the platform its commission.
    for (const entry of split.schoolBreakdown) {
      if (entry.amountPaise > 0) {
        await this.creditSchoolLedger(
          entry.schoolId,
          entry.amountPaise,
          orderId,
          order.orderNumber,
          entry.transactionType || 'kit_commission_credit'
        );
      }
    }

    if (split.adminPaise > 0) {
      await PlatformLedger.create({
        transactionType: 'commission_credit',
        amountPaise: split.adminPaise,
        reference: { kind: 'Order', id: orderId },
        source: { vendorId, schoolId: split.schoolBreakdown[0]?.schoolId || null },
        description: `Platform commission on order ${order.orderNumber}`,
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

  /**
   * Vendor-initiated withdrawal. The requested amount is validated against the
   * balance still available after any in-flight (pending/processing) payouts.
   */
  async createPayoutRequest(vendorId, amountPaise) {
    const amount = Math.round(Number(amountPaise) || 0);
    if (amount < 100) {
      throw new BadRequestError('Minimum payout amount is ₹1');
    }

    const summary = await this.getEarningsSummary(vendorId);
    const withdrawable = summary.availableBalancePaise - summary.pendingSettlementPaise;
    if (amount > withdrawable) {
      throw new BadRequestError('Requested amount exceeds available balance');
    }

    const vendor = await VendorProfile.findById(vendorId).lean();
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found');
    }
    const bank = vendor.bank || {};
    if (!bank.accountNumberEnc || !bank.ifsc) {
      throw new BadRequestError('Add your bank details before requesting a payout');
    }

    const accNum = bank.accountNumber || bank.accountNumberMasked || '';
    const payout = await PayoutRequest.create({
      vendorId,
      ownerType: 'vendor',
      payeeName: vendor.storeName,
      payeeType: 'vendor',
      amountPaise: amount,
      bankDetailsSnapshot: {
        accountName: bank.accountName,
        bankName: bank.bankName,
        branch: bank.branch,
        accountNumber: accNum,
        accountNumberEnc: bank.accountNumberEnc,
        accountNumberMasked: accNum,
        ifsc: bank.ifsc,
      },
      status: 'pending',
    });

    return payout.toObject();
  },

  async listPayoutRequests(vendorId, query) {
    return payoutRepository.paginatePayouts(vendorId, query);
  },
};

module.exports = settlementService;
