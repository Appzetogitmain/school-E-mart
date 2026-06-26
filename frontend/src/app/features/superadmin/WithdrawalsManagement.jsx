import React, { useState } from 'react';
import { 
  ChevronRight, Info, Search, Calendar, Landmark, Check, X, ShieldAlert 
} from 'lucide-react';

const WithdrawalsManagement = () => {
  // Status filter pill state
  const [statusFilter, setStatusFilter] = useState('All');

  // Input text references state
  const [txnRefs, setTxnRefs] = useState({});

  const [withdrawals, setWithdrawals] = useState([]);

  // Handle Complete Payout
  const handleCompletePayout = (id) => {
    const enteredRef = txnRefs[id]?.trim() || `txn_auto_${Math.random().toString(36).substr(2, 9)}`;
    setWithdrawals(prev => prev.map(w => 
      w.id === id 
        ? { ...w, status: 'Completed', transactionReference: enteredRef } 
        : w
    ));
    alert(`Withdrawal Approved and Completed! Transaction Code: ${enteredRef}`);
  };

  // Handle Reject Payout
  const handleRejectPayout = (id) => {
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

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter(w => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Completed' && w.status === 'Completed') return true;
    if (statusFilter === 'Pending' && w.status === 'Pending') return true;
    if (statusFilter === 'Approved' && (w.status === 'Approved' || w.status === 'Completed')) return true;
    if (statusFilter === 'Rejected' && w.status === 'Rejected') return true;
    return w.status === statusFilter;
  });

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Withdrawal Requests</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none animate-pulse">
              FINANCE
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Review, process, and reconcile cashout settlements to vendor hubs.</p>
        </div>

        {/* Breadcrumb right align */}
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Home</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">Withdrawals</span>
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="flex flex-wrap items-center gap-2 select-none">
        {['All', 'Pending', 'Approved', 'Completed', 'Rejected'].map(pill => {
          const isSelected = statusFilter === pill;
          return (
            <button
              key={pill}
              type="button"
              onClick={() => setStatusFilter(pill)}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all border ${
                isSelected 
                  ? 'bg-[#18181B] text-white border-[#18181B] shadow-xs' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200'
              }`}
            >
              {pill}
            </button>
          );
        })}
      </div>

      {/* CARDS LIST CONTAINER */}
      <div className="space-y-4">
        {filteredWithdrawals.length === 0 ? (
          <div className="py-12 text-center text-xs font-black text-gray-400 select-none border border-dashed border-gray-200 rounded-3xl bg-white">
            No withdrawal requests matching status '{statusFilter}'.
          </div>
        ) : (
          filteredWithdrawals.map(w => {
            const isPending = w.status === 'Pending';
            const isCompleted = w.status === 'Completed';
            const isApproved = w.status === 'Approved';
            const isRejected = w.status === 'Rejected';

            return (
              <div 
                key={w.id} 
                className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 text-left shadow-xs transition-all hover:shadow-sm"
              >
                
                {/* Upper Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Title / Description info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 select-none">
                      <h4 className="text-sm font-black text-[#0B1528]">Vendor Withdrawal</h4>
                      <span className="bg-purple-50 text-purple-600 border border-purple-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none">
                        {w.role}
                      </span>
                    </div>
                    <p className="text-xs font-black text-[#0B1528]">{w.user}</p>
                    <p className="text-[10px] font-bold text-gray-400 select-none">
                      Requested: {w.dateTime}
                    </p>
                  </div>

                  {/* Cash & Status */}
                  <div className="sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:gap-1 select-none">
                    <span className="text-lg font-black text-[#0B1528] tabular-nums">
                      ₹{w.amount.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wide ${
                      isCompleted || isApproved
                        ? 'text-gray-700'
                        : isRejected
                        ? 'text-rose-500'
                        : 'text-amber-600 animate-pulse'
                    }`}>
                      {w.status}
                    </span>
                  </div>

                </div>

                {/* Shaded payment & banking details box */}
                <div className="bg-[#F8F9FA]/80 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-100 select-none text-[11px] leading-relaxed">
                  
                  {/* Payment Method */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Payment Method</span>
                    <span className="font-extrabold text-[#0B1528]">{w.paymentMethod}</span>
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Bank Details</span>
                    <span className="font-extrabold text-[#0B1528]">{w.bankDetails}</span>
                  </div>

                </div>

                {/* Transaction Reference / Input controls for Admin */}
                <div className="border-t border-gray-100/60 pt-4 space-y-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block select-none">
                    {isPending ? 'Submit Transaction Reference' : 'Transaction Reference'}
                  </span>

                  {isPending ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input 
                        type="text"
                        value={txnRefs[w.id] || ''}
                        onChange={(e) => handleRefTextChange(w.id, e.target.value)}
                        placeholder="Enter receipt ID, bank transfer code, or UPI trace ID..."
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <div className="flex items-center gap-2 select-none">
                        <button
                          type="button"
                          onClick={() => handleCompletePayout(w.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-xs transition-all shrink-0"
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectPayout(w.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-xs transition-all shrink-0"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="font-extrabold text-xs text-gray-700 block truncate select-none bg-gray-50/50 px-3 py-1.5 rounded-lg border border-gray-100/50">
                      {w.transactionReference || 'N/A'}
                    </span>
                  )}
                </div>

              </div>
            );
          })
        )}
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

export default WithdrawalsManagement;
