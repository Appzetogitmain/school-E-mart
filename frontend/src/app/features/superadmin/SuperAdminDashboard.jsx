import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Layers, Box, Clipboard, CheckCircle, XCircle, AlertTriangle, TrendingDown, MapPin, Award,
  Eye, ChevronLeft, ChevronRight, Loader2, Wallet, RotateCcw, HelpCircle, Banknote, ArrowRight
} from 'lucide-react';
import { getDashboard, getOrderAnalytics, getFinanceOverview } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { formatRupee } from '../../../utils/mappers/productMapper';

const PENDING_ORDER_STATUSES = ['placed', 'accepted', 'processed', 'packed', 'shipped', 'out_for_delivery'];

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [orderAnalytics, setOrderAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [finance, setFinance] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [dashboard, orders, financeOverview] = await Promise.all([
          getDashboard({ limit: 5 }),
          getOrderAnalytics(),
          // Never blocks the dashboard: if the finance view fails the rest of
          // the page still renders, it simply hides the money section.
          getFinanceOverview({ limit: 5 }).catch(() => null),
        ]);
        if (cancelled) return;
        setOverview(dashboard?.overview || null);
        setRecentOrders(dashboard?.recentOrders || []);
        setOrderAnalytics(orders);
        setFinance(financeOverview);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load dashboard'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = overview?.totals || {};
  const statusBreakdown = orderAnalytics?.orderStatusBreakdown || {};
  const pendingOrders = PENDING_ORDER_STATUSES.reduce(
    (sum, status) => sum + (statusBreakdown[status] || 0),
    0
  );

  const stats = [
    { key: 'users', label: 'Total User', value: String(totals.users ?? 0), icon: User, color: 'bg-blue-50 text-blue-600 border-blue-100', path: '/superadmin/users' },
    { key: 'schools', label: 'Total Schools', value: String(totals.schools ?? 0), icon: Layers, color: 'bg-amber-50 text-amber-600 border-amber-100', path: '/superadmin/school-list' },
    { key: 'vendors', label: 'Total Vendors', value: String(totals.vendors ?? 0), icon: Layers, color: 'bg-pink-50 text-pink-600 border-pink-100', path: '/superadmin/vendor-list' },
    { key: 'products', label: 'Total Product', value: String(totals.products ?? 0), icon: Box, color: 'bg-rose-50 text-rose-600 border-rose-100', path: '/superadmin/product-list' },
    // 'orders' is now live orders only. It used to be a bare count of every
    // record, so cancelled and abandoned checkouts were presented as though they
    // were sales — 124 on a platform with 64 real orders.
    { key: 'orders', label: 'Live Orders', value: String(totals.orders ?? 0), icon: Clipboard, color: 'bg-sky-50 text-sky-600 border-sky-100', path: '/superadmin/orders' },
    { key: 'completed', label: 'Delivered Orders', value: String(totals.deliveredOrders ?? statusBreakdown.delivered ?? 0), icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', path: '/superadmin/orders?status=delivered' },
    { key: 'pending', label: 'Orders In Progress', value: String(totals.inProgressOrders ?? pendingOrders), icon: Clipboard, color: 'bg-purple-50 text-purple-600 border-purple-100', path: '/superadmin/orders?status=pending' },
    { key: 'cancelled', label: 'Cancelled Orders', value: String(totals.cancelledOrders ?? statusBreakdown.cancelled ?? 0), icon: XCircle, color: 'bg-red-50 text-red-600 border-red-100', path: '/superadmin/orders?status=cancelled' },
    { key: 'courses', label: 'Active Courses', value: String(totals.activeCourses ?? 0), icon: Box, color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100', path: '/superadmin/lms' },
    { key: 'lowStock', label: 'Product low on Stock', value: String(totals.lowStockProducts ?? 0), icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-600 border-yellow-100', path: '/superadmin/product-list?stock=low' },
  ];

  const revenueDisplay = formatRupee(orderAnalytics?.totalRevenuePaise || totals.revenuePaise || 0);

  // June 2026 days helper for left chart
  const juneDays = Array.from({ length: 30 }, (_, i) => `${String(i + 1).padStart(2, '0')}-Jun`);

  // Year 2026 months helper for right chart
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-8 pb-8 font-sans">

      {/* Page Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Console Overview</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Real-time status indicators and operations summary</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            System Live
          </span>
          <span className="text-[11px] text-gray-400 font-semibold">Last updated: Just now</span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={28} className="animate-spin mr-2" />
          <span className="text-sm font-bold">Loading dashboard…</span>
        </div>
      )}

      {!loading && (
      <>
      {/* 0. FINANCE — money that actually moved. Every figure is computed on the
          server from captured payments, not from order totals, so these can be
          compared against the Razorpay dashboard rupee for rupee. */}
      {finance && <FinanceSection finance={finance} navigate={navigate} />}

      {/* Recent orders — already fetched on every load, previously discarded. */}
      <RecentOrdersPanel orders={recentOrders} navigate={navigate} />

      {/* 1. GRID CARDS SECTION */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.key}
              type="button"
              onClick={() => navigate(stat.path)}
              className="bg-white p-5 rounded-[1.25rem] border border-gray-200 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md hover:border-indigo-200 active:scale-[0.98] transition-all group text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${stat.color} transition-transform group-hover:scale-105 duration-200`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <div className="mt-4 leading-tight">
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">{stat.label}</span>
                <span className="text-2xl font-black text-gray-950 block mt-1 tracking-tight">{stat.value}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. SALES CHARTS & SIDEBAR DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Total Sales Chart panel */}
        <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="leading-tight">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">Total Sales Today</span>
              <span className="text-3xl font-black text-gray-950 block mt-1.5 tracking-tight">{revenueDisplay}</span>
              <span className="text-gray-400 text-xs font-bold flex items-center gap-1.5 mt-2">
                <TrendingDown size={14} className="text-gray-300" />
                <span>₹0.00 vs same day last week</span>
              </span>
            </div>

            {/* Chart Legend indicators */}
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>This Month</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span>Last Month</span>
              </div>
            </div>
          </div>

          {/* SVG Custom Sales Graph matching mockup */}
          <div className="h-60 mt-6 relative flex items-end">
            <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="600" y2="50" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#F1F5F9" strokeWidth="1" />

              {/* Flat Last Month line at 0 (bottom y=198) */}
              <line x1="0" y1="198" x2="600" y2="198" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="4 4" />

              {/* Flat This Month line at 0 (bottom y=198) */}
              <line x1="0" y1="198" x2="600" y2="198" stroke="#3B82F6" strokeWidth="3" />
            </svg>

            {/* Axis Y Values labels */}
            <div className="absolute left-2 top-0 h-full flex flex-col justify-between text-[9px] font-black text-gray-400/80 pointer-events-none select-none">
              <span>₹3,000</span>
              <span>₹2,000</span>
              <span>₹1,000</span>
              <span>₹0</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mini Panels Group */}
        <div className="space-y-6">

          {/* Sales By Location card */}
          <div className="bg-white rounded-[1.5rem] border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Sales by Location</h3>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
            {(orderAnalytics?.salesByLocation || []).length === 0 ? (
              <p className="text-xs font-bold text-gray-400 py-2">No location data available</p>
            ) : (
              orderAnalytics.salesByLocation.map((loc) => (
                <div key={loc.city || loc.name} className="flex items-center justify-between py-2 border-b border-gray-50 w-full">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{loc.city || loc.name}</span>
                  </div>
                  <span className="font-extrabold text-sm text-gray-900">{formatRupee(loc.revenuePaise || 0)}</span>
                </div>
              ))
            )}
          </div>
          </div>

          {/* Average Order Value Card */}
          <div className="bg-white rounded-[1.5rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Avg. Completed Order Value</h3>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Award size={24} />
                </div>
                <div>
                  <span className="text-2xl font-black text-gray-950 tracking-tight">₹0.00</span>
                  <span className="text-[10px] font-bold text-gray-400 block mt-0.5">No completed orders yet</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. ORDER CHARTS ROW (CLEARED / FLAT STATS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">

        {/* Left Chart: Order - Jun 2026 (Flat line) */}
        <div className="bg-white rounded-[1.25rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
          <h2 className="text-base font-black text-gray-900 tracking-tight mb-4">Order - Jun 2026</h2>

          <div className="flex-1 flex items-stretch">
            {/* Y axis labels */}
            <div className="w-6 flex flex-col justify-between text-[10px] font-bold text-gray-400 text-right pr-2">
              <span>5</span>
              <span>4</span>
              <span>3</span>
              <span>2</span>
              <span>1</span>
              <span>0</span>
            </div>

            {/* SVG Plotting */}
            <div className="flex-1 border-b border-l border-gray-100 relative flex items-end pb-1 pl-1">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Horizontal grid guide lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="160" x2="500" y2="160" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />

                {/* June flat order line at Y=0 */}
                <line x1="0" y1="198" x2="500" y2="198" stroke="#8B5CF6" strokeWidth="3" />
              </svg>
            </div>
          </div>

          {/* Tilted X axis labels */}
          <div className="h-14 ml-6 overflow-hidden relative mt-2">
            <div className="flex justify-between w-full text-[8px] font-bold text-gray-400/90 whitespace-nowrap">
              {juneDays.map((day, idx) => (
                <div key={idx} className="w-[14px] origin-top-left rotate-[45deg] translate-y-2 translate-x-1">
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chart: Order - 2026 (Flat line) */}
        <div className="bg-white rounded-[1.25rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
          <h2 className="text-base font-black text-gray-900 tracking-tight mb-4">Order - 2026</h2>

          <div className="flex-1 flex items-stretch">
            {/* Y axis labels */}
            <div className="w-6 flex flex-col justify-between text-[10px] font-bold text-gray-400 text-right pr-2">
              <span>87</span>
              <span>67</span>
              <span>47</span>
              <span>27</span>
              <span>7</span>
              <span>-13</span>
            </div>

            {/* SVG Plotting */}
            <div className="flex-1 border-b border-l border-gray-100 relative flex items-end pb-1 pl-1">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Horizontal grid guide lines */}
                <line x1="0" y1="33" x2="500" y2="33" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="66" x2="500" y2="66" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="99" x2="500" y2="99" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="132" x2="500" y2="132" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="165" x2="500" y2="165" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />

                {/* Flat order line at Y=0 (bottom y=165) */}
                <line x1="0" y1="165" x2="500" y2="165" stroke="#8B5CF6" strokeWidth="3" />
              </svg>
            </div>
          </div>

          {/* Tilted X axis labels */}
          <div className="h-14 ml-6 overflow-hidden relative mt-2">
            <div className="flex justify-between w-full text-[9px] font-bold text-gray-400/90 whitespace-nowrap pl-2 pr-4">
              {months.map((month, idx) => (
                <div key={idx} className="w-[30px] origin-top-left rotate-[45deg] translate-y-3 translate-x-1">
                  {month}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. TABLES ROW (SHOWING CLEAN EMPTY STATES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">

        {/* Left Table: View New Orders */}
        <div className="bg-white rounded-[1.25rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h2 className="text-base font-black text-gray-900 tracking-tight">View New Orders</h2>

            {/* Show entries control */}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <span>Show</span>
              <select className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar min-h-[220px]">
            <table className="w-full text-left text-xs font-medium text-gray-600 border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">User Details</th>
                  <th className="py-3 px-2">O. Date</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="py-16 text-center text-xs font-bold text-gray-400 tracking-wide">
                    No records found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table pagination footer controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 text-xs font-bold text-gray-500">
            <span>Showing 0 to 0 of 0 entries</span>

            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400" disabled>
                <ChevronLeft size={14} />
              </button>
              <button className="w-7 h-7 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center" disabled>
                0
              </button>
              <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400" disabled>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Table: View Top Seller */}
        <div className="bg-white rounded-[1.25rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h2 className="text-base font-black text-gray-900 tracking-tight">View Top Seller</h2>

            {/* Show entries control */}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <span>Show</span>
              <select className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar flex-1 min-h-[220px]">
            <table className="w-full text-left text-xs font-medium text-gray-600 border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">Seller Name</th>
                  <th className="py-3 px-2">Store Name</th>
                  <th className="py-3 px-2">Total Revenue</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="py-16 text-center text-xs font-bold text-gray-400 tracking-wide">
                    No records found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table pagination footer controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 text-xs font-bold text-gray-500 shrink-0">
            <span>Showing 0 to 0 of 0 entries</span>

            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400" disabled>
                <ChevronLeft size={14} />
              </button>
              <button className="w-7 h-7 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center" disabled>
                0
              </button>
              <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400" disabled>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 5. FOOTER COPYRIGHT */}
      <footer className="text-center text-xs font-bold text-gray-400 pt-8 border-t border-gray-200/60 mt-6 shrink-0">
        Copyright © 2026. Developed By School E Mart
      </footer>
      </>
      )}

    </div>
  );
};

/**
 * The most recent orders, with payment state shown next to order state.
 *
 * The dashboard already fetched this and then threw it away — the data was
 * requested on every load and never rendered. Payment status is included
 * because an order's progress means very little without knowing whether it has
 * been paid for.
 */
const RecentOrdersPanel = ({ orders, navigate }) => {
  if (!orders?.length) return null;

  const orderTone = (status) => {
    if (status === 'delivered') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-100';
    if (['shipped', 'out_for_delivery'].includes(status)) return 'bg-sky-50 text-sky-700 border-sky-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  const payTone = (status) => {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'refunded') return 'bg-slate-100 text-slate-600 border-slate-200';
    if (status === 'failed') return 'bg-red-50 text-red-600 border-red-100';
    if (['refund_pending', 'partially_refunded'].includes(status))
      return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  const label = (value) =>
    String(value || '—')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

  return (
    <div className="bg-white rounded-[1.25rem] border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
          Recent orders
        </h3>
        <button
          type="button"
          onClick={() => navigate('/superadmin/orders')}
          className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 cursor-pointer"
        >
          View all
          <ArrowRight size={12} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100">
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
            {orders.map((o) => (
              <tr key={o._id || o.orderNumber} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 font-extrabold text-[#0B1528] tabular-nums whitespace-nowrap">
                  {o.orderNumber}
                </td>
                <td className="px-5 py-3 text-gray-600 max-w-[180px] truncate">
                  {o.address?.name || '—'}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap ${orderTone(o.orderStatus)}`}
                  >
                    {label(o.orderStatus)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap ${payTone(o.paymentStatus)}`}
                  >
                    {label(o.paymentStatus)}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-black text-gray-950 tabular-nums whitespace-nowrap">
                  {formatRupee(o.totalPaise || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Money cards and the exception queue.
 *
 * Split into three bands on purpose: what came in, what is owed or disputed,
 * and what is owed outwards. The middle band is the one that matters — it is
 * money the business is holding that belongs to somebody else, and before this
 * existed there was no screen anywhere that showed it.
 */
const FinanceSection = ({ finance, navigate }) => {
  const money = finance?.money || {};
  const exceptions = finance?.exceptions || {};
  const payables = finance?.payables || {};
  const owed = exceptions.owedToCustomers || {};
  const unpaid = exceptions.fulfilledUnpaid || {};
  const needsAttention = finance?.health?.needsAttention || 0;

  const moneyCards = [
    {
      key: 'collected',
      label: 'Collected',
      value: formatRupee(money.grossCollectedPaise || 0),
      icon: Banknote,
      tone: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      note: `${formatRupee(money.gatewayCollectedPaise || 0)} online · ${formatRupee(money.codCollectedPaise || 0)} COD`,
    },
    {
      key: 'refunded',
      label: 'Refunded',
      value: formatRupee(money.refundedPaise || 0),
      icon: RotateCcw,
      tone: 'bg-slate-50 text-slate-600 border-slate-200',
      note:
        money.refundInFlightPaise > 0
          ? `${formatRupee(money.refundInFlightPaise)} still settling`
          : 'All settled',
    },
    {
      key: 'net',
      label: 'Net Retained',
      value: formatRupee(money.netRetainedPaise || 0),
      icon: Wallet,
      tone: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      note: 'Collected less settled refunds',
    },
    {
      key: 'unresolved',
      label: 'Unconfirmed',
      value: formatRupee(money.unresolvedPaise || 0),
      icon: HelpCircle,
      tone:
        money.unresolvedCount > 0
          ? 'bg-amber-50 text-amber-600 border-amber-100'
          : 'bg-gray-50 text-gray-400 border-gray-200',
      note:
        money.unresolvedCount > 0
          ? `${money.unresolvedCount} payments never checked against the gateway`
          : 'Everything reconciled',
    },
  ];

  const payableRows = [
    ['Vendor earnings', payables.vendorEarningsPaise],
    ['School commission', payables.schoolCommissionPaise],
    ['Platform commission', payables.platformCommissionPaise],
    ['Paid out', payables.payouts?.paidPaise],
    ['Withdrawals pending', payables.payouts?.pendingPaise],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">Finance</h2>
          <p className="text-[11px] font-bold text-gray-400 mt-0.5">
            From payments actually captured — comparable with the Razorpay dashboard.
          </p>
        </div>
        {needsAttention > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
            <AlertTriangle size={12} />
            {needsAttention} need attention
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {moneyCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.key}
              className="bg-white p-5 rounded-[1.25rem] border border-gray-200 shadow-sm flex flex-col justify-between min-h-[140px]"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${c.tone}`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <div className="mt-4 leading-tight">
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">
                  {c.label}
                </span>
                <span className="text-2xl font-black text-gray-950 block mt-1 tracking-tight">
                  {c.value}
                </span>
                <span className="text-[10px] font-bold text-gray-400 block mt-1.5 leading-snug">
                  {c.note}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {(owed.count > 0 || unpaid.count > 0 || money.mismatchCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {owed.count > 0 && (
            <button
              type="button"
              onClick={() => navigate('/superadmin/orders?paymentStatus=refund_pending')}
              className="text-left bg-red-50 border border-red-200 rounded-[1.25rem] p-5 hover:border-red-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <AlertTriangle size={18} className="text-red-600 shrink-0" />
                <ArrowRight size={14} className="text-red-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-2xl font-black text-red-800 block mt-3 tracking-tight">
                {formatRupee(owed.totalPaise || 0)}
              </span>
              <span className="text-[11px] font-black text-red-700 uppercase tracking-wider block mt-1">
                Owed back to customers
              </span>
              <span className="text-[10px] font-bold text-red-600/80 block mt-1 leading-snug">
                {owed.count} paid for an order that was cancelled and never refunded
              </span>
            </button>
          )}

          {unpaid.count > 0 && (
            <button
              type="button"
              onClick={() => navigate('/superadmin/orders?paymentStatus=pending')}
              className="text-left bg-amber-50 border border-amber-200 rounded-[1.25rem] p-5 hover:border-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <TrendingDown size={18} className="text-amber-700 shrink-0" />
                <ArrowRight size={14} className="text-amber-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-2xl font-black text-amber-900 block mt-3 tracking-tight">
                {formatRupee(unpaid.totalPaise || 0)}
              </span>
              <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider block mt-1">
                Fulfilled, not paid for
              </span>
              <span className="text-[10px] font-bold text-amber-700/80 block mt-1 leading-snug">
                {unpaid.count} orders in fulfilment with no confirmed payment
              </span>
            </button>
          )}

          {money.mismatchCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/superadmin/orders')}
              className="text-left bg-orange-50 border border-orange-200 rounded-[1.25rem] p-5 hover:border-orange-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <HelpCircle size={18} className="text-orange-700 shrink-0" />
                <ArrowRight size={14} className="text-orange-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-2xl font-black text-orange-900 block mt-3 tracking-tight">
                {money.mismatchCount}
              </span>
              <span className="text-[11px] font-black text-orange-800 uppercase tracking-wider block mt-1">
                Gateway disagreements
              </span>
              <span className="text-[10px] font-bold text-orange-700/80 block mt-1 leading-snug">
                Razorpay and this system report different outcomes
              </span>
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-[1.25rem] border border-gray-200 shadow-sm p-5">
        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-4">
          Owed to vendors &amp; schools
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {payableRows.map(([label, value]) => (
            <div key={label}>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block leading-snug">
                {label}
              </span>
              <span className="text-lg font-black text-gray-950 block mt-1 tracking-tight">
                {formatRupee(value || 0)}
              </span>
            </div>
          ))}
        </div>
        {unpaid.count > 0 && (
          <p className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4 leading-snug">
            Commission above includes {unpaid.count} orders whose payment was never confirmed. Verify
            those before approving further withdrawals.
          </p>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

