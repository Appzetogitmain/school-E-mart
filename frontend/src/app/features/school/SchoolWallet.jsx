import React, { useCallback, useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, Clock, Landmark, Loader2, CheckCircle2, AlertCircle, Send,
  Package, ShoppingBag, ArrowUpRight, ArrowDownLeft, ShieldCheck, ChevronRight,
  Receipt, History, CreditCard, Sparkles, RefreshCw,
} from 'lucide-react';
import { useSchoolId } from '../../../utils/schoolContext';
import {
  getSchoolFinanceSummary, listSchoolFinanceTransactions, getSchoolBank,
  updateSchoolBank, listSchoolPayouts, createSchoolPayout,
} from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const rupees = (paise) => (Number(paise) || 0) / 100;

const TXN_DESC = {
  kit_commission_credit: 'Kit commission credit',
  retail_commission_credit: 'Marketplace product commission',
  payout_debit: 'Withdrawal payout',
  adjustment: 'Administrative adjustment',
  refund_debit: 'Order refund debit',
};

const TXN_BADGE = {
  kit_commission_credit: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  retail_commission_credit: 'bg-purple-50 text-purple-700 border-purple-200/60',
  payout_debit: 'bg-amber-50 text-amber-700 border-amber-200/60',
  adjustment: 'bg-blue-50 text-blue-700 border-blue-200/60',
  refund_debit: 'bg-rose-50 text-rose-700 border-rose-200/60',
};

