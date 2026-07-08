import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wallet, Plus, ArrowUpRight,
  ArrowDownLeft, History, Filter, Building2,
  ChevronRight, Receipt
} from 'lucide-react';
import { getMyWallet, listMyWalletTransactions } from '../../../services/walletApi';

const formatRupees = (paise) =>
  ((paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const SchoolWalletPage = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wallet, txns] = await Promise.all([
          getMyWallet(),
          listMyWalletTransactions({ limit: 30 }),
        ]);
        if (cancelled) return;
        setBalance(wallet?.balancePaise || 0);
        setTransactions(
          (txns.data || []).map((t) => ({
            id: t._id,
            title: t.description || 'Transaction',
            amount: `${t.type === 'credit' ? '+' : '-'} ₹${formatRupees(t.amountPaise)}`,
            date: t.audit?.createdAt
              ? new Date(t.audit.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—',
            status: t.type,
          }))
        );
      } catch {
        // Keep zero balance — wallet has no activity yet.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-20 font-outfit">
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-black text-deep-purple">Procurement Wallet</h1>
        <div className="w-10 h-10"></div>
      </div>

      <div className="pt-24 px-6">
        <div className="bg-deep-purple rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-purple-200 mb-8">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mb-24 blur-3xl"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
              <Building2 size={24} />
            </div>
          </div>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Available Credits</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">₹{formatRupees(balance)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-deep-purple uppercase tracking-widest">Transaction History</h3>
          </div>

          {loading ? (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center shadow-sm">
              <span className="text-xs font-bold text-gray-400">Loading transactions…</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center shadow-sm">
              <History size={32} className="text-gray-300 mx-auto mb-3" />
              <span className="text-xs font-bold text-gray-400 block">No transactions yet</span>
              <span className="text-[10px] text-gray-300 font-medium block mt-1">
                Wallet credits and procurement payments will appear here.
              </span>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.status === 'credit' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                    {tx.status === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-deep-purple">{tx.title}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">{tx.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-black ${tx.status === 'credit' ? 'text-green-500' : 'text-deep-purple'}`}>{tx.amount}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolWalletPage;
