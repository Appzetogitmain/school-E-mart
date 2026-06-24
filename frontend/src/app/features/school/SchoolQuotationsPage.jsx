import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Filter, ChevronRight, Calendar, Users, 
  FileText, Clipboard, CheckCircle, Clock, Check, X,
  Plus, AlertCircle, Shirt, BookOpen, FlaskConical, Snowflake,
  Building, Star, ShieldCheck, HelpCircle, MessageSquare
} from 'lucide-react';

const SchoolQuotationsPage = () => {
  const navigate = useNavigate();

  // Tab filter selection state
  const [activeTab, setActiveTab] = useState('All');
  
  // Modal states
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState(null);

  const requirements = [];

  const pendingQuotesCount = requirements.filter((r) => r.status === 'Pending').length;
  const receivedQuotesCount = requirements.filter((r) => r.status === 'Received').length;
  const awardedContractsCount = requirements.filter((r) => r.status === 'Awarded').length;
  const expiredCount = requirements.filter((r) => r.status === 'Expired').length;

  // Filter requirements list
  const filteredRequirements = requirements.filter(req => {
    if (activeTab === 'All') return true;
    return req.status === activeTab;
  });

  const handleAwardContract = (vendorName, reqTitle) => {
    setQuoteSuccessMsg(`Contract for ${reqTitle} awarded to ${vendorName} successfully!`);
    setSelectedRequirement(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 font-outfit">
      
      {/* Top Sticky Header */}
      <div className="bg-[#3b2d7d] text-white px-6 py-6 sticky top-0 z-50 rounded-b-[2rem] shadow-lg flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/school/more')}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-black leading-tight">Quotations</h1>
            <span className="text-[11px] text-purple-200 font-bold block mt-0.5">
              Track and compare vendor quotations
            </span>
          </div>
        </div>


      </div>

      {/* Metric Cards Row Grid */}
      <div className="px-6 pt-6 overflow-x-auto scrollbar-none">
        <div className="flex sm:grid sm:grid-cols-4 gap-3 min-w-[550px] pb-1">
          
          {/* Card 1: Pending Quotes */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-[#3b2d7d] flex items-center justify-center mx-auto shrink-0 border border-purple-100">
              <Clock size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Pending Quotes</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{pendingQuotesCount}</span>
          </div>

          {/* Card 2: Received Quotes */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shrink-0 border border-emerald-100">
              <FileText size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Received Quotes</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{receivedQuotesCount}</span>
          </div>

          {/* Card 3: Awarded Contracts */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shrink-0 border border-blue-100">
              <CheckCircle size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Awarded Contracts</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{awardedContractsCount}</span>
          </div>

          {/* Card 4: Expired */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shrink-0 border border-rose-100">
              <AlertCircle size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Expired</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{expiredCount}</span>
          </div>

        </div>
      </div>

      {/* Tabs Filter pills */}
      <div className="px-6 pt-6 flex items-center gap-2 overflow-x-auto scrollbar-none py-1 shrink-0">
        {['All', 'Pending', 'Received', 'Awarded', 'Expired'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-full text-xs font-black shrink-0 transition-all active:scale-95 border ${
              activeTab === tab
                ? 'bg-[#3b2d7d] border-[#3b2d7d] text-white shadow-sm'
                : 'bg-white border-gray-200 text-deep-purple hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Requirement Cards List */}
      <div className="px-6 py-5 space-y-4">
        {requirements.length === 0 && (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
            <FileText size={44} className="text-gray-300 mx-auto block stroke-[1.5]" />
            <span className="text-xs font-black text-gray-500 block mt-3">No quotation requirements yet</span>
            <span className="text-[10px] text-gray-400 font-bold block mt-1">RFQ quotations API is not available yet.</span>
          </div>
        )}

        {filteredRequirements.map((req) => (
          <div 
            key={req.id}
            className="bg-white border border-gray-200/85 rounded-[2rem] p-5 shadow-sm space-y-4 relative overflow-hidden"
          >
            
            {/* Header info row inside requirement card */}
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${req.iconBg} flex items-center justify-center shrink-0`}>
                {req.icon}
              </div>
              <div className="min-w-0 pr-4">
                <h3 className="text-xs font-black text-deep-purple leading-tight block hover:text-[#3b2d7d] cursor-pointer">
                  {req.title}
                </h3>
                
                {/* Status Pill */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full border text-[9px] font-black uppercase tracking-wider ${req.badgeColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${req.dotColor}`} />
                  {req.badgeText}
                </span>

              </div>

              {/* Chevron Link right */}
              <ChevronRight size={16} className="text-gray-400 absolute top-5 right-5 pointer-events-none" />
            </div>

            {/* Split Info parameters grid */}
            <div className="grid grid-cols-3 gap-3 bg-gray-50/50 p-4.5 rounded-2xl border border-gray-100 text-center text-[10px] font-bold text-gray-400">
              
              {/* Column 1: Deadline */}
              <div>
                <Calendar size={13} className="text-[#3b2d7d] mx-auto mb-1" />
                <span>Deadline</span>
                <span className="block mt-0.5 font-black text-deep-purple">{req.deadline}</span>
              </div>

              {/* Column 2: Vendors Invited */}
              <div className="border-l border-r border-gray-150">
                <Users size={13} className="text-[#3b2d7d] mx-auto mb-1" />
                <span>Vendors Invited</span>
                <span className="block mt-0.5 font-black text-deep-purple">{req.vendorsInvited}</span>
              </div>

              {/* Column 3: Quotes Received */}
              <div>
                <FileText size={13} className="text-[#3b2d7d] mx-auto mb-1" />
                <span>Quotes Received</span>
                <span className="block mt-0.5 font-black text-deep-purple">{req.quotesReceived}</span>
              </div>

            </div>

            {/* Card Footer actions */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-gray-400 font-bold">Created: {req.createdDate}</span>
              
              {req.quotesReceived > 0 ? (
                <button 
                  onClick={() => setSelectedRequirement(req)}
                  className="px-4 py-2 border border-purple-250 text-[#3b2d7d] hover:bg-purple-50 bg-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                >
                  Compare Quotes
                </button>
              ) : (
                <button 
                  disabled
                  className="px-4 py-2 border border-gray-200 text-gray-400 bg-gray-50 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-not-allowed"
                >
                  Awaiting Bids
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Bottom Sticky Action Panel exactly as mockup */}
      <div className="bg-white border-t border-gray-150 p-5 mt-auto flex items-center justify-between shadow-2xl relative shrink-0">
        <div className="flex items-start gap-3 min-w-0 pr-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100 text-[#3b2d7d]">
            <Clipboard size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black text-deep-purple leading-tight">Create New Request</h4>
            <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
              Create a new requirement and invite vendors to quote
            </span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/school/create-request')}
          className="px-5 py-3.5 bg-[#3b2d7d] hover:bg-[#4d3db9] text-white font-black rounded-2xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-md shrink-0"
        >
          <Plus size={14} className="stroke-[3]" />
          New Request
        </button>
      </div>

      {/* Contract Award success toast modal overlay */}
      {quoteSuccessMsg && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-[2.2rem] p-6 shadow-2xl border border-gray-100 text-center animate-in zoom-in duration-200">
            
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100 shadow-inner">
              <CheckCircle size={24} className="stroke-[2.5]" />
            </div>

            <h3 className="text-base font-black text-deep-purple block mt-4 leading-tight">Contract Awarded</h3>
            <p className="text-xs text-gray-400 font-bold block mt-2 px-1">
              {quoteSuccessMsg} Purchase orders and service-level contract notifications have been triggered automatically.
            </p>

            <button 
              onClick={() => setQuoteSuccessMsg(null)}
              className="w-full mt-6 py-3.5 bg-[#3b2d7d] hover:bg-[#523da7] text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Quotation Comparison Side-by-Side Table Modal */}
      {selectedRequirement && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-[2.2rem] shadow-2xl border border-gray-150 overflow-hidden animate-in zoom-in duration-300 relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3b2d7d] to-[#5942bc] text-white px-6 py-5 relative flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase truncate max-w-[280px]">Compare Quotations</h3>
                <span className="text-[10px] text-purple-200 font-bold block mt-0.5 truncate">{selectedRequirement.title}</span>
              </div>
              <button 
                onClick={() => setSelectedRequirement(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10"
              >
                <X size={16} className="stroke-[3]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 scrollbar-none text-xs">
              
              {/* Splendid comparison list */}
              <div className="space-y-4">
                {selectedRequirement.quotes.map((quote, idx) => (
                  <div 
                    key={idx}
                    className="border border-purple-100 rounded-3xl p-5 bg-purple-50/20 hover:bg-purple-50/45 transition-all shadow-sm space-y-3.5 relative overflow-hidden"
                  >
                    {/* Rank Badge */}
                    <div className="absolute top-0 right-0 px-3 py-1 bg-purple-100 text-[#3b2d7d] text-[9px] font-black uppercase rounded-bl-2xl">
                      Bid #{idx + 1}
                    </div>

                    {/* Vendor title and rating */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-purple-100 flex items-center justify-center shrink-0 font-black text-deep-purple">
                        {quote.vendorName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-deep-purple leading-tight">{quote.vendorName}</h4>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 mt-0.5">
                          <Star size={11} className="fill-amber-400 stroke-amber-500" />
                          <span>{quote.rating} Rating</span>
                        </div>
                      </div>
                    </div>

                    {/* Splendid parameters comparison list details */}
                    <div className="grid grid-cols-3 gap-2 bg-white/70 p-3 rounded-2xl border border-purple-100/40 text-[10px] font-bold text-gray-400">
                      <div>
                        <span>Price Per Unit</span>
                        <span className="block mt-0.5 font-black text-deep-purple text-xs">{quote.pricePerUnit}</span>
                      </div>
                      <div className="border-l border-r border-purple-100/30 px-2">
                        <span>Total Bid</span>
                        <span className="block mt-0.5 font-black text-[#3b2d7d] text-xs">{quote.totalAmount}</span>
                      </div>
                      <div>
                        <span>Delivery</span>
                        <span className="block mt-0.5 font-black text-deep-purple text-xs">{quote.deliveryDays}</span>
                      </div>
                    </div>

                    <div className="space-y-1 font-bold text-gray-400">
                      <span className="text-[9px] uppercase tracking-wider block">Material Specifications:</span>
                      <p className="text-deep-purple text-xs leading-relaxed font-bold bg-white/40 p-2.5 rounded-xl border border-gray-150/40">
                        {quote.material}
                      </p>
                    </div>

                    <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 bg-orange-50/30 p-2.5 rounded-xl border border-orange-100/30">
                      <MessageSquare size={11} className="text-orange-500 shrink-0" />
                      <span>Remarks: <span className="text-deep-purple font-bold">{quote.remarks}</span></span>
                    </div>

                    {/* Award Contract Button inside bid card */}
                    <button 
                      onClick={() => handleAwardContract(quote.vendorName, selectedRequirement.title)}
                      className="w-full py-3 bg-[#3b2d7d] hover:bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Check size={13} className="stroke-[3]" />
                      Award Contract
                    </button>

                  </div>
                ))}
              </div>

            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-5 flex items-center justify-end shrink-0">
              <button 
                onClick={() => setSelectedRequirement(null)}
                className="w-full sm:w-auto px-6 py-3.5 bg-gray-400 hover:bg-gray-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolQuotationsPage;
