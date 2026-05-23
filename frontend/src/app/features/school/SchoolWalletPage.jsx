import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Wallet, Plus, ArrowUpRight, 
  ArrowDownLeft, History, Filter, Building2,
  ChevronRight, Receipt
} from 'lucide-react';

const SchoolWalletPage = () => {
  const navigate = useNavigate();

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
            <button className="bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">Manage Credits</button>
          </div>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Available Credits</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">₹12,450.00</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button className="bg-white p-5 rounded-[2rem] border border-gray-100 flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Plus size={20} />
            </div>
            <span className="text-[11px] font-black text-deep-purple uppercase tracking-widest">Add Credits</span>
          </button>
          <button className="bg-white p-5 rounded-[2rem] border border-gray-100 flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
              <Receipt size={20} />
            </div>
            <span className="text-[11px] font-black text-deep-purple uppercase tracking-widest">Invoices</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-deep-purple uppercase tracking-widest">Transaction History</h3>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">Filter <Filter size={10} /></button>
          </div>

          {[
            { title: "Bulk Stationery Proc.", amount: "- ₹4,500", date: "Today, 11:30 am", status: "debit" },
            { title: "Partner Referral Credit", amount: "+ ₹2,500", date: "02 May 2026", status: "credit" },
            { title: "Uniform Batch Order", amount: "- ₹18,200", date: "28 Apr 2026", status: "debit" }
          ].map((tx, i) => (
            <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchoolWalletPage;
