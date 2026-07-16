import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Filter, ChevronDown, Check, X,
  Store, Shirt, FileText, CheckCircle,
  Star, ChevronRight, UserPlus, Send, Mail, Phone, MapPin,
  Tag, Landmark, HelpCircle, ShieldCheck, Loader2
} from 'lucide-react';
import { listVendors } from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { useSchoolId } from '../../../utils/schoolContext';

const mapVendor = (v) => {
  const name = v.name || v.storeName || 'Vendor';
  const category = v.primaryCategory?.name || v.primaryCategory || '';
  return {
    id: v._id,
    name,
    storeName: v.storeName,
    avatar: `https://ui-avatars.com/api/?background=3b2d7d&color=fff&bold=true&name=${encodeURIComponent(name)}`,
    rating: v.rating ? Number(v.rating).toFixed(1) : '0.0',
    reviews: v.ordersCount || 0,
    location: v.location || '—',
    category,
    tag: category || 'Supplier',
    completedOrders: v.ordersCount || 0,
    pendingQuotes: 0,
    gstin: v.gstin || '—',
    specialities: category || 'General school supplies',
    contactPerson: v.name || '—',
    phone: v.phone || '—',
    email: v.email || '—',
    address: v.location || '—',
    verified: Boolean(v.verifiedBadge),
  };
};

