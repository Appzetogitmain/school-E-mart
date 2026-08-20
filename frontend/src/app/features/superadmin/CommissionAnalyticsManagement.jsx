import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IndianRupee, TrendingUp, Building2, Store, ShoppingCart, RefreshCw,
  Loader2, Search, Calculator, Sparkles, ShieldCheck, ArrowUpRight,
  ChevronRight, PieChart, Percent, CheckCircle2, Sliders, Layers
} from 'lucide-react';
import { getComprehensiveCommissionReport } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import CommissionCalculationGuideModal from '../../components/CommissionCalculationGuideModal';

const TABS = [
  { id: 'overview', label: 'Executive Overview', icon: PieChart },
  { id: 'schools', label: 'School Commissions', icon: Building2 },
  { id: 'vendors', label: 'Vendor Commissions', icon: Store },
  { id: 'calculator', label: 'Profit Split Calculator', icon: Calculator },
];

const parseDisplayVal = (val, defaultVal = '0') => {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'object') {
    if (val.$numberDecimal !== undefined) return String(val.$numberDecimal);
    return JSON.stringify(val);
  }
  return String(val);
};

const CommissionAnalyticsManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Profit Split Calculator local state
  const [calcPrice, setCalcPrice] = useState(1000);
  const [calcAdminRate, setCalcAdminRate] = useState(10);
  const [calcSchoolRate, setCalcSchoolRate] = useState(5);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getComprehensiveCommissionReport({ search: searchQuery });
      setReport(data || null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load commission & revenue analytics'));
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const overview = report?.overview || {};
  const channelBreakdown = report?.channelBreakdown || {};
  const schoolsList = report?.schools || [];
  const vendorsList = report?.vendors || [];

  // Filtered Schools & Vendors
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schoolsList;
    const term = searchQuery.toLowerCase().trim();
    return schoolsList.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.code?.toLowerCase().includes(term) ||
        s.city?.toLowerCase().includes(term)
    );
  }, [schoolsList, searchQuery]);

  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendorsList;
    const term = searchQuery.toLowerCase().trim();
    return vendorsList.filter(
      (v) =>
        v.storeName?.toLowerCase().includes(term) ||
        v.storeSlug?.toLowerCase().includes(term)
    );
  }, [vendorsList, searchQuery]);

  // Calculator Math
  const calcAdminEarn = Math.round((calcPrice * calcAdminRate) / 100);
  const calcSchoolEarn = Math.round((calcPrice * calcSchoolRate) / 100);
  const calcVendorEarn = Math.max(0, calcPrice - calcAdminEarn - calcSchoolEarn);

  return (
    <div className="p-6 space-y-6 font-outfit select-none">
      <CommissionCalculationGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1528] text-emerald-400 flex items-center justify-center shadow-lg border border-gray-800">
            <IndianRupee size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
              Commission & Finance Hub
            </h1>
            <p className="text-xs font-bold text-gray-400 mt-1">
              Comprehensive platform revenue, school commission shares, vendor payouts & profit calculations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-2xs"
          >
            <Calculator size={15} />
            <span>How Calculation Works</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-2xl text-xs font-black text-gray-700 shadow-2xs hover:shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Financials</span>
          </button>
        </div>
      </div>

      {/* 2. Top Executive Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Admin Platform Net Revenue */}
        <div className="bg-gradient-to-br from-[#0B1528] to-[#1E293B] text-white rounded-[2.2rem] p-5 shadow-xl relative overflow-hidden flex flex-col justify-between border border-gray-800">
          <div className="absolute right-2 top-2 opacity-10 text-emerald-400">
            <Sparkles size={80} />
          </div>
          <div>
            <div className="flex items-center justify-between text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Admin Net Profit</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-extrabold">{overview.effectiveSplit?.adminPercent || '10'}% avg</span>
            </div>
            <h3 className="text-3xl font-black mt-2 tracking-tight text-emerald-300">
              ₹{overview.adminCommissionRupees || '0.00'}
            </h3>
          </div>
          <p className="text-[11px] font-extrabold text-gray-300 mt-3 pt-3 border-t border-white/10">
            Total platform commission retained by Admin
          </p>
        </div>

        {/* School Commission Share Pool */}
        <div className="bg-white rounded-[2.2rem] p-5 shadow-sm border border-gray-150 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-purple-600"><Building2 size={14} /> School Earnings</span>
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-extrabold">{overview.effectiveSplit?.schoolPercent || '0'}% avg</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
              ₹{overview.schoolCommissionRupees || '0.00'}
            </h3>
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-3 pt-3 border-t border-gray-100">
            Total commission distributed to {overview.totalSchoolsCount || 0} schools
          </p>
        </div>

        {/* Vendor Net Payout Pool */}
        <div className="bg-white rounded-[2.2rem] p-5 shadow-sm border border-gray-150 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-blue-600"><Store size={14} /> Vendor Payouts</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-extrabold">{overview.effectiveSplit?.vendorPercent || '90'}% avg</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
              ₹{overview.vendorPayoutRupees || '0.00'}
            </h3>
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-3 pt-3 border-t border-gray-100">
            Net merchant payouts across {overview.totalVendorsCount || 0} vendors
          </p>
        </div>

        {/* Total GMV Sales Volume */}
        <div className="bg-white rounded-[2.2rem] p-5 shadow-sm border border-gray-150 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-indigo-600"><TrendingUp size={14} /> Gross Platform GMV</span>
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-full font-black">{overview.totalOrdersCount || 0} orders</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
              ₹{overview.totalGrossSalesRupees || '0.00'}
            </h3>
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-3 pt-3 border-t border-gray-100">
            Gross merchandise value processed
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 ${
                isActive
                  ? 'bg-[#0B1528] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      {/* 4. Tab Content Sections */}

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Class Kits Channel Breakdown */}
            <div className="bg-white rounded-[2.2rem] border border-gray-150 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Class Kit Sales Split</h3>
                    <p className="text-[10px] text-gray-400 font-bold">Orders placed for official school procurement kits</p>
                  </div>
                </div>
                <span className="text-base font-black text-gray-900">₹{channelBreakdown.kits?.salesRupees || '0.00'}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-500">Admin Commission Share:</span>
                  <span className="font-black text-emerald-600">₹{channelBreakdown.kits?.adminCommissionRupees || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-500">School Author Commission:</span>
                  <span className="font-black text-purple-600">₹{channelBreakdown.kits?.schoolCommissionRupees || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Vendor Net Payout:</span>
                  <span className="font-black text-blue-600">₹{channelBreakdown.kits?.vendorPayoutRupees || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Retail Store Channel Breakdown */}
            <div className="bg-white rounded-[2.2rem] border border-gray-150 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShoppingCart size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Retail Marketplace Sales Split</h3>
                    <p className="text-[10px] text-gray-400 font-bold">Individual products purchased from merchant store catalog</p>
                  </div>
                </div>
                <span className="text-base font-black text-gray-900">₹{channelBreakdown.retail?.salesRupees || '0.00'}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-500">Admin Commission Share:</span>
                  <span className="font-black text-emerald-600">₹{channelBreakdown.retail?.adminCommissionRupees || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-500">Linked School Commission:</span>
                  <span className="font-black text-purple-600">₹{channelBreakdown.retail?.schoolCommissionRupees || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Vendor Net Payout:</span>
                  <span className="font-black text-blue-600">₹{channelBreakdown.retail?.vendorPayoutRupees || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHOOL COMMISSIONS */}
      {activeTab === 'schools' && (
        <div className="bg-white rounded-[2.2rem] border border-gray-150 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search school name, code, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <span className="text-xs font-bold text-gray-400">
              Showing <strong className="text-gray-900 font-black">{filteredSchools.length}</strong> partner schools
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-4">School Details</th>
                  <th className="py-3.5 px-4">City</th>
                  <th className="py-3.5 px-4 text-center">Configured Rates</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Gross GMV Sales</th>
                  <th className="py-3.5 px-4 text-right">School Earned Share</th>
                  <th className="py-3.5 px-4 text-right">Admin Cut From School</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
                      Loading school financials...
                    </td>
                  </tr>
                ) : filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                      No schools found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSchools.map((s) => (
                    <tr key={s._id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-black text-xs shrink-0 overflow-hidden">
                            {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain" /> : s.name?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-xs">{s.name}</h4>
                            <span className="text-[10px] text-gray-400 font-mono">Code: {s.code || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{s.city || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[10px] font-black">
                          Kit: {parseDisplayVal(s.commissionConfig?.kitPercent)}% • Retail: {parseDisplayVal(s.commissionConfig?.retailPercent)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 bg-gray-100 rounded-xl font-black text-xs">{s.metrics.ordersCount}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-gray-900">₹{s.metrics.salesRupees}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-purple-700">₹{s.metrics.schoolCommissionRupees}</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl">
                          ₹{s.metrics.adminCommissionRupees}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR COMMISSIONS */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-[2.2rem] border border-gray-150 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search store name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <span className="text-xs font-bold text-gray-400">
              Showing <strong className="text-gray-900 font-black">{filteredVendors.length}</strong> vendors
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-4">Vendor Store</th>
                  <th className="py-3.5 px-4">Approval Status</th>
                  <th className="py-3.5 px-4 text-center">Commission Cut Rate</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Gross Store Sales</th>
                  <th className="py-3.5 px-4 text-right">Vendor Net Payout</th>
                  <th className="py-3.5 px-4 text-right">Admin Cut Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
                      Loading vendor financials...
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                      No vendors found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => (
                    <tr key={v._id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-black text-xs shrink-0 overflow-hidden">
                            {v.logo ? <img src={v.logo} alt={v.storeName} className="w-full h-full object-contain" /> : v.storeName?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-xs">{v.storeName}</h4>
                            <span className="text-[10px] text-gray-400 font-mono">@{v.storeSlug || 'vendor'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md text-[10px] font-black uppercase">
                          {v.approvalStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-md text-[10px] font-black">
                          {parseDisplayVal(v.commissionConfig?.commissionPercent)}% platform cut
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 bg-gray-100 rounded-xl font-black text-xs">{v.metrics.ordersCount}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-gray-900">₹{v.metrics.salesRupees}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-blue-700">₹{v.metrics.vendorNetPayoutRupees}</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl">
                          ₹{v.metrics.adminCommissionRupees}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROFIT SPLIT CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="bg-white rounded-[2.2rem] border border-gray-150 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Calculator size={18} className="text-emerald-600" />
              <span>Real-Time Profit & Commission Split Calculator</span>
            </h3>
            <p className="text-xs text-gray-400 font-bold mt-1">
              Simulate any order amount and test how admin profit, school commission, and vendor payout are calculated.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input Controls */}
            <div className="space-y-4 bg-gray-50 border border-gray-150 p-5 rounded-2xl">
              <div>
                <label className="text-xs font-black text-gray-700 block mb-1">Order Item Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-700 block mb-1">Admin Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={calcAdminRate}
                  onChange={(e) => setCalcAdminRate(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-700 block mb-1">School Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={calcSchoolRate}
                  onChange={(e) => setCalcSchoolRate(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Calculated Output Breakdown Cards */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Admin Net Revenue</span>
                  <span className="text-2xl font-black text-emerald-900 mt-2 block">₹{calcAdminEarn}</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-700 mt-3 pt-2 border-t border-emerald-200">
                  {calcAdminRate}% platform share retained
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-800 tracking-wider block">School Payout Share</span>
                  <span className="text-2xl font-black text-purple-900 mt-2 block">₹{calcSchoolEarn}</span>
                </div>
                <p className="text-[10px] font-bold text-purple-700 mt-3 pt-2 border-t border-purple-200">
                  {calcSchoolRate}% author/linked school share
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block">Vendor Net Payout</span>
                  <span className="text-2xl font-black text-blue-900 mt-2 block">₹{calcVendorEarn}</span>
                </div>
                <p className="text-[10px] font-bold text-blue-700 mt-3 pt-2 border-t border-blue-200">
                  {Math.max(0, 100 - calcAdminRate - calcSchoolRate)}% merchant payout remainder
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionAnalyticsManagement;