const PAYOUT_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  failed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const SchoolWallet = () => {
  const schoolId = useSchoolId();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [bank, setBank] = useState({
    accountName: '',
    bankName: '',
    branch: '',
    ifsc: '',
    accountNumberMasked: '',
    accountNumberSet: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'withdraw', 'bank', 'txns', 'payouts'

  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const [s, tx, po, b] = await Promise.all([
        getSchoolFinanceSummary(schoolId),
        listSchoolFinanceTransactions(schoolId, { limit: 50 }),
        listSchoolPayouts(schoolId, { limit: 50 }),
        getSchoolBank(schoolId),
      ]);
      setSummary(s);
      setTransactions(tx.data || []);
      setPayouts(po.data || []);
      if (b) setBank(b);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load earnings'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setSavingBank(true);
    setError('');
    try {
      const payload = {};
      if (bank.accountName?.trim()) payload.accountName = bank.accountName.trim();
      if (bank.bankName?.trim()) payload.bankName = bank.bankName.trim();
      if (bank.branch?.trim()) payload.branch = bank.branch.trim();
      if (bank.ifsc?.trim()) payload.ifsc = bank.ifsc.trim().toUpperCase().replace(/\s+/g, '');
      if (accountNumber?.trim()) payload.accountNumber = accountNumber.trim().replace(/\s+/g, '');

      if (Object.keys(payload).length === 0) {
        setError('Please fill in at least one bank account detail field.');
        setSavingBank(false);
        return;
      }

      const updated = await updateSchoolBank(schoolId, payload);
      if (updated) setBank(updated);
      setAccountNumber('');
      flash('Bank account details saved successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save bank details'));
    } finally {
      setSavingBank(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amountPaise = Math.round(Number(amount) * 100);
    if (!amountPaise || amountPaise < 100) {
      setError('Enter a valid amount (minimum ₹1).');
      return;
    }
    if (!bank.accountNumberSet) {
      setError('Please configure your bank details before submitting a withdrawal request.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createSchoolPayout(schoolId, amountPaise);
      setAmount('');
      flash('Withdrawal request submitted to admin with your bank account details.');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to submit withdrawal'));
    } finally {
      setSubmitting(false);
    }
  };

  const withdrawable = rupees(summary?.withdrawablePaise);
  const kitEarnings = rupees(summary?.kitEarningsPaise);
  const retailEarnings = rupees(summary?.retailEarningsPaise);
  const totalEarned = rupees(summary?.totalEarningsPaise);
  const availableBalance = rupees(summary?.availableBalancePaise);
  const pendingPayouts = rupees(summary?.pendingSettlementPaise);

  return (
    <div className="max-w-4xl mx-auto space-y-5 font-sans text-gray-800 pb-16 px-1 sm:px-4">
      {/* Mobile Top Header */}
      <div className="flex items-center justify-between pb-1 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200/60 shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                School Finance
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-deep-purple tracking-tight leading-tight mt-0.5">
              Digital Wallet
            </h1>
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-gray-200/80 text-gray-700 hover:bg-gray-50 text-xs font-extrabold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw size={13} className={`text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {notice && (
        <div className="px-4 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} /> <span>{notice}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-rose-500 text-white rounded-2xl text-xs font-bold shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 size={28} className="animate-spin text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading your wallet…</span>
        </div>
      ) : (
        <>
          {/* Mobile App Style Main Hero Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white rounded-3xl p-6 shadow-xl space-y-6">
            {/* Subtle background decorative shapes */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Top Card Bar */}
            <div className="flex items-center justify-between text-white/70 text-xs font-bold">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-indigo-300" />
                <span className="uppercase tracking-widest text-[10px] font-black">Available Balance</span>
              </div>
              <span className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-indigo-100 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-300" /> Partner School
              </span>
            </div>

            {/* Big Balance Display */}
            <div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                ₹{availableBalance.toFixed(2)}
              </div>
              <p className="text-xs text-indigo-200/80 font-medium mt-1">
                Withdrawable: <strong className="text-white font-extrabold">₹{withdrawable.toFixed(2)}</strong>
                {pendingPayouts > 0 && (
                  <span className="ml-2 text-amber-200 font-bold">({`₹${pendingPayouts.toFixed(2)} in request`})</span>
                )}
              </p>
            </div>

            {/* Commission Breakdown Pill Badges */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <Package size={16} />
                </div>
                <div>
                  <span className="block text-[9px] font-black uppercase text-indigo-200/70 tracking-wider">Kits Earned</span>
                  <span className="font-extrabold text-sm text-white">₹{kitEarnings.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <span className="block text-[9px] font-black uppercase text-indigo-200/70 tracking-wider">Marketplace</span>
                  <span className="font-extrabold text-sm text-white">₹{retailEarnings.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* App Action Buttons Bar */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={() => setActiveTab('withdraw')}
                className="py-3 px-3 rounded-2xl bg-white text-[#1E1B4B] hover:bg-indigo-50 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Send size={14} className="text-indigo-600" /> Withdraw
              </button>
              <button
                onClick={() => setActiveTab('bank')}
                className="py-3 px-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 backdrop-blur-md active:scale-95 transition-all"
              >
                <Landmark size={14} className="text-indigo-200" /> Bank Info
              </button>
              <button
                onClick={() => setActiveTab('txns')}
                className="py-3 px-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 backdrop-blur-md active:scale-95 transition-all"
              >
                <History size={14} className="text-indigo-200" /> History
              </button>
            </div>
          </div>

          {/* Quick Segmented Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'all'
                  ? 'bg-white text-deep-purple shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'withdraw'
                  ? 'bg-white text-deep-purple shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Withdraw
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'bank'
                  ? 'bg-white text-deep-purple shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Bank Info
            </button>
            <button
              onClick={() => setActiveTab('txns')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'txns'
                  ? 'bg-white text-deep-purple shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'payouts'
                  ? 'bg-white text-deep-purple shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Requests ({payouts.length})
            </button>
          </div>

          {/* Section: Withdrawal Request Form */}
          {(activeTab === 'all' || activeTab === 'withdraw') && (
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Send size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">Request Withdrawal</h3>
                    <p className="text-[11px] font-medium text-gray-400">Withdraw earnings to your school bank account.</p>
                  </div>
                </div>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Max: ₹{withdrawable.toFixed(2)}
                </span>
              </div>

              {/* Destination Bank Account Snapshot Preview */}
              <div className="p-3.5 bg-gray-50 border border-gray-200/70 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <span>Destination Account</span>
                  {bank.accountNumberSet ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-bold">
                      <ShieldCheck size={13} /> Bank Linked
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold">Setup Required</span>
                  )}
                </div>

                {bank.accountNumberSet ? (
                  <div className="text-xs font-bold text-gray-800 pt-0.5">
                    <p className="font-extrabold text-deep-purple flex items-center justify-between">
                      <span>{bank.bankName}</span>
                      <span className="text-gray-500 font-mono text-[11px]">{bank.accountNumberMasked || '••••'}</span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-normal">
                      A/C Name: {bank.accountName} | IFSC: {bank.ifsc}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs font-bold text-amber-700">Add bank account details first to request payouts.</p>
                    <button
                      onClick={() => setActiveTab('bank')}
                      className="text-[10px] font-black uppercase text-indigo-600 underline"
                    >
                      Add Bank
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleWithdraw} className="space-y-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-black text-base">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || withdrawable <= 0 || !bank.accountNumberSet}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit Withdrawal Request
                </button>
              </form>
            </div>
          )}

          {/* Section: Bank Setup Form */}
          {(activeTab === 'all' || activeTab === 'bank') && (
            <form onSubmit={handleSaveBank} className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Landmark size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">Account & Bank Details</h3>
                  <p className="text-[11px] font-medium text-gray-400">Official account for receiving withdrawal settlements.</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Account Holder Name</label>
                  <input
                    value={bank.accountName || ''}
                    onChange={(e) => setBank({ ...bank, accountName: e.target.value })}
                    placeholder="e.g. St. Mary School Main Operations"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Bank Name</label>
                    <input
                      value={bank.bankName || ''}
                      onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                      placeholder="e.g. State Bank of India"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Branch Name</label>
                    <input
                      value={bank.branch || ''}
                      onChange={(e) => setBank({ ...bank, branch: e.target.value })}
                      placeholder="e.g. Main Branch, Civil Lines"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Account Number</label>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder={bank.accountNumberSet ? `Configured (${bank.accountNumberMasked || '••••'}) — type to edit` : 'Enter account number'}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">IFSC Code</label>
                    <input
                      value={bank.ifsc || ''}
                      onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingBank}
                  className="w-full py-3 bg-deep-purple hover:opacity-95 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {savingBank ? <Loader2 size={16} className="animate-spin" /> : <Landmark size={16} />} Save Bank Details
                </button>
              </div>
            </form>
          )}

          {/* Section: Withdrawal Requests */}
          {(activeTab === 'all' || activeTab === 'payouts') && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-2">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">Withdrawal Requests</h3>
                    <p className="text-[11px] font-medium text-gray-400">Status of payout requests sent to super admin.</p>
                  </div>
                </div>
              </div>

              {/* Responsive Cards for Mobile */}
              <div className="divide-y divide-gray-100">
                {payouts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-bold text-xs">
                    No withdrawal requests submitted yet.
                  </div>
                ) : (
                  payouts.map((p) => (
                    <div key={p._id} className="p-4 hover:bg-gray-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                          <Send size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-deep-purple">₹{rupees(p.amountPaise).toFixed(2)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${PAYOUT_STYLES[p.status] || PAYOUT_STYLES.failed}`}>
                              {p.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                            Bank: <strong className="text-gray-700">{p.bankDetailsSnapshot?.bankName || 'Registered Bank'}</strong> {p.bankDetailsSnapshot?.accountNumberMasked || ''}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Requested: {p.audit?.createdAt ? new Date(p.audit.createdAt).toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>

                      {(p.transactionReference || p.rejectionReason) && (
                        <div className="text-[11px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60 self-start sm:self-center">
                          Ref: {p.transactionReference || p.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Section: Transactions History */}
          {(activeTab === 'all' || activeTab === 'txns') && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-2">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <History size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">Transaction Ledger</h3>
                    <p className="text-[11px] font-medium text-gray-400">Detailed list of all credits and debits.</p>
                  </div>
                </div>
              </div>

              {/* Mobile-first List Cards */}
              <div className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-bold text-xs">
                    No transactions recorded yet.
                  </div>
                ) : (
                  transactions.map((t) => {
                    const credit = (t.amountPaise || 0) >= 0;
                    return (
                      <div key={t._id} className="p-4 hover:bg-gray-50/50 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                            credit ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {credit ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-wider ${TXN_BADGE[t.transactionType] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {TXN_DESC[t.transactionType] || t.transactionType}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {t.audit?.createdAt ? new Date(t.audit.createdAt).toLocaleDateString() : '—'}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-gray-800 truncate mt-0.5">
                              {t.description || TXN_DESC[t.transactionType] || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-sm font-black block ${credit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {credit ? '+' : ''}₹{Math.abs(rupees(t.amountPaise)).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold block">
                            Bal: ₹{rupees(t.balancePaise).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SchoolWallet;
