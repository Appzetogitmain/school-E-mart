import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Wallet, TrendingUp, 
  ArrowUpRight, ArrowDownLeft, 
  History, Sparkles, Plus,
  ShieldCheck, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const WalletPage = () => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();

  // Simulated wallet data
  const wallet = {
    balance: "1,250",
    monthlyEarnings: "450",
    totalEarnings: "3,800",
    transactions: isGuest ? [] : [
      {
        id: 1,
        title: "Referral Bonus - Amit R.",
        amount: "50",
        type: "credit",
        date: "Today, 10:45 AM",
        status: "Success"
      },
      {
        id: 2,
        title: "Order Cashback - #EK2934",
        amount: "120",
        type: "credit",
        date: "Yesterday, 04:20 PM",
        status: "Success"
      },
      {
        id: 3,
        title: "Purchase Payment - #EK3041",
        amount: "850",
        type: "debit",
        date: "24 Apr 2026, 11:30 AM",
        status: "Success"
      },
      {
        id: 4,
        title: "Referral Bonus - Sneha K.",
        amount: "50",
        type: "credit",
        date: "20 Apr 2026, 09:15 AM",
        status: "Success"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-black text-deep-purple">My Wallet</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary active:scale-90 transition-all">
          <HelpCircle size={20} />
        </button>
      </div>

      <div className="pt-24 px-6 space-y-8">
        {/* Balance Card */}
        <section className="relative bg-gradient-to-br from-primary to-[#8C75FF] rounded-[2.5rem] p-8 text-white overflow-hidden shadow-xl shadow-primary/20 animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                <Wallet size={24} className="text-white" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <ShieldCheck size={14} className="text-green-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Secure</span>
              </div>
            </div>
            
            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-2 ml-1">Available Balance</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black">₹{isGuest ? '0' : wallet.balance}</span>
              <span className="text-sm font-medium text-white/60">.00</span>
            </div>
            <p className="text-white/40 text-[10px] font-medium leading-none ml-1">
              Earned via referrals and rewards
            </p>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex flex-col items-center gap-2 active:scale-95 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold text-deep-purple">Withdraw</span>
          </button>
          <button className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex flex-col items-center gap-2 active:scale-95 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <History size={20} />
            </div>
            <span className="text-xs font-bold text-deep-purple">History</span>
          </button>
        </div>

        {/* Earnings Summary */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Earnings Summary</h3>
          <div className="bg-golden-yellow/10 rounded-[2.5rem] p-8 border border-golden-yellow/20 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-golden-yellow uppercase tracking-widest mb-1">This Month</p>
              <p className="text-2xl font-black text-deep-purple">₹{isGuest ? '0' : wallet.monthlyEarnings}</p>
            </div>
            <div className="w-px h-12 bg-golden-yellow/20"></div>
            <div className="text-right">
              <p className="text-[10px] font-black text-golden-yellow uppercase tracking-widest mb-1">Total Earned</p>
              <p className="text-2xl font-black text-primary">₹{isGuest ? '0' : wallet.totalEarnings}</p>
            </div>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="space-y-4 pb-12">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Recent Transactions</h3>
          
          {wallet.transactions.length > 0 ? (
            <div className="space-y-3">
              {wallet.transactions.map((tx, idx) => (
                <div 
                  key={tx.id} 
                  className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 flex items-center justify-between group active:scale-[0.98] transition-all animate-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                      {tx.type === 'credit' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-deep-purple mb-1 truncate max-w-[160px]">{tx.title}</h4>
                      <p className="text-[10px] text-gray-400 font-medium">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'credit' ? '+' : '–'}₹{tx.amount}
                    </p>
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-xl shadow-primary/5 border border-gray-50 animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 bg-[#F8F7FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet size={48} className="text-primary/20" />
              </div>
              <h3 className="text-lg font-black text-deep-purple mb-2">No transactions yet</h3>
              <p className="text-gray-400 text-xs font-medium leading-relaxed max-w-[200px] mx-auto mb-8">
                Start referring friends to earn rewards and build your wallet balance.
              </p>
              <button 
                onClick={() => navigate('/user/refer')}
                className="px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                Start Referring
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Floating Add Money Button (Optional visual flair) */}
      {!isGuest && (
        <button className="fixed bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white">
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};

export default WalletPage;
