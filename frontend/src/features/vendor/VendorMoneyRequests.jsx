import React, { useState, useMemo } from 'react';
import { 
  CreditCard, ArrowUpRight, Search, Clock, HelpCircle, X, Check,
  TrendingUp, AlertCircle, Sparkles, Building, Landmark, Compass, DollarSign
} from 'lucide-react';

const VendorMoneyRequests = () => {
  // Local States
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time State management for Fintech simulations
  const [availableBal, setAvailableBal] = useState(0);
  const [onHoldBal, setOnHoldBal] = useState(0);
  const [pendingBal, setPendingBal] = useState(0);
  const [lastWithdrawalBal, setLastWithdrawalBal] = useState(0);
  const [requests, setRequests] = useState([]);

  // Form State inside Payout Drawer
  const [reqAmount, setReqAmount] = useState('');
  const [reqMethod, setReqMethod] = useState('Bank Transfer');
  const [reqBankName, setReqBankName] = useState('HDFC Bank');
  const [reqAccount, setReqAccount] = useState('******4092');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  // Quick simulation helper to add funds (optional testing feature for the user)
  const handleLoadMockFunds = () => {
    setAvailableBal(50000);
    setOnHoldBal(12000);
  };

  // Submit Payout Request
  const handleSubmitRequest = (e) => {
    e.preventDefault();
    const amt = parseFloat(reqAmount);
    
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid payout amount.');
      return;
    }

    if (amt > availableBal) {
      setErrorMsg(`Insufficient funds! Your available balance is ₹${availableBal}.`);
      return;
    }

    // Process simulation
    setErrorMsg('');
    setAvailableBal(prev => prev - amt);
    setPendingBal(prev => prev + amt);

    const newReq = {
      id: `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      status: 'Pending Approval',
      method: reqMethod,
      details: `${reqBankName} (${reqAccount})`
    };

    setRequests([newReq, ...requests]);
    setSuccessMsg(true);
    setReqAmount('');

    setTimeout(() => {
      setSuccessMsg(false);
      setShowDrawer(false);
    }, 1500);
  };

  // Filter requests matching search query
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      return searchQuery === '' || 
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.details.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [requests, searchQuery]);

  return (
    <div className="space-y-6 pb-12 relative font-sans text-gray-900 selection:bg-purple-100">
      
      {/* 1. Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Money Requests</h1>
            <CreditCard size={20} className="text-gray-400" />
          </div>
          <p className="text-xs font-semibold text-gray-400 mt-1">Request payouts and track your withdrawal history.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Optional Simulation Button if Balance is 0 */}
          {availableBal === 0 && (
            <button 
              onClick={handleLoadMockFunds}
              className="px-3.5 py-2.5 rounded-xl border border-dashed border-purple-200 bg-purple-50 text-[#5B3FD6] text-xs font-extrabold hover:bg-purple-100/50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Simulate Balances</span>
            </button>
          )}

          <button 
            onClick={() => setShowDrawer(true)}
            className="bg-[#0E0E2C] hover:opacity-90 text-white font-extrabold flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs shadow-lg cursor-pointer transition-all"
          >
            <span>NEW REQUEST</span>
            <ArrowUpRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 2. Balance Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Available Balance Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100/50">
            <Landmark size={18} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Available Balance</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">₹{availableBal.toLocaleString('en-IN')}</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ready to Withdraw</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
            <CreditCard size={120} />
          </div>
        </div>

        {/* On Hold Balance Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-100/50">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">On Hold</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">₹{onHoldBal.toLocaleString('en-IN')}</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Return Window Open</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
            <Clock size={120} />
          </div>
        </div>

        {/* Pending Withdrawals Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/50">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Withdrawal Pending</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">₹{pendingBal.toLocaleString('en-IN')}</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Awaiting Approval</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
            <TrendingUp size={120} />
          </div>
        </div>

        {/* Last Withdrawal Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="w-10 h-10 bg-purple-50 text-[#5B3FD6] rounded-xl flex items-center justify-center shrink-0 border border-purple-100/50">
            <Check size={18} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Last Withdrawal</span>
            <span className="text-2xl font-black text-[#5B3FD6] tracking-tight block mt-0.5">₹{lastWithdrawalBal.toLocaleString('en-IN')}</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B3FD6]"></span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sent to Bank</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
            <Check size={120} />
          </div>
        </div>

      </div>

      {/* 3. Transaction History Section */}
      <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm space-y-4">
        
        {/* Title and Search Control Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <h2 className="font-extrabold text-sm text-gray-900 tracking-tight">Withdrawal History</h2>
          </div>
          
          <div className="relative group w-full sm:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID or Status..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] placeholder-gray-400 font-medium"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <th className="px-6 py-4">Request Details</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => {
                  let statusStyle = "bg-amber-50 text-amber-600 border-amber-100";
                  if (req.status === 'Approved') statusStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  else if (req.status === 'Rejected') statusStyle = "bg-rose-50 text-rose-600 border-rose-100";

                  return (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-gray-900 tracking-tight">{req.id}</p>
                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">{req.date}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-sm text-[#5B3FD6]">
                        ₹{req.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${statusStyle}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        <p className="font-bold text-gray-800">{req.method}</p>
                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">{req.details}</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-400 font-bold bg-white">
                    No withdrawal requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 4. Money Request Payout Centered Modal Popup */}
      {showDrawer && (
        <div className="fixed inset-0 bg-[#0E0E2C]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="w-full max-w-[440px] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-scale-up relative p-7.5 space-y-6">
            
            {/* Header with Close X */}
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Request Withdrawal</h3>
              <button 
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Box */}
            <form onSubmit={handleSubmitRequest} className="space-y-6 flex-1 flex flex-col">
              
              {/* AVAILABLE TO WITHDRAW Card */}
              <div className="bg-[#F4F6F8] rounded-[1.25rem] p-4.5 flex items-center justify-between border border-gray-100/50">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase block">Available to Withdraw</span>
                  <span className="text-3xl font-black text-gray-900 tracking-tight block">₹{availableBal.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-10 h-10 border border-gray-100 bg-white rounded-xl flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                  <HelpCircle size={18} />
                </div>
              </div>

              {/* ENTER AMOUNT input container */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Enter Amount</label>
                <div className="rounded-[1.25rem] border border-gray-200 p-4.5 flex items-center bg-white group focus-within:border-[#5B3FD6] focus-within:ring-2 focus-within:ring-[#5B3FD6]/10 transition-all">
                  <span className="text-2xl font-black text-gray-300 group-focus-within:text-[#5B3FD6] mr-2 transition-colors">₹</span>
                  <input 
                    type="number" 
                    value={reqAmount}
                    onChange={(e) => setReqAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-2xl font-black text-gray-900 border-none outline-none focus:ring-0 placeholder-gray-200 bg-transparent p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* TRANSFER DESTINATION info box */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Transfer Destination</label>
                <div className="rounded-[1.25rem] border border-gray-200 p-4 flex items-center justify-between bg-white hover:bg-gray-50/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-700 shrink-0">
                      <Building size={18} />
                    </div>
                    <div>
                      <p className="font-black text-xs text-gray-900 uppercase tracking-wide">HDFC Bank</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Acct Ending In **** 4859</p>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-gray-400" />
                </div>
              </div>

              {/* Error messages inside modal */}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-[1.25rem] flex items-start gap-2.5 text-xs text-rose-700 font-semibold leading-normal">
                  <AlertCircle size={14} className="shrink-0 text-rose-500 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success validation */}
              {successMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-[1.25rem] flex items-start gap-2.5 text-xs text-emerald-800 font-black uppercase tracking-wider leading-normal">
                  <Check size={14} className="shrink-0 text-emerald-500 mt-0.5" />
                  <span>Request Submitted!</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-4.5 bg-[#0E0E2C] hover:opacity-95 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-gray-200 cursor-pointer text-center"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="w-full py-3 text-center text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer block"
                >
                  Nevermind, Keep Funds
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default VendorMoneyRequests;
