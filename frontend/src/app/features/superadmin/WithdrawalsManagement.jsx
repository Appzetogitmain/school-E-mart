import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight, Info, Search, Calendar, Landmark, Check, X, ShieldAlert, Copy, CheckCircle2
} from 'lucide-react';
import {
  listPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const STATUS_LABEL = {
  pending: 'Pending',
  processing: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
  failed: 'Rejected',
};

const mapPayout = (p) => {
  const isSchool = (p.ownerType === 'school' || p.payeeType === 'school' || Boolean(p.schoolId));
  const payeeName = isSchool
    ? (p.school?.name || p.payeeName || 'School')
    : (p.vendor?.storeName || p.payeeName || 'Vendor');

  const b = p.bankDetailsSnapshot || {};
  const bankAccountName = b.accountName || payeeName;
  const bankName = b.bankName || '—';
  const branch = b.branch || '';
  const rawAccNum = b.accountNumber || b.accountNumberMasked || '—';
  const bankAccNum = rawAccNum.replace(/^\*+/, '') || rawAccNum;
  const ifsc = b.ifsc || '—';

  return {
    id: p._id,
    isSchool,
    role: isSchool ? 'School' : 'Vendor',
    roleStyle: isSchool ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-purple-50 text-purple-600 border-purple-100',
    title: isSchool ? 'School Withdrawal' : 'Vendor Withdrawal',
    user: payeeName,
    dateTime: p.audit?.createdAt ? new Date(p.audit.createdAt).toLocaleString() : '—',
    amount: (p.amountPaise || 0) / 100,
    status: STATUS_LABEL[p.status] || 'Pending',
    paymentMethod: 'Bank Transfer',
    accountName: bankAccountName,
    bankName,
    branch,
    accountNumber: bankAccNum,
    ifsc,
    transactionReference: p.transactionReference || p.rejectionReason || '',
  };
};

const WithdrawalsManagement = () => {
  // Status filter pill state
  const [statusFilter, setStatusFilter] = useState('All');

  // Input text references state
  const [txnRefs, setTxnRefs] = useState({});
  const [copyNotice, setCopyNotice] = useState('');

  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const copyBankInfo = (w) => {
    const text = `Name: ${w.accountName} | Bank: ${w.bankName}${w.branch ? ' (' + w.branch + ')' : ''} | Acc: ${w.accountNumber} | IFSC: ${w.ifsc}`;
    navigator.clipboard.writeText(text);
    setCopyNotice(`Bank details for ${w.user} copied!`);
    setTimeout(() => setCopyNotice(''), 3000);
  };

  const loadWithdrawals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listPayoutRequests({ limit: 100 });
      setWithdrawals((data || []).map(mapPayout));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load withdrawal requests'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  // Handle Complete Payout
  const handleCompletePayout = async (id) => {
    const enteredRef = txnRefs[id]?.trim();
    try {
      await approvePayoutRequest(id, enteredRef);
      await loadWithdrawals();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to approve payout'));
    }
  };

  // Handle Reject Payout
  const handleRejectPayout = async (id) => {
    const enteredReason = txnRefs[id]?.trim() || 'Rejected by super administrator';
    try {
      await rejectPayoutRequest(id, enteredReason);
      await loadWithdrawals();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to reject payout'));
    }
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
          <p className="text-xs text-gray-400 font-bold mt-1.5">Review, process, and reconcile cashout settlements to vendor hubs & school accounts.</p>
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

      {copyNotice && (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-700 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} /> {copyNotice}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600">
          {error}
        </div>
      )}

      {/* CARDS LIST CONTAINER */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-black text-gray-400 select-none border border-dashed border-gray-200 rounded-3xl bg-white">
            Loading withdrawal requests…
          </div>
        ) : filteredWithdrawals.length === 0 ? (
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
                      <h4 className="text-sm font-black text-[#0B1528]">{w.title}</h4>
                      <span className={`border text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none ${w.roleStyle}`}>
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
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Bank Details</span>
                      <button
                        type="button"
                        onClick={() => copyBankInfo(w)}
                        className="text-[9px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Copy size={10} /> Copy Info
                      </button>
                    </div>
                    <div className="font-extrabold text-[#0B1528] space-y-0.5">
                      <p><span className="text-gray-500 font-normal">Holder:</span> {w.accountName}</p>
                      <p><span className="text-gray-500 font-normal">Bank:</span> {w.bankName} {w.branch && `(${w.branch})`}</p>
                      <p className="font-mono text-indigo-900"><span className="text-gray-500 font-normal font-sans">A/C:</span> {w.accountNumber} | <span className="text-gray-500 font-normal font-sans">IFSC:</span> {w.ifsc}</p>
                    </div>
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
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">School E-Mart</span>
        </p>
      </div>

    </div>
  );
};

export default WithdrawalsManagement;
