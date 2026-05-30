import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, ChevronDown, Check, X, 
  MoreVertical, Package, CheckCircle, AlertCircle, Plus,
  Users, Layers, Award, Tag, Sparkles, ShoppingBag, Eye
} from 'lucide-react';

const SchoolKitsPage = () => {
  const navigate = useNavigate();

  // Tab category selection state
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [selectedKit, setSelectedKit] = useState(null);

  // Mock Procurement Kits data exactly matching the mockup specifications
  const [kits, setKits] = useState([
    {
      id: 'KIT-2026-001',
      name: 'Class 1 Starter Kit',
      category: 'Academic',
      tag: 'Academic Kit',
      desc: '5 Notebooks, 2 Pencils, Eraser, Sharpener & more',
      classes: 'Classes 1 - 3',
      itemsCount: 6,
      status: 'Active',
      price: 599,
      updatedDate: '12 May 2024',
      avatar: 'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?w=150',
      itemsList: [
        { name: 'Double Line Notebooks (120 Pages)', qty: '5' },
        { name: 'HB Black Pencils', qty: '2' },
        { name: 'Non-Dust Eraser', qty: '1' },
        { name: 'Dual Sharpener', qty: '1' },
        { name: 'Plastic Scale (15 cm)', qty: '1' },
        { name: 'Drawing Book (A4)', qty: '1' }
      ]
    },
    {
      id: 'KIT-2026-002',
      name: 'Art & Craft Kit',
      category: 'Stationery',
      tag: 'Art & Craft Kit',
      desc: 'Crayons, Drawing Book, Color Paper, Glue, Scissors & more',
      classes: 'Classes 1 - 5',
      itemsCount: 8,
      status: 'Active',
      price: 399,
      updatedDate: '10 May 2024',
      avatar: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=150',
      itemsList: [
        { name: 'Jumbo Wax Crayons (12 shades)', qty: '1 pack' },
        { name: 'Drawing Book (A4)', qty: '1' },
        { name: 'Multi-Color Origami Sheets', qty: '1 pack' },
        { name: 'Craft Glue Stick (15g)', qty: '1' },
        { name: 'Safety Scissors (Rounded)', qty: '1' },
        { name: 'Poster Colors (6 basic shades)', qty: '1 box' },
        { name: 'Synthetic Paintbrush Set', qty: '1 pack' },
        { name: 'Glitter Foam Sheets', qty: '5 sheets' }
      ]
    },
    {
      id: 'KIT-2026-003',
      name: 'Science Lab Kit',
      category: 'Lab',
      tag: 'Lab Kit',
      desc: 'Lab Manual, Safety Goggles, Measuring Tools, Test Tubes & more',
      classes: 'Classes 6 - 10',
      itemsCount: 12,
      status: 'Active',
      price: 999,
      updatedDate: '08 May 2024',
      avatar: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=150',
      itemsList: [
        { name: 'Comprehensive Science Lab Manual', qty: '1' },
        { name: 'Polycarbonate Safety Goggles', qty: '1' },
        { name: 'Graduated Cylinder (100ml)', qty: '1' },
        { name: 'Borosilicate Glass Test Tubes', qty: '5' },
        { name: 'Test Tube Holder & Stand', qty: '1 set' },
        { name: 'Litmus Paper Strips (Red/Blue)', qty: '1 box' },
        { name: 'Handheld Magnifying Glass (50mm)', qty: '1' },
        { name: 'Bar Magnet Pair', qty: '1 pack' },
        { name: 'Simple Pendulum Bob & Thread', qty: '1 set' },
        { name: 'Lab Safety Apron', qty: '1' },
        { name: 'Digital Stop Watch', qty: '1' },
        { name: 'Tuning Fork set', qty: '1 set' }
      ]
    },
    {
      id: 'KIT-2026-004',
      name: 'Sports Kit',
      category: 'Sports',
      tag: 'Sports Kit',
      desc: 'Jersey, Shorts, Socks, Water Bottle & more',
      classes: 'All Classes',
      itemsCount: 5,
      status: 'Active',
      price: 799,
      updatedDate: '07 May 2024',
      avatar: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=150',
      itemsList: [
        { name: 'Breathable Sports Mesh Jersey', qty: '1' },
        { name: 'Athletic Shorts with drawstring', qty: '1' },
        { name: 'Ribbed Sports Knee Socks', qty: '1 pair' },
        { name: 'Stainless Steel Water Bottle (750ml)', qty: '1' },
        { name: 'School Sports Gym Bag', qty: '1' }
      ]
    },
    {
      id: 'KIT-2026-005',
      name: 'Grade 6 Academic Kit',
      category: 'Academic',
      tag: 'Academic Kit',
      desc: '8 Notebooks, Geometry Box, Pens, Pencils & more',
      classes: 'Classes 6 - 8',
      itemsCount: 9,
      status: 'Draft',
      price: 899,
      updatedDate: '05 May 2024',
      avatar: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=150',
      itemsList: [
        { name: 'Single Line Classwork Notebooks', qty: '8' },
        { name: 'Mathematical Geometry Box', qty: '1' },
        { name: 'Retractable Ballpoint Blue Pens', qty: '3' },
        { name: 'HB Wooden Writing Pencils', qty: '5' },
        { name: 'Neon Text Highlighters', qty: '2' },
        { name: 'Writing Pad board', qty: '1' },
        { name: 'Weekly Academic Student Planner', qty: '1' },
        { name: 'Non-Dust Erasers', qty: '2' },
        { name: 'Long Steel Ruler (30 cm)', qty: '1' }
      ]
    },
    {
      id: 'KIT-2026-006',
      name: 'Pre-School Kit',
      category: 'Academic',
      tag: 'Preschool Kit',
      desc: 'Activity Book, Crayons, Water Bottle, Lunch Box & more',
      classes: 'Pre-Nur - UKG',
      itemsCount: 7,
      status: 'Active',
      price: 549,
      updatedDate: '01 May 2024',
      avatar: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=150',
      itemsList: [
        { name: 'Pictorial Alphabet & Number Activity Book', qty: '1' },
        { name: 'Jumbo Wax Crayons (8 shades)', qty: '1 pack' },
        { name: 'BPA-Free Kids Sipper Bottle', qty: '1' },
        { name: 'Insulated School Lunch Box', qty: '1' },
        { name: 'Pre-school Cartoon Mini Backpack', qty: '1' },
        { name: 'Alphabet Flash Cards', qty: '1 set' },
        { name: 'Plastic Modeling Clay (non-toxic)', qty: '1 pack' }
      ]
    }
  ]);

  // Statistics summaries based on mockup baselines
  const totalCount = 24;
  const activeCount = 18;
  const draftCount = 4;
  const archivedCount = 2;

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