const SchoolVendorsPage = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  // Tab category selection state
  const [activeCategory, setActiveCategory] = useState('All');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [quoteSuccessVendor, setQuoteSuccessVendor] = useState(null);

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  /**
   * Copies the vendor sign-up link. This previously claimed "Link copied to
   * clipboard!" from an alert() without copying anything — the clipboard API is
   * unavailable on insecure origins, so the fallback keeps the claim honest.
   */
  const handleInviteVendor = async () => {
    const inviteUrl = `${window.location.origin}/vendor/login?signup=1`;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(inviteUrl);
      showToast('Vendor sign-up link copied to clipboard');
    } catch {
      // Never claim a copy that did not happen — show the link so it can be copied by hand
      setError(`Copy failed. Share this link with the vendor: ${inviteUrl}`);
    }
  };

  const loadVendors = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await listVendors(schoolId, { limit: 100 });
      setVendors((data || []).map(mapVendor));
    } catch (err) {
      setVendors([]);
      setError(getErrorMessage(err, 'Unable to load vendors'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const totalCount = vendors.length;
  const uniformCount = vendors.filter((v) => v.category === 'Uniform').length;
  const pendingQuotesCount = vendors.reduce((sum, v) => sum + (v.pendingQuotes || 0), 0);
  const activeCount = vendors.length;

  // Filter vendor list
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.location.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'All' || v.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Action handlers
  const handleRequestQuote = (vendor) => {
    setQuoteSuccessVendor(vendor);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 font-outfit">

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 max-w-[90vw]">
          <span className="text-xs font-black truncate">{toast}</span>
        </div>
      )}

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
            <h1 className="text-xl font-black leading-tight">Vendors</h1>
            <span className="text-[11px] text-purple-200 font-bold block mt-0.5">
              Manage and view all vendors
            </span>
          </div>
        </div>
        
        {/* Outline Invite Vendor Button */}
        <button
          onClick={handleInviteVendor}
          className="px-4 py-2 border border-white/25 rounded-2xl text-[10px] font-black flex items-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all uppercase tracking-wider text-white shrink-0"
        >
          <UserPlus size={14} />
          Invite Vendor
        </button>
      </div>

      {/* Metric Cards Row Grid */}
      <div className="px-6 pt-6 overflow-x-auto scrollbar-none">
        <div className="flex sm:grid sm:grid-cols-4 gap-3 min-w-[550px] pb-1">
          
          {/* Card 1: Total Vendors */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-[#3b2d7d] flex items-center justify-center mx-auto shrink-0 border border-purple-100">
              <Store size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Total Vendors</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{totalCount}</span>
          </div>

          {/* Card 2: Uniform Vendors */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shrink-0 border border-emerald-100">
              <Shirt size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Uniform Vendors</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{uniformCount}</span>
          </div>

          {/* Card 3: Pending Quotes */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shrink-0 border border-orange-100">
              <FileText size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Pending Quotes</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{pendingQuotesCount}</span>
          </div>

          {/* Card 4: Active Vendors */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shrink-0 border border-blue-100">
              <CheckCircle size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Active Vendors</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{activeCount}</span>
          </div>

        </div>
      </div>

      {/* Search Input Filter Wrapper */}
      <div className="px-6 pt-6 space-y-4">
        
        {/* Search Bar */}
        <div className="relative flex items-center w-full">
          <Search size={16} className="absolute left-4.5 text-gray-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor by name, category, city..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors shadow-inner"
          />
        </div>

        {/* Category horizontal scroll pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {['All', 'Uniform', 'Books', 'Stationery', 'Sports', 'Lab Equipment'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-black shrink-0 transition-all active:scale-95 border ${
                activeCategory === cat
                  ? 'bg-[#3b2d7d] border-[#3b2d7d] text-white shadow-sm'
                  : 'bg-white border-gray-200 text-deep-purple hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Row count & Sort Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-400">
          Showing 1 – {filteredVendors.length} of {totalCount} vendors
        </span>
        
        {/* Sort Select options dropdown */}
        <div className="relative flex items-center gap-1.5 text-xs">
          <span className="text-gray-400 font-bold">Sort:</span>
          <select 
            className="bg-transparent border-none font-black text-deep-purple focus:outline-none cursor-pointer pr-5"
            defaultValue="Name (A - Z)"
          >
            <option value="Name (A - Z)">Name (A - Z)</option>
            <option value="Completed Orders">Orders Volume</option>
            <option value="Rating">Rating</option>
          </select>
          <ChevronDown size={12} className="absolute right-0 text-deep-purple pointer-events-none" />
        </div>
      </div>

      {/* Vendor Cards list exactly matching the mockup */}
      <div className="px-6 py-4 space-y-4">

        {loading && (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
            <Loader2 size={32} className="text-[#3b2d7d] mx-auto block animate-spin" />
            <span className="text-xs font-black text-gray-500 block mt-3">Loading vendors…</span>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
            <Store size={44} className="text-gray-300 mx-auto block stroke-[1.5]" />
            <span className="text-xs font-black text-rose-500 block mt-3">{error}</span>
          </div>
        )}

        {!loading && !error && vendors.length === 0 && (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
            <Store size={44} className="text-gray-300 mx-auto block stroke-[1.5]" />
            <span className="text-xs font-black text-gray-500 block mt-3">No vendors found</span>
            <span className="text-[10px] text-gray-400 font-bold block mt-1">No approved vendors are available for your school yet.</span>
          </div>
        )}
        
        {filteredVendors.map((vendor) => (
          <div 
            key={vendor.id}
            className="bg-white border border-gray-200/80 rounded-[2rem] p-5 shadow-sm space-y-4 relative overflow-hidden"
          >
            
            {/* Top header row inside card */}
            <div className="flex items-start justify-between gap-4">
              
              <div className="flex items-center gap-4 min-w-0">
                {/* Vendor logo */}
                <img 
                  src={vendor.avatar} 
                  alt={vendor.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-100 shadow-inner shrink-0"
                />
                
                {/* Info Detail stack */}
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-deep-purple leading-tight truncate">{vendor.name}</h3>
                  
                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-1">
                    <Star size={12} className="fill-amber-400 stroke-amber-500" />
                    <span>{vendor.rating}</span>
                    <span className="text-gray-400">({vendor.reviews})</span>
                  </div>

                  {/* Location Pin */}
                  <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 mt-0.5">
                    <MapPin size={11} className="text-gray-400 shrink-0" />
                    <span>{vendor.location}</span>
                  </div>

                  {/* Category supplier badge */}
                  <span className="inline-block mt-2 px-2.5 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    {vendor.tag}
                  </span>

                </div>
              </div>

              {/* Status & Verification Badges */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-[9px] font-black text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-0.5 uppercase">
                  <CheckCircle size={10} />
                  Verified
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-[9px] font-black text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-0.5 uppercase">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

            </div>

            {/* Split count grid info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-center">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">Completed Orders</span>
                <span className="text-base font-black text-purple-800 block mt-0.5">{vendor.completedOrders}</span>
              </div>
              <div className="border-l border-gray-150">
                <span className="text-[10px] text-gray-400 font-bold block">Pending Quotes</span>
                <span className="text-base font-black text-orange-600 block mt-0.5">{vendor.pendingQuotes}</span>
              </div>
            </div>

            {/* Actions Footer row inside card */}
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setSelectedVendor(vendor)}
                className="flex-1 py-3 px-4 border border-purple-200 hover:bg-purple-50 bg-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm text-[#3b2d7d] flex items-center justify-center gap-1"
              >
                View Profile
                <ChevronRight size={12} className="stroke-[2.5]" />
              </button>

              <button 
                onClick={() => navigate('/school/create-request')}
                className="flex-1 py-3 px-4 bg-[#3b2d7d] hover:bg-[#4b3db1] text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1"
              >
                Request Quote
                <ChevronRight size={12} className="stroke-[2.5]" />
              </button>
            </div>

          </div>
        ))}

      </div>

      {/* Quote request success modal overlay */}
      {quoteSuccessVendor && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-[2.2rem] p-6 shadow-2xl border border-gray-100 text-center animate-in zoom-in duration-200">
            
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100 shadow-inner">
              <Send size={24} className="stroke-[2.5]" />
            </div>

            <h3 className="text-base font-black text-deep-purple block mt-4 leading-tight">Quote Request Sent Successfully</h3>
            <p className="text-xs text-gray-400 font-bold block mt-2 px-1">
              Your digital uniform request has been successfully dispatched to <span className="text-[#3b2d7d] font-black">{quoteSuccessVendor.name}</span>. They will reply with custom quotation bids shortly.
            </p>

            <button 
              onClick={() => setQuoteSuccessVendor(null)}
              className="w-full mt-6 py-3.5 bg-[#3b2d7d] hover:bg-[#523da7] text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Vendor Profile Card Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[2.2rem] shadow-2xl border border-gray-150 overflow-hidden animate-in zoom-in duration-300 relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3b2d7d] to-[#5942bc] text-white px-6 py-5 relative flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase">Vendor Directory Card</h3>
                <span className="text-[10px] text-purple-200 font-bold block mt-0.5">Verified Institutional Supplier</span>
              </div>
              <button 
                onClick={() => setSelectedVendor(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10"
              >
                <X size={16} className="stroke-[3]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 scrollbar-none text-xs">
              
              {/* Profile Card Header */}
              <div className="flex items-center gap-5 bg-purple-50/40 p-4 rounded-3xl border border-purple-150/40">
                <img 
                  src={selectedVendor.avatar} 
                  alt={selectedVendor.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-base font-black text-deep-purple leading-tight truncate">{selectedVendor.name}</h4>
                  
                  {/* Rating row */}
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-1">
                    <Star size={12} className="fill-amber-400 stroke-amber-500" />
                    <span>{selectedVendor.rating}</span>
                    <span className="text-gray-400">({selectedVendor.reviews} reviews)</span>
                  </div>

                  <span className="text-[10px] text-gray-400 font-bold block mt-1">GSTIN: {selectedVendor.gstin}</span>
                </div>
              </div>

              {/* Specialities and Core Deliveries */}
              <div className="bg-purple-50/20 p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1.5">
                <h4 className="text-[9px] text-[#3b2d7d] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={12} />
                  Product Specialities
                </h4>
                <p className="text-deep-purple font-bold text-xs leading-relaxed">
                  {selectedVendor.specialities}
                </p>
              </div>

              {/* Bio Grid */}
              <div className="space-y-4">
                
                {/* Contact details */}
                <div className="bg-gray-50/50 p-4.5 rounded-2xl border border-gray-150 shadow-inner space-y-2">
                  <h4 className="text-[9px] text-gray-400 font-black uppercase tracking-wider block font-bold mb-1">Contact Information</h4>
                  
                  <div className="space-y-1 font-bold text-deep-purple">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                      <span>Contact Representative: <span className="text-gray-600 font-bold">{selectedVendor.contactPerson}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-gray-400 shrink-0" />
                      <span>Phone: <span className="text-gray-600 font-bold">{selectedVendor.phone}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-gray-400 shrink-0" />
                      <span>Email: <span className="text-gray-600 font-bold truncate">{selectedVendor.email}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span>Office Address: <span className="text-gray-600 font-bold">{selectedVendor.address}</span></span>
                    </div>
                  </div>
                </div>

                {/* Verification credentials details */}
                <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 flex items-start gap-3">
                  <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black text-emerald-800 uppercase block tracking-wider leading-none">Security Guaranteed</span>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1 leading-normal">
                      This vendor is fully compliant with all government procurements guidelines and holds direct partnership verification with SchoolE-mart.
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-5 flex items-center justify-end shrink-0">
              <button 
                onClick={() => setSelectedVendor(null)}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#3b2d7d] hover:bg-[#5942bc] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolVendorsPage;
