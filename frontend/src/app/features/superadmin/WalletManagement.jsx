import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, IndianRupee, Wallet as WalletIcon, Clock, CreditCard,
  ArrowLeftRight, ChevronDown, Info, Store, School as SchoolIcon,
  CheckCircle2, XCircle, Loader2, Copy, X, Edit3, Landmark,
} from 'lucide-react';
import {
  getWalletOverview, listVendorTransactions, listPayoutRequests,
  approvePayoutRequest, rejectPayoutRequest, updatePayoutStatus,
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const TYPE_DESC = {
  order_credit: 'Order earnings',
  commission_deduction: 'Platform commission',
  payout_debit: 'Payout',
  adjustment: 'Manual adjustment',
  refund_debit: 'Refund',
};

const PAYOUT_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  processing: 'bg-blue-50 text-blue-700 border-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  failed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const toRupees = (paise) => (Number(paise) || 0) / 100;

const KpiCard = ({ icon, tone, label, value, sub }) => (
  <div className="bg-white rounded-3xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs text-left">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl border ${tone}`}>{icon}</div>
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-100/50 px-2 py-0.5 rounded-md">
        LIVE
      </span>
    </div>
    <div className="mt-4">
      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{label}</span>
      <h2 className="text-2xl font-black text-[#0B1528] mt-1">₹{value.toFixed(2)}</h2>
      <p className="text-[9px] font-bold text-gray-400 mt-1 select-none">{sub}</p>
    </div>
  </div>
);

const WalletManagement = () => {
  const [activeTab, setActiveTab] = useState('Withdrawal Requests');
  const [typeFilter, setTypeFilter] = useState('All');

  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const [selectedBankModal, setSelectedBankModal] = useState(null);
  const [statusEditModal, setStatusEditModal] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'completed', reference: '', reason: '' });
  const [copyFeedback, setCopyFeedback] = useState('');

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} copied!`);
    setTimeout(() => setCopyFeedback(''), 2500);
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusEditModal) return;
    setProcessingId(statusEditModal.id);
    setError('');
    try {
      await updatePayoutStatus(statusEditModal.id, {
        status: statusForm.status,
        transactionReference: statusForm.reference || undefined,
        rejectionReason: statusForm.reason || undefined,
      });
      setStatusEditModal(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update payout status'));
    } finally {
      setProcessingId(null);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, tx, po] = await Promise.all([
        getWalletOverview(),
        listVendorTransactions({ limit: 100 }),
        listPayoutRequests({ limit: 100 }),
      ]);
      setOverview(ov);
      setTransactions(
        (tx.data || []).map((t) => ({
          id: t._id,
          dateTime: t.audit?.createdAt ? new Date(t.audit.createdAt).toLocaleString() : '—',
          user: t.payeeName || t.vendor?.storeName || 'Vendor',
          role: t.payeeType === 'school' ? 'School' : 'Vendor',
          transactionType: t.transactionType,
          type: (t.amountPaise || 0) >= 0 ? 'Credit' : 'Debit',
          description: t.description || TYPE_DESC[t.transactionType] || '—',
          amount: (t.amountPaise || 0) / 100,
        }))
      );
      setPayouts(
        (po.data || []).map((p) => ({
          id: p._id,
          payeeName: p.payeeName || p.vendor?.storeName || p.school?.name || 'Unknown',
          payeeType: p.payeeType || p.ownerType || 'vendor',
          amount: toRupees(p.amountPaise),
          status: p.status,
          bank: p.bankDetailsSnapshot || {},
          reference: p.transactionReference,
          requestedAt: p.audit?.createdAt ? new Date(p.audit.createdAt).toLocaleString() : '—',
        }))
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load wallet data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (payoutId) => {
    const ref = window.prompt('Bank transaction reference / UTR (optional)') ?? '';
    setProcessingId(payoutId);
    setError('');
    try {
      await approvePayoutRequest(payoutId, ref || undefined);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to approve payout'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payoutId) => {
    const reason = window.prompt('Reason for rejection');
    if (reason === null) return;
    setProcessingId(payoutId);
    setError('');
    try {
      await rejectPayoutRequest(payoutId, reason || 'Rejected by admin');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to reject payout'));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTransactions = transactions.filter(
    (t) => typeFilter === 'All' || t.type === typeFilter
  );

  const pendingPayouts = payouts.filter((p) => ['pending', 'processing'].includes(p.status));

  const adminEarnings = transactions
    .filter((t) => t.transactionType === 'commission_deduction')
    .map((t) => ({ id: t.id, dateTime: t.dateTime, orderId: t.description, adminCut: Math.abs(t.amount) }));

  const platformRevenue = toRupees(overview?.platformRevenuePaise);
  const vendorEarnings = toRupees(overview?.totalEarningsPaise);
  const schoolEarnings = toRupees(overview?.schoolEarningsPaise);
  const pendingVendorPayouts = toRupees(overview?.pendingVendorPayoutPaise);
  const pendingSchoolPayouts = toRupees(overview?.pendingSchoolPayoutPaise);
  const totalPaidOut = toRupees(overview?.totalPaidOutPaise);

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      <div className="text-left select-none pb-2 border-b border-gray-200">
        <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Admin Wallet & Finance</h1>
        <p className="text-xs text-gray-400 font-bold mt-1">Track earnings across vendors & schools and process withdrawals.</p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 select-none">
        <KpiCard icon={<IndianRupee size={22} className="text-purple-600" />} tone="bg-purple-50 border-purple-100"
          label="Platform Revenue" value={platformRevenue} sub="Admin commission earned" />
        <KpiCard icon={<Store size={22} className="text-blue-600" />} tone="bg-blue-50 border-blue-100"
          label="Vendor Earnings" value={vendorEarnings} sub="Total credited to vendors" />
        <KpiCard icon={<SchoolIcon size={22} className="text-emerald-600" />} tone="bg-emerald-50 border-emerald-100"
          label="School Earnings" value={schoolEarnings} sub="Kit commission to schools" />
        <KpiCard icon={<CreditCard size={22} className="text-amber-600" />} tone="bg-amber-50 border-amber-100"
          label="Pending Vendor Payouts" value={pendingVendorPayouts} sub="Awaiting approval" />
        <KpiCard icon={<Clock size={22} className="text-amber-600" />} tone="bg-amber-50 border-amber-100"
          label="Pending School Payouts" value={pendingSchoolPayouts} sub="Awaiting approval" />
        <KpiCard icon={<WalletIcon size={22} className="text-gray-700" />} tone="bg-gray-50 border-gray-100"
          label="Total Paid Out" value={totalPaidOut} sub="Vendor + school withdrawals" />
      </div>

      <div className="bg-white rounded-3xl border border-gray-250/60 shadow-xs overflow-hidden flex flex-col text-left">
        <div className="flex border-b border-gray-150 bg-gray-50/50 select-none overflow-x-auto shrink-0">
          {[
            { label: 'Withdrawal Requests', icon: CreditCard },
            { label: 'All Transactions', icon: ArrowLeftRight },
            { label: 'Admin Earnings', icon: TrendingUp },
          ].map((tab) => {
            const isTabActive = activeTab === tab.label;
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                  isTabActive ? 'border-indigo-600 text-[#0B1528] bg-white' : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <Icon size={13} className={isTabActive ? 'text-indigo-600' : 'text-gray-400'} />
                <span>{tab.label}</span>
                {tab.label === 'Withdrawal Requests' && pendingPayouts.length > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {pendingPayouts.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 flex items-center justify-center text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-xs font-bold">Loading…</span>
            </div>
          ) : (
            <>
              {/* WITHDRAWAL REQUESTS */}
              {activeTab === 'Withdrawal Requests' && (
                <div className="overflow-x-auto border border-gray-200/80 rounded-2xl shadow-inner">
                  <table className="w-full text-left border-collapse min-w-[720px]">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                        <th className="px-5 py-3.5">Requested</th>
                        <th className="px-5 py-3.5">Payee</th>
                        <th className="px-5 py-3.5">Bank</th>
                        <th className="px-5 py-3.5">Amount</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
                      {payouts.length === 0 ? (
                        <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400 font-extrabold">No withdrawal requests yet.</td></tr>
                      ) : (
                        payouts.map((p) => {
                          const isPending = ['pending', 'processing'].includes(p.status);
                          const busy = processingId === p.id;
                          return (
                            <tr key={p.id} className="hover:bg-gray-50/50">
                              <td className="px-5 py-4 text-gray-400 font-extrabold tabular-nums select-none">{p.requestedAt}</td>
                              <td className="px-5 py-4">
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-gray-950">{p.payeeName}</span>
                                  <span className={`text-[9px] uppercase font-black tracking-wide mt-0.5 ${p.payeeType === 'school' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {p.payeeType}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-gray-500 font-medium">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-extrabold text-gray-950 block">{p.bank?.accountName || p.payeeName}</span>
                                    <span className="block text-xs text-gray-600">
                                      {p.bank?.bankName || '—'} {p.bank?.accountNumberMasked || ''}
                                    </span>
                                    {p.bank?.ifsc && <span className="block text-[9px] text-gray-400 font-mono">IFSC: {p.bank.ifsc}</span>}
                                  </div>
                                  <button
                                    onClick={() => setSelectedBankModal(p)}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all"
                                  >
                                    Bank Details
                                  </button>
                                </div>
                              </td>
                              <td className="px-5 py-4 font-black text-[#0B1528] tabular-nums">₹{p.amount.toFixed(2)}</td>
                              <td className="px-5 py-4 select-none">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${PAYOUT_STATUS_STYLES[p.status] || PAYOUT_STATUS_STYLES.failed}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isPending && (
                                    <>
                                      <button onClick={() => handleApprove(p.id)} disabled={busy}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-60">
                                        {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Approve
                                      </button>
                                      <button onClick={() => handleReject(p.id)} disabled={busy}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-wider disabled:opacity-60">
                                        <XCircle size={12} /> Reject
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => setStatusEditModal(p)}
                                    disabled={busy}
                                    className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                    title="Change Payout Status"
                                  >
                                    Update Status
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ALL TRANSACTIONS */}
              {activeTab === 'All Transactions' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 select-none pb-2">
                    <div className="relative">
                      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                        className="appearance-none bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-xs font-extrabold text-gray-700 pl-4 pr-10 py-2.5 rounded-xl cursor-pointer focus:outline-none">
                        <option value="All">All Types</option>
                        <option value="Credit">Credit</option>
                        <option value="Debit">Debit</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

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
                          <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400 font-extrabold">No transactions found.</td></tr>
                        ) : (
                          filteredTransactions.map((t) => {
                            const isCredit = t.type === 'Credit';
                            return (
                              <tr key={t.id} className="hover:bg-gray-50/50">
                                <td className="px-5 py-4 text-gray-400 font-extrabold tabular-nums select-none">{t.dateTime}</td>
                                <td className="px-5 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-gray-950">{t.user}</span>
                                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-wide mt-0.5">{t.role}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 select-none">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${isCredit ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    {t.type}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-gray-500 font-medium max-w-[280px] truncate">{t.description}</td>
                                <td className={`px-5 py-4 text-right font-black tabular-nums ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
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

              {/* ADMIN EARNINGS */}
              {activeTab === 'Admin Earnings' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100/50 rounded-2xl p-4 mb-2 select-none">
                    <Info size={16} className="shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-wider leading-relaxed">
                      Platform commission deducted per settled order.
                    </p>
                  </div>
                  <div className="overflow-x-auto border border-gray-200/80 rounded-2xl shadow-inner">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                          <th className="px-5 py-3.5">Date & Time</th>
                          <th className="px-5 py-3.5">Reference</th>
                          <th className="px-5 py-3.5 text-right">Admin Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
                        {adminEarnings.length === 0 ? (
                          <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-400 font-extrabold">No commission recorded yet.</td></tr>
                        ) : (
                          adminEarnings.map((ae) => (
                            <tr key={ae.id} className="hover:bg-gray-50/50">
                              <td className="px-5 py-4 text-gray-400 font-extrabold tabular-nums select-none">{ae.dateTime}</td>
                              <td className="px-5 py-4 font-extrabold text-indigo-600 max-w-[320px] truncate">{ae.orderId}</td>
                              <td className="px-5 py-4 text-right font-black text-[#0B1528] tabular-nums">+₹{ae.adminCut.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* BANK DETAILS INSPECTION MODAL FOR ADMIN */}
      {selectedBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Landmark size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">Payee Bank Details</h3>
                  <p className="text-[10px] font-bold text-gray-400">{selectedBankModal.payeeName} ({selectedBankModal.payeeType})</p>
                </div>
              </div>
              <button onClick={() => setSelectedBankModal(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            {copyFeedback && (
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={14} /> {copyFeedback}
              </div>
            )}

            <div className="space-y-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-150 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Account Name</span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900">{selectedBankModal.bank?.accountName || selectedBankModal.payeeName}</span>
                  {selectedBankModal.bank?.accountName && (
                    <button onClick={() => copyToClipboard(selectedBankModal.bank.accountName, 'Account name')} className="text-indigo-600 hover:text-indigo-800" title="Copy">
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Bank Name</span>
                <span className="font-extrabold text-gray-900">{selectedBankModal.bank?.bankName || '—'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Branch</span>
                <span className="font-bold text-gray-700">{selectedBankModal.bank?.branch || '—'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-gray-900">{selectedBankModal.bank?.accountNumberMasked || '—'}</span>
                  {selectedBankModal.bank?.accountNumberMasked && (
                    <button onClick={() => copyToClipboard(selectedBankModal.bank.accountNumberMasked, 'Account number')} className="text-indigo-600 hover:text-indigo-800" title="Copy">
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 font-bold uppercase text-[10px]">IFSC Code</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-indigo-700 uppercase">{selectedBankModal.bank?.ifsc || '—'}</span>
                  {selectedBankModal.bank?.ifsc && (
                    <button onClick={() => copyToClipboard(selectedBankModal.bank.ifsc, 'IFSC code')} className="text-indigo-600 hover:text-indigo-800" title="Copy">
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBankModal(null)}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-gray-800"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS EDIT MODAL FOR ADMIN */}
      {statusEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleUpdateStatusSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">Update Withdrawal Request Status</h3>
                <p className="text-[10px] font-bold text-gray-400">{statusEditModal.payeeName} • ₹{statusEditModal.amount.toFixed(2)}</p>
              </div>
              <button type="button" onClick={() => setStatusEditModal(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">New Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pending">Pending (Under Review)</option>
                  <option value="processing">Processing (Bank Transfer Initiated)</option>
                  <option value="completed">Completed (Paid Out)</option>
                  <option value="rejected">Rejected (Declined)</option>
                  <option value="failed">Failed (Transfer Error)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">
                  Bank Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR9876543210 or N12345"
                  value={statusForm.reference}
                  onChange={(e) => setStatusForm({ ...statusForm, reference: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {['rejected', 'failed'].includes(statusForm.status) && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-rose-500 tracking-wider mb-1.5">
                    Reason for Rejection / Failure
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter reason..."
                    value={statusForm.reason}
                    onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
                    className="w-full p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusEditModal(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processingId === statusEditModal.id}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {processingId === statusEditModal.id && <Loader2 size={14} className="animate-spin" />}
                Save Status
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">School E-Mart</span>
        </p>
      </div>
    </div>
  );
};

export default WalletManagement;
