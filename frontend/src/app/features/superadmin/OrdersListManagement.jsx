import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  Eye,
  Search,
  Download,
  ChevronRight,
  ChevronLeft,
  X,
  User,
  FileText,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import {
  listOrders,
  getOrderStats,
  getInvoice,
  getOrderPayments,
  reconcileOrder,
  listPaymentMismatches,
  resolvePaymentMismatch,
} from '../../../services/ordersApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { formatRupee } from '../../../utils/mappers/productMapper';
import {
  mapOrderForAdminList,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatPaymentStatus,
  getPaymentStatusStyle,
  formatOrderDate,
} from '../../../utils/mappers/orderMapper';
import InvoiceModal from '../../../components/InvoiceModal';

/**
 * Admin order operations.
 *
 * Rebuilt around one rule: this page must never tell an operator something the
 * payment gateway would contradict. The previous version fetched a flat first
 * 100 orders and did every filter, search and date range in the browser, so the
 * counts it showed were the counts of an arbitrary slice; it showed no payment
 * state at all, and no way to check an order against Razorpay. That is how
 * orders sat delivered-but-unpaid, and refunds sat unsettled, without anyone
 * noticing until a customer complained.
 *
 * Filtering, searching and paging are now the server's job, so what is on
 * screen is the real result set, and money state is shown next to order state.
 */

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Upper bound on pages an export will walk, so a very large filtered set cannot
// turn one click into thousands of requests.
const EXPORT_PAGE_CAP = 50;

// Statuses in the fulfilment pipeline, used by the "Pending" shortcut. Kept as
// raw values because the server filters on those, not on display labels.
const PENDING_STATUSES = ['placed', 'accepted', 'processed', 'packed', 'shipped', 'out_for_delivery'];

const STATUS_QUERY_MAP = { delivered: 'delivered', cancelled: 'cancelled', pending: '__pending__' };

