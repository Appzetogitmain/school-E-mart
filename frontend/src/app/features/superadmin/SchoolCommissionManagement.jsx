import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  School, Search, RefreshCw, Loader2, IndianRupee, TrendingUp,
  Package, ShoppingCart, Building2, CheckCircle2, ChevronRight,
  Sparkles, ShieldCheck, ArrowUpRight, Award
} from 'lucide-react';
import { getSchoolCommissionReport } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const SchoolCommissionManagement = () => {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSchoolCommissionReport({ limit: 100, search: searchQuery });
      setReportData(res.data || []);
      setSummary(res.summary || null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load school commission earnings report'));
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

  // Client-side search filtering
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return reportData;
    const term = searchQuery.toLowerCase().trim();
    return reportData.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.code?.toLowerCase().includes(term) ||
        s.city?.toLowerCase().includes(term) ||
        s.state?.toLowerCase().includes(term)
    );
  }, [reportData, searchQuery]);

  return (
    <div className="p-6 space-y-6 font-outfit select-none">
      {/* 1. Page Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-100">
              <IndianRupee size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">School Commission Earnings</h1>
              <p className="text-xs font-bold text-gray-400 mt-1">
                Track exact platform commission earnings and gross sales generated per school.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-2xl text-xs font-black text-gray-700 shadow-2xs hover:shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 2. Top Executive Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Admin Commission Earned Card */}
        <div className="bg-gradient-to-br from-[#0B1528] to-[#1E293B] text-white rounded-[2.2rem] p-5 shadow-xl relative overflow-hidden flex flex-col justify-between border border-gray-800">
          <div className="absolute right-3 top-3 opacity-10 text-emerald-400">
            <Sparkles size={80} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={14} />
              <span>Admin Revenue</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-emerald-300">
              ₹{summary?.totalPlatformCommissionRupees || '0.00'}
            </h3>
          </div>
          <p className="text-[11px] font-extrabold text-gray-300 mt-3 pt-3 border-t border-white/10 flex items-center gap-1">
            <span>Total platform commission earned across schools</span>
          </p>
        </div>

        {/* Gross Sales Generated Card */}
        <div className="bg-white rounded-[2.2rem] p-5 shadow-sm border border-gray-150 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp size={14} className="text-indigo-600" />
              <span>Total Sales Volume</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
              ₹{summary?.totalSalesRupees || '0.00'}
            </h3>
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-3 pt-3 border-t border-gray-100">
            Gross merchandise value from all school orders
          </p>
        </div>

        {/* Total Orders Processed Card */}
        <div className="bg-white rounded-[2.2rem] p-5 shadow-sm border border-gray-150 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <ShoppingCart size={14} className="text-purple-600" />
              <span>Total Orders</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
              {summary?.totalOrdersCount || 0}
            </h3>
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-3 pt-3 border-t border-gray-100">
            School-linked customer and bulk orders
          </p>
        </div>

        {/* Active Schools Count Card */}
        <div className="bg-white rounded-[2.2rem] p-5 shadow-sm border border-gray-150 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <Building2 size={14} className="text-emerald-600" />
              <span>Partner Schools</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
              {summary?.totalSchoolsCount || filteredSchools.length}
            </h3>
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-3 pt-3 border-t border-gray-100">
            Onboarded schools earning & contributing commission
          </p>
        </div>
      </div>

      {/* 3. Search Bar and Table Container */}
      <div className="bg-white rounded-[2.2rem] border border-gray-150 shadow-sm overflow-hidden p-6 space-y-4">
        {/* Search Input */}
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

          <div className="text-xs font-extrabold text-gray-400">
            Showing <span className="text-gray-900 font-black">{filteredSchools.length}</span> schools
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                <th className="py-3.5 px-4">School Details</th>
                <th className="py-3.5 px-4">City / State</th>
                <th className="py-3.5 px-4 text-center">Commission Rates</th>
                <th className="py-3.5 px-4 text-center">Orders</th>
                <th className="py-3.5 px-4 text-right">Gross Sales</th>
                <th className="py-3.5 px-4 text-right">School Revenue</th>
                <th className="py-3.5 px-4 text-right">Admin Commission</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
                    <span className="text-xs text-gray-400 font-bold">Calculating school commissions...</span>
                  </td>
                </tr>
              ) : filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <School size={36} className="mx-auto mb-2 text-gray-300" />
                    <p className="font-black text-sm text-gray-600">No schools found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredSchools.map((s) => (
                  <tr key={s._id} className="hover:bg-purple-50/20 transition-colors">
                    {/* School Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 p-1 shrink-0 overflow-hidden flex items-center justify-center text-purple-700 font-black text-sm">
                          {s.logo ? (
                            <img src={s.logo} alt={s.name} className="w-full h-full object-contain" />
                          ) : (
                            s.name?.charAt(0) || 'S'
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-xs leading-snug">{s.name}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">Code: {s.code || '—'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-gray-600">
                      <span>{s.city || '—'}{s.state ? `, ${s.state}` : ''}</span>
                    </td>

                    {/* Rates */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md text-[9px] font-black">
                          Kit: {s.commissionConfig.kitPercent}%
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-bold">
                          Retail: {s.commissionConfig.retailPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Orders Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-xl font-black text-xs">
                        {s.metrics.totalOrdersCount}
                      </span>
                    </td>

                    {/* Gross Sales */}
                    <td className="py-3.5 px-4 text-right font-black text-gray-900">
                      ₹{s.metrics.totalSalesRupees}
                    </td>

                    {/* School Revenue */}
                    <td className="py-3.5 px-4 text-right font-bold text-gray-500">
                      ₹{s.metrics.schoolCommissionRupees}
                    </td>

                    {/* Admin Commission Highlight */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-block px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl font-black text-xs shadow-2xs">
                        ₹{s.metrics.platformCommissionRupees}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSchool(s)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-600 rounded-xl font-black text-[10px] uppercase transition-all"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Detailed Modal Overlay for Selected School */}
      {selectedSchool && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in select-none"
          onClick={() => setSelectedSchool(null)}
        >
          <div
            className="bg-white rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl border border-gray-150 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div className="bg-[#0B1528] text-white p-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 p-1 flex items-center justify-center text-white font-black text-lg border border-white/20">
                  {selectedSchool.logo ? (
                    <img src={selectedSchool.logo} alt={selectedSchool.name} className="w-full h-full object-contain" />
                  ) : (
                    selectedSchool.name?.charAt(0) || 'S'
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">{selectedSchool.name}</h3>
                  <p className="text-xs text-gray-300 font-medium">Code: {selectedSchool.code} • {selectedSchool.city}</p>
                </div>
              </div>
            </div>

            {/* Breakdown Content */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Admin Earnings</span>
                  <span className="text-2xl font-black text-emerald-900 mt-1 block">₹{selectedSchool.metrics.platformCommissionRupees}</span>
                  <span className="text-[10px] text-emerald-700 font-bold mt-1 block">Platform commission credited</span>
                </div>

                <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4">
                  <span className="text-[10px] font-black text-purple-800 uppercase tracking-wider block">School Revenue</span>
                  <span className="text-2xl font-black text-purple-900 mt-1 block">₹{selectedSchool.metrics.schoolCommissionRupees}</span>
                  <span className="text-[10px] text-purple-700 font-bold mt-1 block">School payout share</span>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Commission Rates Config</h4>
                <div className="flex items-center justify-between text-xs font-bold text-gray-600 border-b border-gray-200 pb-2">
                  <span>Kit Sales Commission Rate:</span>
                  <span className="font-black text-indigo-700">{selectedSchool.commissionConfig.kitPercent}%</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                  <span>Retail Store Commission Rate:</span>
                  <span className="font-black text-indigo-700">{selectedSchool.commissionConfig.retailPercent}%</span>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-600">
                  <span>Total Gross Sales Volume:</span>
                  <span className="font-black text-gray-900">₹{selectedSchool.metrics.totalSalesRupees}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-600">
                  <span>Total School Orders Processed:</span>
                  <span className="font-black text-gray-900">{selectedSchool.metrics.totalOrdersCount} orders</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSchool(null)}
                className="w-full py-3 bg-[#0B1528] text-white font-black text-xs rounded-2xl hover:bg-black transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolCommissionManagement;
