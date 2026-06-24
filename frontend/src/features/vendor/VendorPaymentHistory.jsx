import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileText, Download, Search, Clock, ShieldCheck, X, Check,
  IndianRupee, CreditCard, Banknote, Calendar, ArrowDownToLine, HelpCircle, Loader2
} from 'lucide-react';
import { getVendorEarningsSummary, listVendorSettlements } from '../../services/vendorApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import {
  mapVendorEarningsToWallet,
  mapVendorSettlementForLedger,
} from '../../utils/mappers/vendorSettlementMapper';

const VendorPaymentHistory = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF');
  const [exportRange, setExportRange] = useState('30days');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [settledBal, setSettledBal] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, settlements] = await Promise.all([
        getVendorEarningsSummary(),
        listVendorSettlements({ limit: 100 }),
      ]);
      const wallet = mapVendorEarningsToWallet(summary);
      setSettledBal(wallet.settledBal);
      setPendingPayouts(wallet.pendingBal);
      setTotalRevenue(wallet.totalRevenue);
      setTransactions((settlements.data || []).map(mapVendorSettlementForLedger));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load transaction ledger'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  // Filtered Ledger List
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const matchesTab = activeTab === 'All' || txn.type === activeTab;
      const matchesSearch = searchQuery === '' || 
        txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.ref.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [transactions, activeTab, searchQuery]);

  // Export handling
  const handleExportStatements = (e) => {
    e.preventDefault();
    setExportSuccess(true);
    setTimeout(() => {
      setExportSuccess(false);
      setShowExportModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12 relative font-sans text-gray-900 selection:bg-purple-100">
      
      {/* 1. Audit Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Transaction Ledger</h1>
            <span className="bg-gray-100 text-gray-500 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded">Audit Trail</span>
          </div>
          <p className="text-xs font-semibold text-gray-400 mt-1">Keep track of all financial movements, payouts, and settlements.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-[#0E0E2C] hover:opacity-90 text-white font-extrabold flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs shadow-lg cursor-pointer transition-all"
          >
            <Download size={14} strokeWidth={2.5} />
            <span>DOWNLOAD STATEMENTS</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Settled Balance */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center gap-4.5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="w-12 h-12 bg-gray-50 text-gray-700 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100/50">
            <Banknote size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Settled Balance</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">₹{settledBal.toLocaleString('en-IN')}</span>
          </div>
          <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
            <Banknote size={130} />
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center gap-4.5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100/50">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Pending Payouts</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">₹{pendingPayouts.toLocaleString('en-IN')}</span>
          </div>
          <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
            <Clock size={130} />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center gap-4.5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="w-12 h-12 bg-purple-50 text-[#5B3FD6] rounded-2xl flex items-center justify-center shrink-0 border border-purple-100/50">
            <CreditCard size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">₹{totalRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
            <CreditCard size={130} />
          </div>
        </div>

      </div>

      {/* 3. Transaction Filter Navigation & Table */}
      <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm space-y-4">
        
        {/* Navigation & Search Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Custom Tabs */}
          <div className="bg-gray-50 p-1 rounded-xl flex items-center gap-1 self-start border border-gray-100/80">
            {['All', 'Payments', 'Withdrawal', 'Refund'].map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative group w-full lg:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] placeholder-gray-400 font-medium"
            />
          </div>

        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => {
                  const isNegative = txn.amount < 0;
                  let statusStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  if (txn.status === 'Pending') statusStyle = "bg-amber-50 text-amber-600 border-amber-100";

                  return (
                    <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-gray-900 tracking-tight">{txn.customer}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">{txn.date}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-[9px] text-[#5B3FD6] font-bold uppercase tracking-wider">{txn.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-gray-400 font-bold">{txn.ref}</span>
                      </td>
                      <td className={`px-6 py-4 font-black text-sm ${isNegative ? 'text-rose-600' : 'text-gray-900'}`}>
                        {isNegative ? '-' : '+'}₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${statusStyle}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => alert(`Reviewing transaction: ${txn.id}`)}
                          className="px-2.5 py-1 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-400 hover:text-gray-600 font-black text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold bg-white">
                    No transactions in ledger yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 4. Download Statements Centered Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-[#0E0E2C]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-2xl p-7.5 space-y-6 animate-scale-up relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownToLine size={18} className="text-[#5B3FD6]" />
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Download Statements</h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleExportStatements} className="space-y-5">
              
              {/* Date Range Option */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Statement Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: '30days', label: 'Last 30 Days' },
                    { key: '90days', label: 'Last Qtr' },
                    { key: '1year', label: 'Full Year' }
                  ].map((range) => {
                    const isSelected = exportRange === range.key;
                    return (
                      <button
                        key={range.key}
                        type="button"
                        onClick={() => setExportRange(range.key)}
                        className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-purple-50/50 border-[#5B3FD6] text-[#5B3FD6]' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Statement Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'PDF', label: 'Adobe PDF (.pdf)' },
                    { key: 'CSV', label: 'Excel Sheet (.csv)' }
                  ].map((format) => {
                    const isSelected = exportFormat === format.key;
                    return (
                      <button
                        key={format.key}
                        type="button"
                        onClick={() => setExportFormat(format.key)}
                        className={`py-3 px-3 rounded-xl border text-[10px] font-extrabold uppercase tracking-wider text-center cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#0E0E2C] border-[#0E0E2C] text-white shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {format.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Success Notification */}
              {exportSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-extrabold uppercase tracking-wider">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Statement Downloaded!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-500 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#5B3FD6] hover:bg-[#492eb3] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer text-center"
                >
                  Download
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default VendorPaymentHistory;
