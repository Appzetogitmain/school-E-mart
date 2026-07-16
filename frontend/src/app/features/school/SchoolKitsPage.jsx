import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Filter, ChevronDown, Check, X,
  MoreVertical, Package, CheckCircle, AlertCircle, Plus,
  Users, Layers, Award, Tag, Sparkles, ShoppingBag, Eye, Loader2
} from 'lucide-react';
import { listKits } from '../../../services/schoolApi';
import { useSchoolId } from '../../../utils/schoolContext';
import { getErrorMessage } from '../../../utils/apiHelpers';

const mapKit = (k) => {
  const imageUrl = k.imageId?.storageKey || k.imageUrl || k.image?.url;
  const avatar = imageUrl ? imageUrl : `https://ui-avatars.com/api/?background=3b2d7d&color=fff&bold=true&name=${encodeURIComponent(k.name || 'Kit')}`;
  const itemsList = (k.items || []).map((item) => {
    const prod = item.productId || {};
    return {
      name: prod.name || 'Bulk Component',
      qty: item.qty || 1,
    };
  });
  return {
    id: k._id,
    name: k.name,
    desc: k.description || '',
    category: k.category || 'Others',
    tag: k.category || 'Kit',
    classes: k.classGrade || 'All classes',
    itemsCount: (k.items || []).length,
    itemsList,
    price: ((k.pricePaise || 0) / 100).toFixed(0),
    status: k.status === 'active' ? 'Active' : 'Draft',
    updatedDate: k.audit?.updatedAt
      ? new Date(k.audit.updatedAt).toLocaleDateString('en-GB')
      : '—',
    avatar,
  };
};

