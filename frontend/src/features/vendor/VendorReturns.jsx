import React, { useState, useMemo } from 'react';
import { 
  RotateCcw, RefreshCw, Inbox, Check, X, Search, ChevronDown, 
  Eye, Truck, CheckCircle2, AlertTriangle, AlertCircle, Calendar, 
  User, CreditCard, ShieldCheck, ShieldAlert
} from 'lucide-react';

const VendorReturns = () => {
  // Local States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState('All');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [refreshSpin, setRefreshSpin] = useState(false);

  // Return Requests seed data matching uniform procurement returns
  const [returns, setReturns] = useState([]);

  // Handle refresh action spinner
  const handleRefresh = () => {
    setRefreshSpin(true);
    setTimeout(() => {
      setRefreshSpin(false);
    }, 800);
  };

  // Status updates
  const updateReturnStatus = (id, newStatus, qStatus) => {
    setReturns(returns.map(ret => {
      if (ret.id === id) {
        return {
          ...ret,
          status: newStatus,
          qcStatus: qStatus || ret.qcStatus
        };
      }
      return ret;
    }));

    if (selectedReturn && selectedReturn.id === id) {
      setSelectedReturn({
        ...selectedReturn,
        status: newStatus,
        qcStatus: qStatus || selectedReturn.qcStatus
      });
    }
  };

  // Metrics (Count of respective categories)
  const countRequested = useMemo(() => returns.filter(r => r.status === 'Requested').length, [returns]);
  const countApproved = useMemo(() => returns.filter(r => r.status === 'Approved' || r.status === 'QC Passed' || r.status === 'Pickup Assigned' || r.status === 'In Transit').length, [returns]);
  const countRejected = useMemo(() => returns.filter(r => r.status === 'Rejected').length, [returns]);
  const countCompleted = useMemo(() => returns.filter(r => r.status === 'Completed').length, [returns]);

  // Filtered return list matching search query & segment selection
  const filteredReturns = useMemo(() => {
    return returns.filter(ret => {
      // Search match
      const matchesSearch = searchQuery === '' || 
        ret.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ret.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ret.customer.toLowerCase().includes(searchQuery.toLowerCase());

      // Segment tabs mapping
      let matchesSegment = true;
      if (activeSegment !== 'All') {
        matchesSegment = ret.status.toLowerCase() === activeSegment.toLowerCase();
      }

      return matchesSearch && matchesSegment;
    });
  }, [returns, searchQuery, activeSegment]);

  return (
    <div className="space-y-6 pb-12 relative font-sans text-gray-900 selection:bg-purple-100">
      
      {/* 1. Header Control Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Return Requests</h1>
            <span className="inline-flex items-center gap-1 bg-[#5B3FD6]/10 text-[#5B3FD6] px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              NEW
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-400 mt-1">Review and manage customer return requests.</p>
        </div>

        <button 
          onClick={handleRefresh}
          className="border border-gray-200 text-gray-700 bg-white font-extrabold hover:bg-gray-50 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs shadow-sm cursor-pointer transition-all"
        >
          <RefreshCw size={14} className={refreshSpin ? 'animate-spin' : ''} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* 2. Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Requested Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-gray-200">
            <Inbox size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Requested</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{countRequested}</span>
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-[#5B3FD6] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-200">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Approved</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{countApproved}</span>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100/50">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Rejected</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{countRejected}</span>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100/50">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Completed</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{countCompleted}</span>
          </div>
        </div>

      </div>

      {/* 3. Filter Segment Tabs & Search Bar */}
      <div className="space-y-4">
        
        {/* Navigation Filters */}
        <div className="flex bg-gray-50 border border-gray-100 p-1.5 rounded-2xl overflow-x-auto w-full no-scrollbar">
          {[
            'All', 'Requested', 'Approved', 'Rejected', 
            'Pickup Assigned', 'In Transit', 'QC Passed', 
            'QC Failed', 'Completed'
          ].map((seg) => {
            const isActive = activeSegment === seg;
            return (
              <button
                key={seg}
                onClick={() => setActiveSegment(seg)}
                className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-100/50' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {seg}
              </button>
            );
          })}
        </div>

        {/* Search controls */}
        <div className="flex items-center gap-3">
          <div className="relative group w-full sm:w-[350px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search return ID, item name or customer..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] placeholder-gray-400 font-medium shadow-sm"
            />
          </div>
        </div>

      </div>

      {/* 4. Customer Returns Requests Grid Table */}
      <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <th className="px-6 py-4">Request Info</th>
                <th className="px-6 py-4">Return Item Details</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Refund Value</th>
                <th className="px-6 py-4">Return Reason</th>
                <th className="px-6 py-4">QC Status</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
              {filteredReturns.length > 0 ? (
                filteredReturns.map((ret) => {
                  
                  // Status Colors matching signature theme
                  let statusBadge = "bg-gray-50 text-gray-500 border-gray-100";
                  if (ret.status === 'Requested') statusBadge = "bg-blue-50 text-blue-600 border-blue-100";
                  else if (ret.status === 'Approved') statusBadge = "bg-[#5B3FD6]/10 text-[#5B3FD6] border-[#5B3FD6]/20";
                  else if (ret.status === 'QC Passed') statusBadge = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  else if (ret.status === 'Completed') statusBadge = "bg-slate-100 text-slate-700 border-slate-200";
                  else if (ret.status === 'Rejected') statusBadge = "bg-rose-50 text-rose-600 border-rose-100";

                  // QC Status Colors
                  let qcBadge = "bg-gray-50 text-gray-500";
                  if (ret.qcStatus === 'QC Passed') qcBadge = "bg-emerald-50 text-emerald-600";
                  else if (ret.qcStatus === 'QC Failed') qcBadge = "bg-rose-50 text-rose-600";

                  return (
                    <tr key={ret.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Request Info */}
                      <td className="px-6 py-4.5">
                        <p className="font-extrabold text-gray-900 tracking-tight leading-tight">{ret.id}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase flex items-center gap-1">
                          <Calendar size={10} /> {ret.date}
                        </p>
                      </td>

                      {/* Product Details */}
                      <td className="px-6 py-4.5 max-w-[320px]">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${ret.imgBg} flex items-center justify-center font-black text-sm shrink-0 shadow-sm`}>
                            {ret.product.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-snug">{ret.product}</p>
                            <p className="text-[9px] text-gray-400 font-medium mt-1">Code: {ret.code} | {ret.variant}</p>
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4.5 text-gray-900 font-extrabold">{ret.quantity} unit(s)</td>

                      {/* Refund Value */}
                      <td className="px-6 py-4.5 text-[#5B3FD6] font-black text-sm">₹{ret.refundVal}</td>

                      {/* Reason */}
                      <td className="px-6 py-4.5 max-w-[200px] text-gray-500 font-medium italic leading-relaxed">
                        "{ret.reason}"
                      </td>

                      {/* QC Status */}
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${qcBadge}`}>
                          {ret.qcStatus === 'QC Passed' && <ShieldCheck size={10} />}
                          {ret.qcStatus === 'QC Failed' && <ShieldAlert size={10} />}
                          {ret.qcStatus}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${statusBadge}`}>
                          {ret.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4.5 text-center">
                        <button
                          onClick={() => setSelectedReturn(ret)}
                          className="px-3 py-1.5 rounded-xl border border-purple-100 hover:border-transparent bg-gray-50 hover:bg-[#5B3FD6]/10 text-gray-600 hover:text-[#5B3FD6] text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>Review Request</span>
                        </button>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-bold bg-white">
                    No return requests matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Return Details / Action Drawer */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end transition-all animate-fade-in">
          <div className="w-full max-w-[500px] bg-white h-full shadow-2xl flex flex-col animate-slide-in relative">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black text-[#5B3FD6] uppercase tracking-wider block">Return Details</span>
                <h3 className="font-extrabold text-base text-gray-900 mt-1">Review Request {selectedReturn.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedReturn(null)}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors border border-gray-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Product preview */}
              <div className="p-4.5 bg-gray-50 border border-gray-100 rounded-2xl flex gap-3.5 items-start">
                <div className={`w-10 h-10 rounded-xl ${selectedReturn.imgBg} flex items-center justify-center font-black text-base shrink-0 border border-gray-100 shadow-sm mt-0.5`}>
                  {selectedReturn.product.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-gray-900 leading-tight">{selectedReturn.product}</h4>
                  <p className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase">SKU: {selectedReturn.code} | {selectedReturn.variant}</p>
                </div>
              </div>

              {/* Customer Profile info */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Customer & Shipping</span>
                <div className="bg-white border border-gray-100 rounded-2xl p-4.5 space-y-3.5 shadow-sm text-xs font-semibold">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-[#5B3FD6] flex items-center justify-center shrink-0">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-gray-900 font-extrabold leading-none">{selectedReturn.customer.split(' (')[0]}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">{selectedReturn.customer.split(' (')[1]?.replace(')', '') || 'Authorized School Client'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-gray-50">
                    <span className="text-gray-400">Request Date</span>
                    <span className="text-gray-900 font-bold">{selectedReturn.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Quantity</span>
                    <span className="text-gray-900 font-bold">{selectedReturn.quantity} unit(s)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Refund Amount</span>
                    <span className="text-[#5B3FD6] font-black">₹{selectedReturn.refundVal}</span>
                  </div>
                </div>
              </div>

              {/* Return Reason explanation */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block font-sans">Return Reason</span>
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-xs leading-relaxed text-amber-800 font-semibold font-sans italic">
                  "{selectedReturn.reason}"
                </div>
              </div>

              {/* QC Status Checklist */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Quality Control Inspection</span>
                <div className="border border-gray-100 rounded-2xl p-4.5 bg-white space-y-4 shadow-sm text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Inspect tags & stickers</span>
                    <span className="text-emerald-500 flex items-center gap-1 font-bold">
                      <Check size={14} /> Passed
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Fabric/Item condition check</span>
                    <span className="text-gray-400 font-bold">Pending return shipment</span>
                  </div>
                  
                  {/* Action buttons to trigger QC Passed/Failed */}
                  {selectedReturn.status === 'Requested' && (
                    <div className="flex items-center gap-2.5 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => updateReturnStatus(selectedReturn.id, 'QC Passed', 'QC Passed')}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer inline-flex items-center justify-center gap-1"
                      >
                        <ShieldCheck size={12} /> QC Passed
                      </button>
                      <button
                        onClick={() => updateReturnStatus(selectedReturn.id, 'Rejected', 'QC Failed')}
                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer inline-flex items-center justify-center gap-1"
                      >
                        <ShieldAlert size={12} /> QC Failed
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status workflow triggers */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Workflow Actions</span>
                <div className="flex flex-wrap items-center gap-2">
                  
                  {selectedReturn.status === 'Requested' && (
                    <>
                      <button
                        onClick={() => updateReturnStatus(selectedReturn.id, 'Approved')}
                        className="flex-1 py-3 bg-[#5B3FD6] hover:bg-[#492eb3] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-100 cursor-pointer inline-flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} strokeWidth={2.5} /> Approve Refund
                      </button>
                      <button
                        onClick={() => updateReturnStatus(selectedReturn.id, 'Rejected')}
                        className="px-4 py-3 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-100 text-gray-700 hover:text-rose-600 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center justify-center"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {selectedReturn.status === 'Approved' && (
                    <button
                      onClick={() => updateReturnStatus(selectedReturn.id, 'Pickup Assigned')}
                      className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Truck size={14} /> Assign Pickup Courier
                    </button>
                  )}

                  {selectedReturn.status === 'Pickup Assigned' && (
                    <button
                      onClick={() => updateReturnStatus(selectedReturn.id, 'In Transit')}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Truck size={14} /> Ship in Transit
                    </button>
                  )}

                  {selectedReturn.status === 'In Transit' && (
                    <button
                      onClick={() => updateReturnStatus(selectedReturn.id, 'QC Passed')}
                      className="w-full py-3 bg-[#5B3FD6] hover:bg-[#492eb3] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={14} /> Mark QC Passed
                    </button>
                  )}

                  {selectedReturn.status === 'QC Passed' && (
                    <button
                      onClick={() => updateReturnStatus(selectedReturn.id, 'Completed')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Disburse Refund & Complete
                    </button>
                  )}

                  {selectedReturn.status === 'Completed' && (
                    <div className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">Refund Settled</p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Return is fully processed and closed.</p>
                      </div>
                    </div>
                  )}

                  {selectedReturn.status === 'Rejected' && (
                    <div className="w-full p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                        <X size={16} strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-rose-800 uppercase tracking-wider">Request Rejected</p>
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5">This return request has been rejected by vendor.</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default VendorReturns;
