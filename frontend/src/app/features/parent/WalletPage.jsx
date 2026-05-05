import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Wallet, TrendingUp, 
  ArrowUpRight, ArrowDownLeft, 
  Clock, CheckCircle2, AlertCircle,
  HelpCircle, ChevronRight
} from 'lucide-react';

const WalletPage = () => {
  const navigate = useNavigate();
  const [wallet] = useState({
    balance: "1,250",
    monthlyEarnings: "450",
    totalEarnings: "3,850",
    transactions: [
      {
        id: "TXN10293",
        title: "Referral Bonus",
        subtitle: "Invited: Rohan Sharma",
        amount: "50",
        type: "credit",
        date: "Today, 02:45 pm",
        status: "success"
      },
      {
        id: "TXN10284",
        title: "Order Cashback",
        subtitle: "Order ID: #SH8291",
        amount: "25",
        type: "credit",
        date: "Yesterday, 11:20 am",
        status: "success"
      },
      {
        id: "TXN10271",
        title: "Purchase Payment",
        subtitle: "Order ID: #SH7162",
        amount: "150",
        type: "debit",
        date: "28 Apr 2026",
        status: "success"
      },
      {
        id: "TXN10265",
        title: "Referral Bonus",
        subtitle: "Invited: Priya Verma",
        amount: "50",
        type: "credit",
        date: "25 Apr 2026",
        status: "success"
      },
      {
        id: "TXN10259",
        title: "Refund Processed",
        subtitle: "Order ID: #SH6155",
        amount: "899",
        type: "credit",
        date: "20 Apr 2026",
        status: "pending"
      }
    ]
  });

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit">
      {/* Header */}
      <div className="bg-deep-purple px-6 pt-10 pb-5 flex items-center gap-4 sticky top-0 z-50 shadow-xl shadow-primary/10 rounded-b-[2rem]">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-white tracking-tight">My Wallet</h1>
      </div>

      <div className="px-6 pt-8 space-y-8">
        {/* Balance Card */}
        <section className="relative bg-gradient-to-br from-deep-purple to-[#8C75FF] rounded-[2.5rem] p-8 text-white overflow-hidden shadow-2xl shadow-purple-200 animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-70">
              <Wallet size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">Available Balance</p>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-2xl font-bold opacity-70">₹</span>
              <span className="text-5xl font-black tracking-tight">{wallet.balance}</span>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <p className="text-[10px] font-medium text-white/60 max-w-[140px]">
                Earned via referrals and rewards
              </p>
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Withdraw
              </button>
            </div>
          </div>
        </section>

        {/* Earnings Summary */}
        <section>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-4">Earnings Summary</h3>
          <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] rounded-[2rem] p-6 border border-golden-yellow/20 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-golden-yellow/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div>
              <p className="text-[10px] font-black text-golden-yellow uppercase tracking-widest mb-1">This Month</p>
              <p className="text-2xl font-black text-deep-purple">₹{wallet.monthlyEarnings}</p>
            </div>
            <div className="w-px h-12 bg-golden-yellow/20"></div>
            <div className="text-right">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total Earned</p>
              <p className="text-2xl font-black text-primary">₹{wallet.totalEarnings}</p>
            </div>
          </div>
        </section>

        {/* Transaction History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Recent Transactions</h3>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest">See All</button>
          </div>

          <div className="space-y-3">
            {wallet.transactions.length > 0 ? (
              wallet.transactions.map((txn, index) => (
                <div 
                  key={txn.id}
                  className="bg-white p-4 rounded-[1.8rem] shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all"
                  style={{ 
                    animation: `slideIn 0.3s ease-out ${index * 0.05}s forwards`,
                    opacity: 0,
                    transform: 'translateY(10px)'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${txn.type === 'credit' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                      {txn.type === 'credit' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-deep-purple mb-0.5">{txn.title}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-gray-400 font-medium">{txn.date}</p>
                        {txn.status === 'pending' && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-orange-400 uppercase bg-orange-50 px-1.5 py-0.5 rounded">
                            <Clock size={8} /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${txn.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                      {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                    </p>
                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter mt-0.5">{txn.id}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-white rounded-[2.5rem] border border-gray-50 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet size={32} className="text-gray-200" />
                </div>
                <h4 className="text-sm font-bold text-deep-purple mb-1">No transactions yet</h4>
                <p className="text-xs text-gray-400 max-w-[200px] mx-auto">Start referring friends or placing orders to earn rewards!</p>
              </div>
            )}
          </div>
        </section>

        {/* Support Section */}
        <section className="bg-white rounded-[2rem] p-6 border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <HelpCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-deep-purple">Wallet help</h4>
              <p className="text-[10px] text-gray-400">Questions about your balance?</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </section>
      </div>

      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default WalletPage;
