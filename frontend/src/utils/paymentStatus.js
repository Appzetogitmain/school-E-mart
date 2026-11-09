// One place that decides how an order's payment is shown to people (invoice, vendor
// orders, parent tracking, admin lists, exports).
//
// The raw `paymentStatus` alone is misleading for Cash on Delivery: the customer has
// not paid anything until the courier hands over the goods, so a COD order must read
// as unpaid until it is delivered. Showing "PAID" earlier made invoices claim money
// that had not been collected.

const TONE_CLASSES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  muted: 'bg-slate-100 text-slate-600 border-slate-200',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
};

const lower = (value) => String(value ?? '').trim().toLowerCase();

const result = (label, tone) => ({ label, tone, className: TONE_CLASSES[tone] || TONE_CLASSES.neutral });

export const COD_UNPAID_LABEL = 'UNPAID (Pay on Delivery)';

/**
 * @param {object} order
 * @param {string} order.paymentMethod       'cod' | 'online' (any case)
 * @param {string} order.paymentStatus       raw status from the backend
 * @param {string} [order.orderStatus]       raw order status, e.g. 'delivered'
 * @param {number} [order.walletAmountPaise] wallet money applied to the order
 * @param {number} [order.totalPaise]        order total
 * @returns {{ label: string, tone: string, className: string }}
 */
export const getPaymentDisplay = ({
  paymentMethod,
  paymentStatus,
  orderStatus,
  walletAmountPaise = 0,
  totalPaise = 0,
} = {}) => {
  const method = lower(paymentMethod);
  const status = lower(paymentStatus) || 'pending';
  const order = lower(orderStatus);
  const isCod = method === 'cod' || method === 'cash on delivery' || method === 'cash_on_delivery';

  // Money going back to the customer is the same story whatever the method.
  if (status === 'refunded') return result('REFUNDED', 'muted');
  if (status === 'partially_refunded') return result('PARTIALLY REFUNDED', 'warning');
  if (status === 'refund_pending') return result('REFUND PENDING', 'warning');
  if (status === 'failed') return result('FAILED', 'danger');

  if (isCod) {
    const walletCoversAll = Number(totalPaise) > 0 && Number(walletAmountPaise) >= Number(totalPaise);
    if (status === 'paid') {
      if (walletCoversAll) return result('PAID (Wallet)', 'success');
      // Cash is only collected at the door. A COD order flagged paid before delivery
      // (e.g. by a reconciliation script) is still owed.
      if (order === 'delivered') return result('PAID (Cash collected)', 'success');
      if (order === 'returned') return result('PAID (Cash collected)', 'success');
      return result(COD_UNPAID_LABEL, 'warning');
    }
    return result(COD_UNPAID_LABEL, 'warning');
  }

  if (status === 'paid') return result('PAID', 'success');
  if (status === 'partially_paid') return result('PARTIALLY PAID', 'info');
  if (status === 'authorized') return result('AUTHORIZED', 'warning');
  if (status === 'pending') return result('PENDING', 'warning');
  return result(status.replace(/_/g, ' ').toUpperCase(), 'neutral');
};

export const getPaymentStatusLabel = (order) => getPaymentDisplay(order).label;
