import { formatOrderDateShort, paiseToRupees } from './orderMapper';

const TRANSACTION_TYPE_LABELS = {
  order_credit: 'Payments',
  commission_deduction: 'Commission',
  payout_debit: 'Withdrawal',
  adjustment: 'Adjustment',
  refund_debit: 'Refund',
};

export const mapVendorSettlementForLedger = (entry) => {
  const amount = paiseToRupees(entry?.amountPaise);
  const isCredit = Number(entry?.amountPaise || 0) >= 0;

  return {
    id: entry?._id?.toString?.()?.slice(-8)?.toUpperCase() || 'TXN',
    date: formatOrderDateShort(entry?.audit?.createdAt),
    customer: entry?.description || entry?.reference?.kind || 'Transaction',
    ref: `${entry?.reference?.kind || 'REF'}-${String(entry?.reference?.id || '').slice(-6)}`,
    amount: isCredit ? amount : -Math.abs(amount),
    type: TRANSACTION_TYPE_LABELS[entry?.transactionType] || 'Payments',
    status: entry?.transactionType === 'payout_debit' ? 'Pending' : 'Settled',
    raw: entry,
  };
};

export const mapVendorEarningsToWallet = (summary) => ({
  availableBal: paiseToRupees(summary?.availableBalancePaise),
  onHoldBal: paiseToRupees(summary?.pendingSettlementPaise),
  pendingBal: paiseToRupees(summary?.pendingSettlementPaise),
  totalRevenue: paiseToRupees(summary?.totalEarningsPaise),
  netEarnings: paiseToRupees(summary?.netEarningsPaise),
  settledBal: paiseToRupees(summary?.netEarningsPaise - summary?.pendingSettlementPaise),
});