const SchoolKitsPage = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  // Tab category selection state
  const [activeCategory, setActiveCategory] = useState('All');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedKit, setSelectedKit] = useState(null);

  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadKits = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await listKits(schoolId, { limit: 100 });
      setKits((data || []).map(mapKit));
    } catch (err) {
      setKits([]);
      setError(getErrorMessage(err, 'Unable to load kits'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadKits();
  }, [loadKits]);

  const totalCount = kits.length;
  const activeCount = kits.filter((k) => k.status === 'Active').length;
  const draftCount = kits.filter((k) => k.status === 'Draft').length;
  const archivedCount = kits.filter((k) => k.status === 'Archived').length;

  // Filter kits list
  const filteredKits = kits.filter(k => {
    const matchesSearch = k.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          k.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          k.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'All' || k.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

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
            <h1 className="text-xl font-black leading-tight">Kits</h1>
            <span className="text-[11px] text-purple-200 font-bold block mt-0.5">
              View and manage all procurement kits
            </span>
          </div>
        </div>
        
        {/* Outline Create Kit Button */}
        <button 
          onClick={() => navigate('/school/create-kit')}
          className="px-4 py-2 border border-white/25 rounded-2xl text-[10px] font-black flex items-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all uppercase tracking-wider text-white shrink-0"
        >
          <Plus size={14} className="stroke-[3]" />
          Create Kit
        </button>
      </div>

      {/* Metric Cards Row Grid */}
      <div className="px-6 pt-6 overflow-x-auto scrollbar-none">
        <div className="flex sm:grid sm:grid-cols-4 gap-3 min-w-[550px] pb-1">
          
          {/* Card 1: Total Kits */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-[#3b2d7d] flex items-center justify-center mx-auto shrink-0 border border-purple-100">
              <Package size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Total Kits</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{totalCount}</span>
          </div>

          {/* Card 2: Active Kits */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shrink-0 border border-emerald-100">
              <CheckCircle size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Active Kits</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{activeCount}</span>
          </div>

          {/* Card 3: Draft Kits */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shrink-0 border border-orange-100">
              <AlertCircle size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Draft Kits</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{draftCount}</span>
          </div>

          {/* Card 4: Archived Kits */}
          <div className="flex-1 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shrink-0 border border-rose-100">
              <Layers size={15} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold block mt-2">Archived Kits</span>
            <span className="text-sm font-black text-deep-purple block mt-0.5">{archivedCount}</span>
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
            placeholder="Search kits by name or category..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors shadow-inner"
          />
        </div>

        {/* Category horizontal scroll pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {['All', 'Academic', 'Stationery', 'Uniform', 'Sports', 'Lab'].map((cat) => (
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
          <button 
            onClick={() => alert('Showing all remaining categories...')}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-black text-deep-purple flex items-center gap-1 hover:bg-gray-50 shrink-0"
          >
            More
            <ChevronDown size={12} />
          </button>
        </div>

      </div>

      {/* Row count & Sort Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-400">
          Showing 1 – {filteredKits.length} of {totalCount} kits
        </span>
        
        {/* Sort Select options dropdown */}
        <div className="relative flex items-center gap-1.5 text-xs">
          <span className="text-gray-400 font-bold">Sort:</span>
          <select 
            className="bg-transparent border-none font-black text-deep-purple focus:outline-none cursor-pointer pr-5"
            defaultValue="Updated"
          >
            <option value="Updated">Recently Updated</option>
            <option value="Price (Low - High)">Price (Low - High)</option>
            <option value="Price (High - Low)">Price (High - Low)</option>
          </select>
          <ChevronDown size={12} className="absolute right-0 text-deep-purple pointer-events-none" />
        </div>
      </div>

      {/* Kits Cards list exactly matching the mockup */}
      <div className="px-6 py-4 space-y-4">

        {loading && (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
            <Loader2 size={32} className="text-[#3b2d7d] mx-auto block animate-spin" />
            <span className="text-xs font-black text-gray-500 block mt-3">Loading kits…</span>
          </div>
        )}

        {!loading && kits.length === 0 && (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
            <Package size={44} className="text-gray-300 mx-auto block stroke-[1.5]" />
            <span className="text-xs font-black text-gray-500 block mt-3">
              {error ? 'Unable to load kits' : 'No procurement kits yet'}
            </span>
            <span className="text-[10px] text-gray-400 font-bold block mt-1">
              {error || 'Create your first kit from the Create Kit page.'}
            </span>
          </div>
        )}
        
        {filteredKits.map((kit) => (
          <div 
            key={kit.id}
            onClick={() => setSelectedKit(kit)}
            className="bg-white border border-gray-200/80 rounded-[2rem] p-5 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden cursor-pointer hover:border-purple-200 hover:shadow-md transition-all active:scale-[0.99]"
          >
            
            <div className="flex items-center gap-4 min-w-0">
              {/* Kit Avatar/Image */}
              <img 
                src={kit.avatar} 
                alt={kit.name}
                className="w-16 h-16 rounded-[1.2rem] object-cover border border-purple-100 shadow-inner shrink-0"
              />
              
              {/* Info Detail stack */}
              <div className="min-w-0">
                <h3 className="text-sm font-black text-deep-purple leading-tight truncate">{kit.name}</h3>
                
                {/* Category tag badge */}
                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                  <Tag size={9} />
                  {kit.tag}
                </span>

                {/* Subtitle desc */}
                <p className="text-[10px] text-gray-400 font-bold mt-1.5 leading-tight truncate max-w-[200px]">
                  {kit.desc}
                </p>

                {/* Classes & items count splits */}
                <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-gray-400">
                  <div className="flex items-center gap-0.5">
                    <Users size={11} className="text-[#3b2d7d]" />
                    <span>{kit.classes}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-0.5">
                    <Package size={11} className="text-[#3b2d7d]" />
                    <span>{kit.itemsCount} Items</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Pricing, Status & Actions container */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              
              {/* Status Badge */}
              {kit.status === 'Active' ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-[9px] font-black text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-0.5 uppercase">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-orange-50 text-[9px] font-black text-orange-600 rounded-full border border-orange-100 flex items-center gap-0.5 uppercase">
                  <span className="w-1 h-1 rounded-full bg-orange-500" />
                  Draft
                </span>
              )}

              {/* Pricing Display */}
              <span className="text-base font-black text-purple-800 tracking-tight leading-none mt-1">
                ₹{kit.price}
              </span>

              {/* Updated footer */}
              <span className="text-[9px] text-gray-400 font-bold block mt-1">
                {kit.updatedDate}
              </span>

            </div>

            {/* Three dot context settings */}
            <button 
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-400 active:scale-90 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                alert(`Context settings for ${kit.name}`);
              }}
            >
              <MoreVertical size={16} />
            </button>

          </div>
        ))}

      </div>

      {/* Kit Detailed Item breakdown Modal */}
      {selectedKit && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[2.2rem] shadow-2xl border border-gray-150 overflow-hidden animate-in zoom-in duration-300 relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3b2d7d] to-[#5942bc] text-white px-6 py-5 relative flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase">{selectedKit.name}</h3>
                <span className="text-[10px] text-purple-200 font-bold block mt-0.5">Procurement Kit Contents</span>
              </div>
              <button 
                onClick={() => setSelectedKit(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10"
              >
                <X size={16} className="stroke-[3]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 scrollbar-none text-xs">
              
              {/* Cover card header */}
              <div className="flex items-center gap-4 bg-purple-50/40 p-4 rounded-3xl border border-purple-150/40">
                <img 
                  src={selectedKit.avatar} 
                  alt={selectedKit.name}
                  className="w-16 h-16 rounded-[1.2rem] object-cover border border-purple-100 shrink-0"
                />
                <div>
                  <h4 className="text-sm font-black text-deep-purple leading-tight">{selectedKit.name}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-gray-400 font-bold">Standard price:</span>
                    <span className="text-sm font-black text-[#3b2d7d]">₹{selectedKit.price}</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-black uppercase mt-1 block">✓ Procurement Ready</span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-[9px] text-[#3b2d7d] font-black uppercase tracking-wider flex items-center gap-1.5 pl-1">
                  <Layers size={13} />
                  Included Items Breakdown ({selectedKit.itemsList.length})
                </h4>

                <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-inner bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-4 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold text-deep-purple">
                      {selectedKit.itemsList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-purple-50/20 transition-all">
                          <td className="py-3.5 px-4 text-xs font-black">{item.name}</td>
                          <td className="py-3.5 px-4 text-right text-xs text-[#3b2d7d] font-black">{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Quick instructions details */}
              <div className="bg-purple-50/20 p-4.5 rounded-2xl border border-purple-100 flex items-start gap-3 shadow-sm">
                <Sparkles size={16} className="text-[#3b2d7d] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-black text-deep-purple uppercase tracking-wider block">Customization Tip</span>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 leading-normal">
                    This kit can be ordered as-is in bulk bundles or customized for individual class sections inside the Procurement request forms wizard.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-5 flex items-center justify-end shrink-0">
              <button 
                onClick={() => setSelectedKit(null)}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#3b2d7d] hover:bg-[#5942bc] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md"
              >
                Close breakdown
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolKitsPage;
