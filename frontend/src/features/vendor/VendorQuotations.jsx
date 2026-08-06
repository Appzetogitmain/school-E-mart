import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileText, Award, XCircle, Search, SlidersHorizontal, ArrowUpDown,
  ChevronRight, HelpCircle, Trophy, FileCheck, FileClock,
  MapPin, Clock, Calendar, CheckCircle2, ChevronLeft, Building2,
  AlertCircle, Image as ImageIcon
} from 'lucide-react';
import { listVendorRfqs, submitVendorQuote } from '../../services/rfqApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import { mapVendorRfqForList } from '../../utils/mappers/rfqMapper';
import { toAbsoluteUrl } from '../../utils/url';

const VendorQuotations = () => {
  // States
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bidPrice, setBidPrice] = useState('');
  const [bidDelivery, setBidDelivery] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rfqs, setRfqs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadRfqs = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const { data } = await listVendorRfqs({ limit: 50 });
      setRfqs((data || []).map(mapVendorRfqForList));
    } catch (err) {
      setRfqs([]);
      setLoadError(getErrorMessage(err, 'Unable to load quotation requests'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRfqs();
  }, [loadRfqs]);

  // Dynamic counter computations based on live RFQs list
  const pendingCount = useMemo(() => rfqs.filter(r => r.status.toLowerCase() === 'pending').length, [rfqs]);
  const submittedCount = useMemo(() => rfqs.filter(r => r.status.toLowerCase() === 'submitted').length, [rfqs]);
  const awardedCount = useMemo(() => rfqs.filter(r => r.status.toLowerCase() === 'awarded').length, [rfqs]);
  const rejectedCount = useMemo(() => rfqs.filter(r => r.status.toLowerCase() === 'rejected').length, [rfqs]);

  // Filtering Logic
  const filteredRfqs = useMemo(() => {
    return rfqs.filter(rfq => {
      // Tab filter
      const matchesTab = activeTab === 'All' || rfq.status.toLowerCase() === activeTab.toLowerCase();
      
      // Search filter
      const matchesSearch = searchQuery === '' || 
        rfq.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rfq.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rfq.requirement.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [rfqs, activeTab, searchQuery]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRfq?.rfqId) return;

    setSubmitError('');
    setIsSubmitting(true);

    try {
      await submitVendorQuote(selectedRfq.rfqId, {
        unitPrice: Number(bidPrice),
        deliveryTimeline: bidDelivery,
        termsAndConditions: bidNotes,
        remarks: bidNotes,
      });

      setBidSubmitted(true);
      await loadRfqs();

      setTimeout(() => {
        setSelectedRfq(null);
        setBidSubmitted(false);
        setBidPrice('');
        setBidDelivery('');
        setBidNotes('');
      }, 2000);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to submit quote'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative font-sans text-gray-900 selection:bg-purple-100">
      
      {/* 1. Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quotations</h1>
          <p className="text-xs font-semibold text-gray-400 mt-1">View and respond to quotation requests from schools</p>
        </div>
        
        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-purple-200 hover:border-[#5B3FD6]/30 bg-purple-50/20 text-[#5B3FD6] text-xs font-extrabold transition-all shrink-0">
          <HelpCircle size={14} /> How Quotations Work?
        </button>
      </div>

      {/* 2. Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Pending RFQs */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100/50">
            <FileClock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Pending RFQs</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{pendingCount}</span>
            <span className="text-[10px] font-extrabold text-amber-500 block mt-0.5">Requires your quote</span>
          </div>
        </div>

        {/* Card 2: Submitted */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0 border border-blue-100/50">
            <FileCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Submitted</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{submittedCount}</span>
            <span className="text-[10px] font-extrabold text-blue-500 block mt-0.5">Quotes submitted</span>
          </div>
        </div>

        {/* Card 3: Awarded */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100/50">
            <Trophy size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Awarded</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{awardedCount}</span>
            <span className="text-[10px] font-extrabold text-emerald-500 block mt-0.5">You've been selected</span>
          </div>
        </div>

        {/* Card 4: Rejected */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0 border border-red-100/50">
            <XCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Rejected</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight block mt-0.5">{rejectedCount}</span>
            <span className="text-[10px] font-extrabold text-red-500 block mt-0.5">Not selected</span>
          </div>
        </div>

      </div>

      {loadError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
          {loadError}
        </div>
      )}

      {/* 3. Controls / Filters Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        
        {/* Left Side Tab Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Pending', 'Submitted', 'Awarded', 'Rejected'].map((tab) => {
            const isTabActive = activeTab === tab;
            let tabStyle = "";
            if (isTabActive) {
              tabStyle = "bg-[#5B3FD6] text-white shadow-md shadow-purple-200/50";
            } else {
              switch (tab) {
                case 'Pending':
                  tabStyle = "bg-amber-50 hover:bg-amber-100/70 text-amber-700 border border-amber-100";
                  break;
                case 'Submitted':
                  tabStyle = "bg-blue-50 hover:bg-blue-100/70 text-blue-700 border border-blue-100";
                  break;
                case 'Awarded':
                  tabStyle = "bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 border border-emerald-100";
                  break;
                case 'Rejected':
                  tabStyle = "bg-red-50 hover:bg-red-100/70 text-red-700 border border-red-100";
                  break;
                default:
                  tabStyle = "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100";
              }
            }

            return (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${tabStyle}`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Right Side Search & Filter Controls */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by School or Requirement..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] placeholder-gray-400 font-medium shadow-sm"
            />
          </div>
          
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-purple-200 hover:border-[#5B3FD6]/30 bg-white text-[#5B3FD6] text-xs font-bold transition-all shrink-0 shadow-sm">
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

      </div>

      {/* 4. Table Log Section */}
      <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    RFQ ID <ArrowUpDown size={10} className="text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    School <ArrowUpDown size={10} className="text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    Requirement <ArrowUpDown size={10} className="text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    Classes <ArrowUpDown size={10} className="text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    Deadline <ArrowUpDown size={10} className="text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    Status <ArrowUpDown size={10} className="text-gray-400" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#5B3FD6] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading Quotations...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRfqs.length > 0 ? (
                filteredRfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    {/* RFQ ID */}
                    <td className="px-6 py-4.5">
                      <p className="font-black text-gray-900 tracking-tight">{rfq.id}</p>
                      <p className="text-[10px] font-medium text-gray-400 mt-1">{rfq.date}</p>
                    </td>

                    {/* School */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${rfq.logoBg} flex items-center justify-center font-black text-sm shrink-0 border border-gray-100 shadow-sm`}>
                          {rfq.logoLetter}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 tracking-tight">{rfq.school}</p>
                          <p className="text-[10px] font-medium text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin size={8} className="text-purple-500" /> {rfq.location}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Requirement */}
                    <td className="px-6 py-4.5">
                      <p className="font-extrabold text-gray-800 tracking-tight">{rfq.requirement}</p>
                      <p className="text-[10px] font-medium text-gray-400 mt-0.5">{rfq.subRequirement}</p>
                    </td>

                    {/* Classes */}
                    <td className="px-6 py-4.5 text-gray-500 font-semibold">{rfq.classes}</td>

                    {/* Deadline */}
                    <td className="px-6 py-4.5">
                      <p className="font-bold text-gray-800">{rfq.deadline}</p>
                      <p className="text-[10px] font-black text-red-500 mt-1 uppercase tracking-wider">In {rfq.daysLeft}</p>
                    </td>

                    {/* Status badge pill */}
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${rfq.statusColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rfq.statusBullet}`}></span>
                        {rfq.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4.5 text-center">
                      <div className="inline-flex items-center gap-1 cursor-pointer group">
                        <button 
                          onClick={() => setSelectedRfq(rfq)}
                          className="px-3 py-1.5 rounded-xl border border-purple-100 hover:border-transparent bg-gray-50 hover:bg-[#5B3FD6]/10 text-gray-600 hover:text-[#5B3FD6] text-xs font-bold transition-all shadow-sm"
                        >
                          View Details
                        </button>
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-[#5B3FD6] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold bg-white">
                    No quotation requests found matching the selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Pagination Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
          Showing 1 to {filteredRfqs.length} of {filteredRfqs.length} entries
        </span>
        
        <div className="flex items-center gap-1">
          <button className="px-3 py-1.5 rounded-xl border border-gray-100 text-xs font-bold text-gray-400 hover:bg-gray-50 transition-all cursor-not-allowed">
            Previous
          </button>
          <button className="w-8 h-8 rounded-xl bg-[#5B3FD6] text-white text-xs font-bold flex items-center justify-center shadow-md shadow-purple-200">
            1
          </button>
          <button className="px-3 py-1.5 rounded-xl border border-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
            Next
          </button>
        </div>
      </div>

      {/* 6. INTERACTIVE BIDDING AND RFQ DRAWER */}
      {selectedRfq && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end transition-all animate-fade-in">
          
          <div className="w-full max-w-[500px] bg-white h-full shadow-2xl flex flex-col animate-slide-in relative">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black text-[#5B3FD6] uppercase tracking-wider block">Quotation Details</span>
                <h3 className="font-extrabold text-base text-gray-900 mt-1">
                  RFQ ID: {selectedRfq.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRfq(null)}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors border border-gray-100"
              >
                Close
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Submission State Banner */}
              {bidSubmitted ? (
                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3.5 animate-scale-in">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-emerald-800 uppercase tracking-wider">Bid Placed Successfully!</h4>
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Your quotation has been sent to the school board.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#5B3FD6]/10 text-[#5B3FD6] flex items-center justify-center shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800">{selectedRfq.school}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold mt-1 flex items-center gap-1">
                      <MapPin size={9} className="text-[#5B3FD6]" /> {selectedRfq.location}
                    </p>
                  </div>
                </div>
              )}

              {/* Requirement Summary */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Requirement Parameters</span>
                <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-white shadow-sm">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-wide">Category</span>
                    <span className="font-extrabold text-gray-900">{selectedRfq.requirement}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-wide">Target Classes</span>
                    <span className="font-extrabold text-gray-900">{selectedRfq.classes}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-wide">Submission Deadline</span>
                    <span className="font-extrabold text-red-500">{selectedRfq.deadline} (In {selectedRfq.daysLeft})</span>
                  </div>
                </div>
              </div>

              {/* Items List Details */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Items Requested</span>
                <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 shadow-sm">
                  {selectedRfq.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between text-xs bg-white">
                      <div>
                        <p className="font-black text-gray-800">{item.name}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-semibold">Volume Needed: {item.qty} units</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900">₹{item.estPrice.toFixed(2)}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5 font-semibold uppercase">Est. unit price</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reference Images (design/logo/fabric photos the school attached) */}
              {selectedRfq.referenceImages?.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ImageIcon size={12} className="text-[#5B3FD6]" /> Reference Images
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {selectedRfq.referenceImages.map((img, idx) => (
                      <a
                        key={idx}
                        href={toAbsoluteUrl(img.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm"
                        title={`${img.setName} — ${img.label}`}
                      >
                        <img
                          src={toAbsoluteUrl(img.url)}
                          alt={img.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[7px] font-bold px-1.5 py-1 truncate">
                          {img.label}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Responder Bid Form (Available for Pending RFQs) */}
              {selectedRfq.status === 'Pending' && !bidSubmitted && (
                <form onSubmit={handleBidSubmit} className="space-y-4 pt-2">
                  <span className="text-[10px] font-black text-[#5B3FD6] uppercase tracking-widest block">Submit Your Quote Bid</span>
                  
                  <div className="space-y-3 bg-purple-50/20 border border-[#5B3FD6]/10 rounded-2xl p-4">
                    
                    {/* 1. Price Quote */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Proposed Unit Price (₹)</label>
                      <input 
                        type="number"
                        required
                        value={bidPrice}
                        onChange={(e) => setBidPrice(e.target.value)}
                        placeholder="Enter per-unit bidding rate..."
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] font-semibold"
                      />
                    </div>

                    {/* 2. Delivery Time */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Fulfillment Timeline</label>
                      <input 
                        type="text"
                        required
                        value={bidDelivery}
                        onChange={(e) => setBidDelivery(e.target.value)}
                        placeholder="e.g. 15-20 Days after order receipt"
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] font-semibold"
                      />
                    </div>

                    {/* 3. Additional Terms */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Additional Specifications / Comments</label>
                      <textarea 
                        rows={3}
                        value={bidNotes}
                        onChange={(e) => setBidNotes(e.target.value)}
                        placeholder="Detail materials, fabric types, bulk discounts, custom size specs..."
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] font-semibold resize-none"
                      />
                    </div>

                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#5B3FD6] hover:bg-[#492eb3] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-100 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Quotation Bid'}
                  </button>

                </form>
              )}

              {/* Status info if already submitted/awarded/rejected */}
              {selectedRfq.status !== 'Pending' && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex gap-3 text-xs leading-relaxed text-gray-600">
                  <AlertCircle size={16} className="text-[#5B3FD6] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-800 uppercase tracking-wide text-[10px]">Quotation Status: {selectedRfq.status}</p>
                    {selectedRfq.vendorQuote ? (
                      <p className="mt-1 font-semibold">
                        You submitted a bidding rate of{' '}
                        <span className="text-gray-900 font-bold">
                          ₹{selectedRfq.vendorQuote.items?.[0]?.unitPrice || selectedRfq.vendorQuote.items?.[0]?.unitPricePaise / 100 || '—'}/unit
                        </span>
                        {selectedRfq.vendorQuote.deliveryTimeline
                          ? ` with ${selectedRfq.vendorQuote.deliveryTimeline} delivery terms.`
                          : '.'}
                        {' '}This request is closed for bidding.
                      </p>
                    ) : (
                      <p className="mt-1 font-semibold">This request is closed for bidding.</p>
                    )}
                  </div>
                </div>
              )}

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
                  {submitError}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default VendorQuotations;
