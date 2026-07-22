import React, { useCallback, useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, Clock, Landmark, Loader2, CheckCircle2, AlertCircle, Send,
} from 'lucide-react';
import { useSchoolId } from '../../../utils/schoolContext';
import {
  getSchoolFinanceSummary, listSchoolFinanceTransactions, getSchoolBank,
  updateSchoolBank, listSchoolPayouts, createSchoolPayout,
} from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const rupees = (paise) => (Number(paise) || 0) / 100;

const TXN_DESC = {
  kit_commission_credit: 'Kit commission',
  payout_debit: 'Withdrawal',
  adjustment: 'Adjustment',
  refund_debit: 'Refund',
};

const PAYOUT_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  processing: 'bg-blue-50 text-blue-700 border-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  failed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const StatCard = ({ icon, tone, label, value }) => (
  <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${tone}`}>{icon}</div>
    <div>
      <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
      <span className="block text-xl font-black text-deep-purple mt-0.5">₹{value.toFixed(2)}</span>
    </div>
  </div>
);

const SchoolWallet = () => {
  const schoolId = useSchoolId();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [bank, setBank] = useState({ accountName: '', bankName: '', branch: '', ifsc: '', accountNumberSet: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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
      const payload = {
        accountName: bank.accountName,
        bankName: bank.bankName,
        branch: bank.branch,
        ifsc: bank.ifsc,
        ...(accountNumber ? { accountNumber } : {}),
      };
      const updated = await updateSchoolBank(schoolId, payload);
      if (updated) setBank(updated);
      setAccountNumber('');
      flash('Bank details saved.');
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
    setSubmitting(true);
    setError('');
    try {
      await createSchoolPayout(schoolId, amountPaise);
      setAmount('');
      flash('Withdrawal request submitted for admin approval.');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to submit withdrawal'));
    } finally {
      setSubmitting(false);
    }
  };

  const withdrawable = rupees(summary?.withdrawablePaise);

  return (
    <div className="space-y-6 font-sans text-gray-800 pb-12">
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-2xl font-black text-deep-purple tracking-tight">Earnings & Withdrawals</h1>
        <p className="text-xs font-bold text-gray-400 mt-1">Your kit-commission earnings and payout requests.</p>
      </div>

      {notice && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 flex items-center justify-center text-gray-400">
          <Loader2 size={22} className="animate-spin mr-2" /> <span className="text-sm font-bold">Loading…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<TrendingUp size={22} className="text-emerald-600" />} tone="bg-emerald-50 border-emerald-100"
              label="Total Earned" value={rupees(summary?.totalEarningsPaise)} />
            <StatCard icon={<Wallet size={22} className="text-indigo-600" />} tone="bg-indigo-50 border-indigo-100"
              label="Available Balance" value={rupees(summary?.availableBalancePaise)} />
            <StatCard icon={<Clock size={22} className="text-amber-600" />} tone="bg-amber-50 border-amber-100"
              label="Pending Payouts" value={rupees(summary?.pendingSettlementPaise)} />
            <StatCard icon={<Send size={22} className="text-blue-600" />} tone="bg-blue-50 border-blue-100"
              label="Withdrawable" value={withdrawable} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Withdraw */}
            <form onSubmit={handleWithdraw} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-indigo-600" />
                <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">Request Withdrawal</h3>
              </div>
              <p className="text-[11px] font-bold text-gray-400">
                You can withdraw up to ₹{withdrawable.toFixed(2)}. Requests are paid out after admin approval.
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold text-sm">₹</span>
                <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount to withdraw"
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-400" />
              </div>
              <button type="submit" disabled={submitting || withdrawable <= 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-xs rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit Request
              </button>
              {!bank.accountNumberSet && (
                <p className="text-[11px] font-bold text-amber-600 text-center">Add your bank details first to withdraw.</p>
              )}
            </form>

            {/* Bank details */}
            <form onSubmit={handleSaveBank} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Landmark size={16} className="text-indigo-600" />
                <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">Bank Details</h3>
              </div>
              <input value={bank.accountName || ''} onChange={(e) => setBank({ ...bank, accountName: e.target.value })}
                placeholder="Account holder name"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" />
              <div className="grid grid-cols-2 gap-3">
                <input value={bank.bankName || ''} onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                  placeholder="Bank name"
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" />
                <input value={bank.branch || ''} onChange={(e) => setBank({ ...bank, branch: e.target.value })}
                  placeholder="Branch"
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" />
              </div>
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={bank.accountNumberSet ? 'Account number (set — enter to change)' : 'Account number'}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" />
              <input value={bank.ifsc || ''} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })}
                placeholder="IFSC code"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" />
              <button type="submit" disabled={savingBank}
                className="w-full py-3 bg-deep-purple hover:opacity-90 text-white font-black uppercase tracking-wider text-xs rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {savingBank ? <Loader2 size={14} className="animate-spin" /> : <Landmark size={14} />} Save Bank Details
              </button>
            </form>
          </div>

          {/* Payout history */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">Withdrawal Requests</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                  {payouts.length === 0 ? (
                    <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 font-extrabold">No withdrawal requests yet.</td></tr>
                  ) : (
                    payouts.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-gray-400">{p.audit?.createdAt ? new Date(p.audit.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="px-5 py-3 font-black text-deep-purple">₹{rupees(p.amountPaise).toFixed(2)}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${PAYOUT_STYLES[p.status] || PAYOUT_STYLES.failed}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400">{p.transactionReference || p.rejectionReason || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                  {transactions.length === 0 ? (
                    <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 font-extrabold">No transactions yet.</td></tr>
                  ) : (
                    transactions.map((t) => {
                      const credit = (t.amountPaise || 0) >= 0;
                      return (
                        <tr key={t._id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-3 text-gray-400">{t.audit?.createdAt ? new Date(t.audit.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="px-5 py-3 text-gray-600">{t.description || TXN_DESC[t.transactionType] || '—'}</td>
                          <td className={`px-5 py-3 text-right font-black ${credit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {credit ? '+' : ''}₹{Math.abs(rupees(t.amountPaise)).toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-right text-gray-500">₹{rupees(t.balancePaise).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SchoolWallet;
