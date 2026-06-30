import React, { useState } from 'react';
import { 
  TrendingUp, DollarSign, Wallet as WalletIcon, Clock, CreditCard, 
  ArrowLeftRight, Filter, ChevronDown, CheckCircle2, AlertCircle, Info 
} from 'lucide-react';

const WalletManagement = () => {
  // Active Tab state
  const [activeTab, setActiveTab] = useState('All Transactions');

  // Filter states
  const [userFilter, setUserFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Withdrawal Requests status pills filter
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('All');

  // Transaction reference input dictionary for pending items
  const [txnRefs, setTxnRefs] = useState({});

  const [transactions] = useState([]);

  const [adminEarnings] = useState([]);

  const [withdrawals, setWithdrawals] = useState([]);

  // Handle Approve Withdrawal with custom transaction reference code
  const handleApproveWithdrawal = (id) => {
    const enteredRef = txnRefs[id]?.trim() || `txn_auto_${Math.random().toString(36).substr(2, 9)}`;
    setWithdrawals(prev => prev.map(w => 
      w.id === id 
        ? { ...w, status: 'Completed', transactionReference: enteredRef } 
        : w
    ));
    alert(`Withdrawal Approved and Completed! Transaction Code: ${enteredRef}`);
  };

  // Handle Reject Withdrawal
  const handleRejectWithdrawal = (id) => {
    const enteredReason = txnRefs[id]?.trim() || 'Rejected by super administrator';
    setWithdrawals(prev => prev.map(w => 
      w.id === id 
        ? { ...w, status: 'Rejected', transactionReference: enteredReason } 
        : w
    ));
    alert('Withdrawal Request marked as Rejected.');
  };

  // Handle Input text changes
  const handleRefTextChange = (id, val) => {
    setTxnRefs(prev => ({
      ...prev,
      [id]: val
    }));
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesUser = userFilter === 'All' || t.user.toLowerCase().includes(userFilter.toLowerCase());
    const matchesType = typeFilter === 'All' || t.type === typeFilter;
    return matchesUser && matchesType;
  });

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter(w => {
    if (withdrawalStatusFilter === 'All') return true;
    // Map completed status matching
    if (withdrawalStatusFilter === 'Completed' && w.status === 'Completed') return true;
    if (withdrawalStatusFilter === 'Pending' && w.status === 'Pending') return true;
    if (withdrawalStatusFilter === 'Approved' && (w.status === 'Approved' || w.status === 'Completed')) return true;
    if (withdrawalStatusFilter === 'Rejected' && w.status === 'Rejected') return true;
    return w.status === withdrawalStatusFilter;
  });

  const totalPlatformEarning = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAdminEarning = adminEarnings.reduce((sum, e) => sum + (e.adminCut || 0), 0);
  const completedWithdrawals = withdrawals
    .filter((w) => w.status === 'Completed')
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const currentBalance = totalPlatformEarning - completedWithdrawals;
  const pendingVendorPayouts = withdrawals
    .filter((w) => w.status === 'Pending' && w.role === 'Vendor')
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const pendingDeliveryPayouts = withdrawals
    .filter((w) => w.status === 'Pending' && w.role === 'Delivery Boy')
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const pendingFromDelivery = transactions
    .filter((t) => t.role === 'Delivery Boy' && t.type === 'Debit')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="text-left select-none pb-2 border-b border-gray-200">
        <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Admin Wallet & Finance</h1>
        <p className="text-xs text-gray-400 font-bold mt-1">Manage transactions, track earnings, and process withdrawals.</p>
      </div>

      {/* TOP KPI DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 select-none">
        
        {/* Card 1: Total Platform Earning */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs text-left relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <TrendingUp size={22} className="text-gray-700" />
            </div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-100/50 px-2 py-0.5 rounded-md">
              LIVE STATUS
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Platform Earning</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1">₹{totalPlatformEarning.toFixed(2)}</h2>
            <p className="text-[9px] font-bold text-gray-400 mt-1 select-none">Total money collected</p>
          </div>
        </div>

        {/* Card 2: Total Admin Earning */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs text-left relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100">
              <DollarSign size={22} className="text-purple-600" />
            </div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-purple-50/50 px-2 py-0.5 rounded-md">
              LIVE STATUS
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Admin Earning</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1">₹{totalAdminEarning.toFixed(2)}</h2>
            <p className="text-[9px] font-bold text-gray-400 mt-1 select-none">Net profit for platform</p>
          </div>
        </div>

        {/* Card 3: Current Platform Balance */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs text-left relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <WalletIcon size={22} className="text-gray-700" />
            </div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-100/50 px-2 py-0.5 rounded-md">
              LIVE STATUS
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Current Platform Balance</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1">₹{currentBalance.toFixed(2)}</h2>
            <p className="text-[9px] font-bold text-gray-400 mt-1 select-none">Available for business</p>
          </div>
        </div>

        {/* Card 4: Pending from Delivery Boys */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs text-left relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
              <Clock size={22} className="text-amber-600" />
            </div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-amber-50/50 px-2 py-0.5 rounded-md">
              LIVE STATUS
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pending from Delivery Boys</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1">₹{pendingFromDelivery.toFixed(2)}</h2>
            <p className="text-[9px] font-bold text-gray-400 mt-1 select-none">COD cash to be collected</p>
          </div>
        </div>

        {/* Card 5: Vendor Pending Payouts */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs text-left relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <CreditCard size={22} className="text-gray-700" />
            </div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-100/50 px-2 py-0.5 rounded-md">
              LIVE STATUS
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Vendor Pending Payouts</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1">₹{pendingVendorPayouts.toFixed(2)}</h2>
            <p className="text-[9px] font-bold text-gray-400 mt-1 select-none">Owed to vendors</p>
          </div>
        </div>

        {/* Card 6: Delivery Boy Pending Payouts */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs text-left relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
              <CreditCard size={22} className="text-blue-600" />
            </div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-blue-50/50 px-2 py-0.5 rounded-md">
              LIVE STATUS
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Delivery Boy Pending Payouts</span>
            <h2 className="text-2xl font-black text-[#0B1528] mt-1">₹{pendingDeliveryPayouts.toFixed(2)}</h2>
            <p className="text-[9px] font-bold text-gray-400 mt-1 select-none">Owed to delivery partners</p>
          </div>
        </div>

      </div>

      {/* BOTTOM INTERACTIVE TABBED PANEL */}
      <div className="bg-white rounded-3xl border border-gray-250/60 shadow-xs overflow-hidden flex flex-col text-left">
        
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-gray-150 bg-gray-50/50 select-none overflow-x-auto shrink-0">
          {[
            { label: 'All Transactions', icon: ArrowLeftRight },
            { label: 'Admin Earnings', icon: TrendingUp }
          ].map(tab => {
            const isTabActive = activeTab === tab.label;
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                  isTabActive 
                    ? 'border-indigo-600 text-[#0B1528] bg-white' 
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <Icon size={13} className={isTabActive ? 'text-indigo-600' : 'text-gray-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body Render Context */}
        <div className="p-6">
          
          {/* TAB 1: ALL TRANSACTIONS */}
          {activeTab === 'All Transactions' && (
            <div className="space-y-4">
              
              {/* Quick Filters Row */}
              <div className="flex flex-wrap items-center gap-4 select-none pb-2">
                
                {/* Users Filter Dropdown */}
                <div className="relative">
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="appearance-none bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-xs font-extrabold text-gray-700 pl-4 pr-10 py-2.5 rounded-xl cursor-pointer focus:outline-none"
                  >
                    <option value="All">All Users</option>
                    <option value="harsh">Harsh's Hub</option>
                    <option value="patidar">Patidar Store</option>
                    <option value="nexus">Nexus</option>
                    <option value="Rahul">Rahul (Rider)</option>
                    <option value="Test Factory">Test Factory</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Types Filter Dropdown */}
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="appearance-none bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-xs font-extrabold text-gray-700 pl-4 pr-10 py-2.5 rounded-xl cursor-pointer focus:outline-none"
                  >
                    <option value="All">All Types</option>
                    <option value="Credit">Credit</option>
                    <option value="Debit">Debit</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

              </div>

              {/* Transactions Ledger Table */}
              <div className="overflow-x-auto border border-gray-200/80 rounded-2xl shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-5 py-8 text-center text-gray-400 font-extrabold">
                          No transactions found for the active filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map(t => {
                        const isCredit = t.type === 'Credit';
                        return (
                          <tr key={t.id} className="hover:bg-gray-50/50">
                            <td className="px-5 py-4 text-gray-400 font-extrabold tabular-nums select-none">
                              {t.dateTime}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-gray-950">{t.user}</span>
                                <span className="text-[9px] text-gray-400 uppercase font-black tracking-wide mt-0.5">{t.role}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 select-none">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                                isCredit 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-gray-500 font-medium max-w-[280px] truncate">
                              {t.description}
                            </td>
                            <td className={`px-5 py-4 text-right font-black tabular-nums ${
                              isCredit ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {isCredit ? '+' : ''}₹{Math.abs(t.amount).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: ADMIN EARNINGS */}
          {activeTab === 'Admin Earnings' && (
            <div className="space-y-4">
              
              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100/50 rounded-2xl p-4 mb-2 select-none">
                <Info size={16} className="shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-wider leading-relaxed">
                  These represent total platform commissions & local service commissions deducted per checkout.
                </p>
              </div>

              {/* Earnings Table */}
              <div className="overflow-x-auto border border-gray-200/80 rounded-2xl shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">Order Reference</th>
                      <th className="px-5 py-3.5">Order Total</th>
                      <th className="px-5 py-3.5">Commission Rate</th>
                      <th className="px-5 py-3.5 text-right">Admin Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
                    {adminEarnings.map(ae => (
                      <tr key={ae.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-4 text-gray-400 font-extrabold tabular-nums select-none">{ae.dateTime}</td>
                        <td className="px-5 py-4 font-extrabold text-indigo-600">{ae.orderId}</td>
                        <td className="px-5 py-4 tabular-nums">₹{ae.orderTotal.toFixed(2)}</td>
                        <td className="px-5 py-4 select-none">
                          <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                            {ae.commissionRate}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-black text-[#0B1528] tabular-nums">
                          +₹{ae.adminCut.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}


        </div>

      </div>

      {/* FOOTER COPYRIGHT BAR */}
      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">Healthy Delight</span>
        </p>
      </div>

    </div>
  );
};

export default WalletManagement;