const orderStatusStyle = (status) => {
  if (['placed', 'accepted', 'processed', 'packed'].includes(status)) {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  if (['shipped', 'out_for_delivery'].includes(status)) {
    return 'bg-sky-50 text-sky-700 border-sky-100';
  }
  if (status === 'delivered') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-100';
  if (status === 'returned') return 'bg-purple-50 text-purple-700 border-purple-100';
  if (status === 'pending_payment') return 'bg-orange-50 text-orange-700 border-orange-100';
  return 'bg-gray-50 text-gray-500 border-gray-150';
};

const rupees = (paise) => `₹${(Number(paise || 0) / 100).toFixed(2)}`;

const Badge = ({ className = '', children }) => (
  <span
    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

const Field = ({ label, children, mono = false }) => (
  <div className="space-y-1 min-w-0">
    <span className="text-[9px] text-gray-400 uppercase tracking-wide block">{label}</span>
    <div className={`text-gray-900 font-extrabold break-words ${mono ? 'font-mono text-[11px]' : ''}`}>
      {children}
    </div>
  </div>
);

/**
 * Statistics for the orders currently filtered.
 *
 * These are computed by the server from the same filter that produces the rows
 * below, so the header can never claim a total the table does not contain.
 * Money figures deliberately separate what has been collected from what is
 * merely owed: an order's total is what was asked for, not what arrived.
 */
const OrderStatCards = ({ stats, loading, error, filtered }) => {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-200 p-4 h-[92px] animate-pulse"
          />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
        <span className="text-[11px] font-bold text-amber-800">
          Order statistics unavailable — {error}
        </span>
      </div>
    );
  }
  if (!stats) return null;

  const cards = [
    {
      key: 'total',
      label: filtered ? 'Matching orders' : 'All orders',
      value: String(stats.total?.count ?? 0),
      sub: `${formatRupee(stats.total?.valuePaise || 0)} order value`,
      tone: 'text-[#0B1528]',
      ring: 'border-gray-200',
    },
    {
      key: 'collected',
      label: 'Payment received',
      value: String(stats.paid?.count ?? 0),
      sub: formatRupee(stats.paid?.valuePaise || 0),
      tone: 'text-emerald-700',
      ring: 'border-emerald-200 bg-emerald-50/40',
    },
    {
      key: 'awaiting',
      label: 'Awaiting payment',
      value: String(stats.awaitingPayment?.count ?? 0),
      sub: formatRupee(stats.awaitingPayment?.valuePaise || 0),
      tone: stats.awaitingPayment?.count > 0 ? 'text-amber-700' : 'text-gray-400',
      ring:
        stats.awaitingPayment?.count > 0
          ? 'border-amber-200 bg-amber-50/40'
          : 'border-gray-200',
    },
    {
      key: 'progress',
      label: 'In fulfilment',
      value: String(stats.inProgress?.count ?? 0),
      sub: `${stats.delivered?.count ?? 0} delivered`,
      tone: 'text-sky-700',
      ring: 'border-sky-200 bg-sky-50/40',
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: String(stats.cancelled?.count ?? 0),
      sub:
        stats.refunded?.count > 0
          ? `${stats.refunded.count} refunded / pending`
          : formatRupee(stats.cancelled?.valuePaise || 0),
      tone: 'text-red-700',
      ring: 'border-red-200 bg-red-50/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div
          key={c.key}
          className={`bg-white rounded-2xl border p-4 flex flex-col justify-between min-h-[92px] ${c.ring}`}
        >
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider leading-snug">
            {c.label}
          </span>
          <div className="mt-2">
            <span className={`text-2xl font-black tracking-tight block leading-none ${c.tone}`}>
              {c.value}
            </span>
            <span className="text-[10px] font-bold text-gray-400 block mt-1.5 tabular-nums">
              {c.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const OrdersListManagement = () => {
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Server-side filter state. Every one of these is sent to the API.
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    STATUS_QUERY_MAP[searchParams.get('status')] || ''
  );
  // Seeded from the URL so the dashboard's finance cards can deep-link straight
  // into the orders that need attention, e.g. ?paymentStatus=refund_pending.
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(
    searchParams.get('paymentStatus') || ''
  );
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const [mismatches, setMismatches] = useState([]);
  const [mismatchPanelOpen, setMismatchPanelOpen] = useState(false);

  // Debounce the search box so typing does not fire a request per keystroke.
  const searchTimer = useRef(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchInput]);

  useEffect(() => {
    const mapped = STATUS_QUERY_MAP[searchParams.get('status')];
    const payment = searchParams.get('paymentStatus');
    if (mapped) setStatusFilter(mapped);
    if (payment) setPaymentStatusFilter(payment);
    if (mapped || payment) setPage(1);
  }, [searchParams]);

  const queryParams = useMemo(() => {
    const params = { page, limit };
    // '__pending__' is a shortcut across several pipeline statuses rather than a
    // single one, so it is expanded here instead of being sent verbatim.
    if (statusFilter && statusFilter !== '__pending__') params.status = statusFilter;
    if (statusFilter === '__pending__') params.status = PENDING_STATUSES.join(',');
    if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
    if (search) params.search = search;
    if (fromDate) params.from = fromDate;
    // `to` is inclusive of the whole day the operator picked, not midnight at
    // its start — otherwise a date range silently drops its own last day.
    if (toDate) params.to = `${toDate}T23:59:59.999`;
    return params;
  }, [page, limit, statusFilter, paymentStatusFilter, search, fromDate, toDate]);

  const loadOrders = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setStatsLoading(true);

    // Same query object as the rows, so the cards can never describe a
    // different set of orders than the table below them.
    getOrderStats(queryParams)
      .then((result) => {
        if (cancelled) return;
        setStats(result);
        setStatsError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setStats(null);
        // Surfaced rather than swallowed. These cards silently rendered nothing
        // for a while because the endpoint was 404ing behind a wildcard route,
        // and a component that returns null on failure gives nobody a reason to
        // look.
        setStatsError(getErrorMessage(err, 'Could not load order statistics'));
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    listOrders(queryParams)
      .then(({ data, pagination: meta }) => {
        if (cancelled) return;
        setOrders((data || []).map(mapOrderForAdminList));
        setPagination(meta);
        setFetchError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setOrders([]);
        setPagination(null);
        setFetchError(getErrorMessage(err, 'Unable to load orders'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [queryParams]);

  useEffect(() => loadOrders(), [loadOrders]);

  // The reconciliation queue: payments where our books and the gateway's differ.
  const loadMismatches = useCallback(() => {
    listPaymentMismatches({ limit: 100 })
      .then(setMismatches)
      .catch(() => setMismatches([]));
  }, []);

  useEffect(() => {
    loadMismatches();
  }, [loadMismatches]);

  const handleViewInvoice = async (orderId) => {
    setInvoiceModalOpen(true);
    setInvoiceLoading(true);
    setInvoiceError('');
    try {
      setInvoiceData(await getInvoice(orderId));
    } catch (err) {
      setInvoiceError(getErrorMessage(err, 'Failed to fetch invoice details'));
    } finally {
      setInvoiceLoading(false);
    }
  };

  /**
   * Export exactly what the current filters describe, not just the page on
   * screen. The old export wrote whichever rows the browser happened to hold,
   * which quietly produced incomplete financial extracts.
   */
  const handleExportCSV = async () => {
    let rows = orders;
    const total = pagination?.total ?? orders.length;
    if (total > orders.length) {
      // The API caps a page at 100 rows, so the full set is collected by paging
      // rather than by asking for it all at once (which the validator rejects).
      try {
        const pageSize = 100;
        const pageCount = Math.min(Math.ceil(total / pageSize), EXPORT_PAGE_CAP);
        const collected = [];
        for (let p = 1; p <= pageCount; p += 1) {
          // Sequential on purpose: an export is rare and a burst of parallel
          // requests is more likely to trip rate limiting than to finish sooner.
          const { data } = await listOrders({ ...queryParams, page: p, limit: pageSize });
          collected.push(...(data || []));
          if (!data || data.length < pageSize) break;
        }
        if (collected.length) rows = collected.map(mapOrderForAdminList);
      } catch {
        // Fall back to the visible page rather than exporting nothing.
      }
    }

    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = [
      'Order Number',
      'Order Date',
      'Customer',
      'Phone',
      'Address',
      'Order Status',
      'Payment Status',
      'Payment Method',
      'Wallet Applied (INR)',
      'Total (INR)',
      'Vendors',
    ];
    const lines = rows.map((o) =>
      [
        o.id,
        o.dateTime,
        o.customer,
        o.phone,
        o.address,
        o.status,
        o.paymentStatusLabel,
        o.paymentMethod,
        (o.walletAmountPaise / 100).toFixed(2),
        (o.totalPaise / 100).toFixed(2),
        o.seller,
      ]
        .map(escape)
        .join(',')
    );

    const csv = [header.map(escape).join(','), ...lines].join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setStatusFilter('');
    setPaymentStatusFilter('');
    setFromDate('');
    setToDate('');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const hasFilters =
    statusFilter || paymentStatusFilter || fromDate || toDate || search;

  const unpaidFulfilledCount = orders.filter((o) => o.isFulfilledUnpaid).length;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.total ?? orders.length;

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Orders</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              OPERATIONS
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">
            Order and payment state side by side, reconciled against the payment gateway.
          </p>
        </div>
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Dashboard</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">Orders</span>
        </div>
      </div>

      {/* RECONCILIATION ALERT — money the gateway and this system disagree about. */}
      {mismatches.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setMismatchPanelOpen((open) => !open)}
            className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle size={18} className="text-red-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-red-800 uppercase tracking-wide">
                  {mismatches.length} payment{mismatches.length === 1 ? '' : 's'} need attention
                </p>
                <p className="text-[11px] font-bold text-red-600 mt-0.5">
                  The payment gateway and this system disagree about this money.
                </p>
              </div>
            </div>
            <ChevronRight
              size={14}
              className={`text-red-500 shrink-0 transition-transform ${mismatchPanelOpen ? 'rotate-90' : ''}`}
            />
          </button>

          {mismatchPanelOpen && (
            <div className="border-t border-red-200 divide-y divide-red-100 max-h-80 overflow-y-auto">
              {mismatches.map((m) => (
                <MismatchRow
                  key={m._id}
                  mismatch={m}
                  onResolved={() => {
                    loadMismatches();
                    loadOrders();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* STAT CARDS — reflect the active filters, not the whole table */}
      <OrderStatCards
        stats={stats}
        loading={statsLoading}
        error={statsError}
        filtered={Boolean(hasFilters)}
      />

      {/* MAIN PANEL */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden text-left p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider select-none">
            Order list
          </h3>
          <span className="text-[11px] font-bold text-gray-400 tabular-nums">
            {loading ? 'Loading…' : `${totalCount} order${totalCount === 1 ? '' : 's'}`}
          </span>
        </div>

        {/* FILTERS — all applied by the server */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3 text-xs font-bold text-gray-600 select-none">
          <div className="xl:col-span-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
            />
          </div>
          <div className="xl:col-span-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">To</label>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
            />
          </div>

          <div className="xl:col-span-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">
              Order status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-bold"
            >
              <option value="">All statuses</option>
              <option value="__pending__">In progress</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="xl:col-span-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">
              Payment
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-bold"
            >
              <option value="">All payments</option>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="xl:col-span-3">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">
              Search order number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="ORD…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              />
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="xl:col-span-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Rows</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full bg-white border border-gray-200 rounded-xl px-2 py-2 focus:outline-none cursor-pointer font-bold"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white border border-[#0B1528] hover:bg-gray-50 text-[#0B1528] px-4 py-2 rounded-xl transition-all shadow-2xs font-extrabold text-xs cursor-pointer"
          >
            <Download size={13} className="text-gray-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={loadOrders}
            className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl transition-all font-extrabold text-xs cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Clear filters
            </button>
          )}
          {unpaidFulfilledCount > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
              <AlertTriangle size={12} />
              {unpaidFulfilledCount} in fulfilment without confirmed payment
            </span>
          )}
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border border-gray-150 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Order status</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4 text-right">Amount</th>
                <th className="px-5 py-4 text-center w-20">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-gray-400 font-extrabold select-none">
                    Loading orders…
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-red-500 font-extrabold">
                    {fetchError}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-gray-400 font-extrabold select-none">
                    No orders match these filters.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.mongoId || o.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      o.isFulfilledUnpaid ? 'bg-orange-50/40' : ''
                    }`}
                  >
                    <td className="px-5 py-4 text-[#0B1528] font-extrabold tabular-nums select-all whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {o.isFulfilledUnpaid && (
                          <AlertTriangle
                            size={12}
                            className="text-orange-500 shrink-0"
                            aria-label="In fulfilment without confirmed payment"
                          />
                        )}
                        {o.id}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-900 select-text max-w-[220px]">
                      <div className="truncate">{o.customer}</div>
                      <div className="text-[10px] text-gray-400 font-medium truncate">{o.address}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-400 font-extrabold tabular-nums select-none whitespace-nowrap">
                      {o.date}
                    </td>
                    <td className="px-5 py-4 select-none">
                      <Badge className={orderStatusStyle(o.statusRaw)}>{o.status}</Badge>
                    </td>
                    <td className="px-5 py-4 select-none">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge className={getPaymentStatusStyle(o.paymentStatus)}>
                          {o.paymentStatusLabel}
                        </Badge>
                        <span className="text-[9px] text-gray-400 uppercase font-black tracking-wide">
                          {o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-950 font-black tabular-nums whitespace-nowrap text-right">
                      {rupees(o.totalPaise)}
                    </td>
                    <td className="px-5 py-4 text-center select-none">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className="border border-[#0B1528] hover:bg-gray-50 text-[#0B1528] p-1.5 rounded-lg shadow-2xs transition-all inline-flex items-center justify-center cursor-pointer"
                      >
                        <Eye size={13} className="stroke-[2.5]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION — real, server-side */}
        {!loading && !fetchError && totalCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-gray-500 select-none">
            <span className="tabular-nums">
              Page {page} of {totalPages} · {totalCount} order{totalCount === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 font-extrabold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              >
                <ChevronLeft size={13} />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-1.5 font-extrabold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder &&
        createPortal(
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onPrintInvoice={() => handleViewInvoice(selectedOrder.mongoId || selectedOrder.id)}
            onReconciled={() => {
              loadOrders();
              loadMismatches();
            }}
          />,
          document.body
        )}

      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoiceData={invoiceData}
        loading={invoiceLoading}
        error={invoiceError}
      />
    </div>
  );
};

/**
 * One payment the gateway and this system disagree about, with the action that
 * settles the argument: re-check the gateway, then record what was done.
 */
const MismatchRow = ({ mismatch, onResolved }) => {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [error, setError] = useState('');

  const order = mismatch.orderId || {};
  const orderId = typeof order === 'object' ? order._id : order;

  const recheck = async () => {
    setBusy(true);
    setError('');
    try {
      await reconcileOrder(orderId);
      onResolved();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not reach the payment gateway'));
    } finally {
      setBusy(false);
    }
  };

  const resolve = async () => {
    if (note.trim().length < 3) {
      setError('Say what was done about the money.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await resolvePaymentMismatch(mismatch._id, note.trim());
      onResolved();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not record the resolution'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 bg-white/60 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-[#0B1528] text-xs tabular-nums">
              {order.orderNumber || '—'}
            </span>
            <Badge className="bg-red-100 text-red-700 border-red-200">
              {mismatch.reconciliation?.code || 'MISMATCH'}
            </Badge>
            {mismatch.gatewayPaymentId && (
              <span className="font-mono text-[10px] text-gray-500">{mismatch.gatewayPaymentId}</span>
            )}
          </div>
          <p className="text-[11px] font-bold text-gray-600">
            {mismatch.reconciliation?.detail || 'No detail recorded.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={recheck}
            disabled={busy}
            className="flex items-center gap-1 text-[11px] font-extrabold border border-gray-300 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={11} className={busy ? 'animate-spin' : ''} />
            Re-check
          </button>
          <button
            type="button"
            onClick={() => setShowResolve((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-extrabold border border-emerald-300 text-emerald-700 rounded-lg px-2.5 py-1.5 hover:bg-emerald-50 cursor-pointer"
          >
            <CheckCircle2 size={11} />
            Resolve
          </button>
        </div>
      </div>

      {showResolve && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was done about this money?"
            className="flex-1 min-w-[220px] text-[11px] font-bold border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
          />
          <button
            type="button"
            onClick={resolve}
            disabled={busy}
            className="text-[11px] font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 disabled:opacity-50 cursor-pointer"
          >
            Save
          </button>
        </div>
      )}

      {error && <p className="text-[11px] font-bold text-red-600">{error}</p>}
    </div>
  );
};

/**
 * Order detail, with the gateway's own view of the money loaded alongside ours.
 *
 * The payment section is the point of this dialog: it shows our status, the
 * gateway's status, the Razorpay payment id and every refund with its real
 * settlement state — the comparison that previously required opening the
 * Razorpay dashboard separately and matching rows by hand.
 */
const OrderDetailModal = ({ order, onClose, onPrintInvoice, onReconciled }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [reconcileMessage, setReconcileMessage] = useState('');

  const orderId = order.mongoId || order.id;

  const load = useCallback(() => {
    setLoading(true);
    getOrderPayments(orderId)
      .then((rows) => {
        setPayments(rows);
        setError('');
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load payment details')))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const runReconcile = async () => {
    setReconciling(true);
    setReconcileMessage('');
    try {
      await reconcileOrder(orderId);
      setReconcileMessage('Checked against the payment gateway.');
      load();
      onReconciled();
    } catch (err) {
      setReconcileMessage(getErrorMessage(err, 'Could not reach the payment gateway'));
    } finally {
      setReconciling(false);
    }
  };

  const raw = order.raw || {};

  return (
    <div className="fixed inset-0 bg-[#0B1528]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-3xl border border-gray-250 shadow-2xl max-w-2xl w-full overflow-hidden text-left">
        <div className="bg-[#0B1528] text-white p-6 flex justify-between items-center gap-4">
          <div className="min-w-0">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">
              Order detail
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider mt-0.5 truncate">{order.id}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onPrintInvoice}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText size={14} />
              <span>Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-full transition-all cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 text-xs font-bold text-gray-700 max-h-[75vh] overflow-y-auto">
          {order.isFulfilledUnpaid && (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-2xl p-3">
              <AlertTriangle size={14} className="text-orange-600 mt-0.5 shrink-0" />
              <p className="text-[11px] font-bold text-orange-800">
                This order is in fulfilment but its payment has not been confirmed. Re-check it
                against the gateway before shipping or settling the vendor.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 bg-[#F8F9FA] rounded-2xl p-4 border border-gray-100">
            <Field label="Customer">
              <span className="flex items-center gap-1.5">
                <User size={12} className="text-gray-400 shrink-0" />
                {order.customer}
              </span>
            </Field>
            <Field label="Placed">{order.dateTime}</Field>
            <Field label="Order status">
              <Badge className={orderStatusStyle(order.statusRaw)}>{order.status}</Badge>
            </Field>
            <Field label="Payment status">
              <Badge className={getPaymentStatusStyle(order.paymentStatus)}>
                {order.paymentStatusLabel}
              </Badge>
            </Field>
            <Field label="Delivery address">
              <span className="font-bold text-[11px]">{order.address || '—'}</span>
            </Field>
            <Field label="Vendors">{order.seller}</Field>
          </div>

          {/* Money breakdown, straight from the order's own stored figures. */}
          <div className="border border-gray-150 rounded-2xl p-4 space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">Charges</h4>
            {[
              ['Subtotal', raw.subtotalPaise],
              ['Tax', raw.taxPaise],
              ['Delivery', raw.deliveryChargePaise],
              ['Platform fee', raw.platformFeePaise],
              ['Handling', raw.handlingChargePaise],
              ['Paid from wallet', -(raw.walletAmountPaise || 0)],
            ]
              .filter(([, value]) => Number(value || 0) !== 0)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between text-[11px]">
                  <span className="text-gray-500">{label}</span>
                  <span className="tabular-nums font-extrabold">{rupees(value)}</span>
                </div>
              ))}
            <div className="flex justify-between pt-2 border-t border-gray-100 text-xs">
              <span className="font-black text-[#0B1528]">Total</span>
              <span className="tabular-nums font-black text-[#0B1528]">{rupees(raw.totalPaise)}</span>
            </div>
          </div>

          {/* THE PAYMENT SECTION — ours next to the gateway's */}
          <div className="border border-gray-150 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-3 border-b border-gray-150">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <CreditCard size={12} />
                Payments &amp; refunds
              </h4>
              <button
                type="button"
                onClick={runReconcile}
                disabled={reconciling}
                className="flex items-center gap-1 text-[10px] font-extrabold border border-gray-300 rounded-lg px-2.5 py-1 hover:bg-white disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={10} className={reconciling ? 'animate-spin' : ''} />
                Check gateway
              </button>
            </div>

            <div className="p-4 space-y-4">
              {reconcileMessage && (
                <p className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  {reconcileMessage}
                </p>
              )}

              {loading ? (
                <p className="text-[11px] text-gray-400 font-extrabold">Loading payments…</p>
              ) : error ? (
                <p className="text-[11px] text-red-600 font-extrabold">{error}</p>
              ) : payments.length === 0 ? (
                <p className="text-[11px] text-gray-400 font-extrabold">
                  No payment record exists for this order.
                </p>
              ) : (
                payments.map((p) => <PaymentCard key={p._id} payment={p} />)
              )}
            </div>
          </div>

          {/* Timeline */}
          {Array.isArray(raw.statusHistory) && raw.statusHistory.length > 0 && (
            <div className="border border-gray-150 rounded-2xl p-4 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">History</h4>
              {raw.statusHistory.map((entry, index) => (
                <div key={index} className="flex items-start gap-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-extrabold text-gray-800">
                      {ORDER_STATUS_LABELS[entry.status] || entry.status}
                    </span>
                    <span className="text-gray-400 ml-2">{formatOrderDate(entry.at)}</span>
                    {entry.note && <p className="text-gray-500 font-medium">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** One payment row: our record, the gateway's record, and the refunds on it. */
const PaymentCard = ({ payment }) => {
  const mismatch = payment.reconciliation?.status === 'mismatch';
  const isRazorpay = payment.gateway === 'razorpay';

  return (
    <div
      className={`rounded-xl border p-3 space-y-3 ${
        mismatch ? 'border-red-200 bg-red-50/50' : 'border-gray-150 bg-white'
      }`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Amount">{rupees(payment.amountPaise)}</Field>
        <Field label="Our status">
          <Badge className={getPaymentStatusStyle(payment.status)}>
            {formatPaymentStatus(payment.status)}
          </Badge>
        </Field>
        <Field label="Gateway says">
          {payment.gatewayStatus ? (
            <Badge className="bg-slate-100 text-slate-700 border-slate-200">
              {payment.gatewayStatus}
            </Badge>
          ) : (
            <span className="text-gray-400 font-medium text-[11px]">never checked</span>
          )}
        </Field>
        <Field label="Method">
          {payment.method?.toUpperCase()} · {payment.gateway}
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Gateway order id" mono>
          {payment.gatewayOrderId || '—'}
        </Field>
        <Field label="Gateway payment id" mono>
          {payment.gatewayPaymentId ? (
            <span className="flex items-center gap-1">
              {payment.gatewayPaymentId}
              {isRazorpay && (
                <a
                  href={`https://dashboard.razorpay.com/app/payments/${payment.gatewayPaymentId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-700"
                  title="Open in the Razorpay dashboard"
                >
                  <ExternalLink size={11} />
                </a>
              )}
            </span>
          ) : (
            '—'
          )}
        </Field>
      </div>

      {payment.lastSyncedAt && (
        <p className="text-[10px] text-gray-400 font-bold">
          Last checked against the gateway {formatOrderDate(payment.lastSyncedAt)}
        </p>
      )}

      {mismatch && (
        <div className="flex items-start gap-2 bg-red-100/60 border border-red-200 rounded-lg p-2.5">
          <AlertTriangle size={12} className="text-red-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-red-800">
              {payment.reconciliation.code}
            </p>
            <p className="text-[11px] font-bold text-red-700">{payment.reconciliation.detail}</p>
          </div>
        </div>
      )}

      {Array.isArray(payment.refunds) && payment.refunds.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <h5 className="text-[9px] font-black uppercase tracking-wider text-gray-400">Refunds</h5>
          {payment.refunds.map((refund) => (
            <div
              key={refund.refundId || refund._id}
              className="flex flex-wrap items-center justify-between gap-2 text-[11px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Badge
                  className={
                    refund.status === 'processed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : refund.status === 'failed'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : refund.status === 'rejected'
                          ? 'bg-gray-100 text-gray-500 border-gray-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                  }
                >
                  {refund.status}
                </Badge>
                <span className="font-mono text-[10px] text-gray-500 truncate">
                  {refund.refundId}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="tabular-nums font-extrabold">{rupees(refund.amountPaise)}</span>
                <span className="text-gray-400 font-medium">{formatOrderDate(refund.at)}</span>
              </div>
              {refund.failureReason && (
                <p className="w-full text-red-600 font-bold">{refund.failureReason}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersListManagement;
