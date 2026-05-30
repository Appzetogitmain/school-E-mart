import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, ShoppingCart, 
  Star, ChevronDown, Package, Sparkles,
  ShoppingBag, Building2
} from 'lucide-react';
import ProductCard from '../../components/ProductCard';

const SchoolProductsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const grade = searchParams.get('grade') || 'Bulk Orders';
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Recommended');

  const categories = ['All', 'Bulk Uniforms', 'Textbooks', 'Office Supplies', 'Lab Equipment', 'Sports Gear'];

  const products = [
    { id: 1, name: "Premium Cotton School Shirt (Bulk 50pk)", price: 24500, originalPrice: 32000, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=300&h=400&fit=crop", category: "Bulk Uniforms", rating: 4.8, reviews: 124 },
    { id: 2, name: "Oxford English Grammar - Class 2 (Set of 100)", price: 42000, originalPrice: 55000, image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300&h=400&fit=crop", category: "Textbooks", rating: 4.9, reviews: 89 },
    { id: 3, name: "Institutional Waterproof Bags (Bulk 25pk)", price: 28500, originalPrice: 35000, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=300&h=400&fit=crop", category: "Bags", rating: 4.7, reviews: 256 },
    { id: 4, name: "Bulk A4 Paper Reams (50 Boxes)", price: 12500, originalPrice: 15000, image: "https://images.unsplash.com/photo-1585336139118-132f08535091?q=80&w=300&h=400&fit=crop", category: "Office Supplies", rating: 4.6, reviews: 142 },
  ];

  const filteredProducts = products
    .filter(p => 
      (activeCategory === 'All' || p.category === activeCategory) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-outfit">
      <div className="bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] pt-8 pb-6 px-6 rounded-b-[2.5rem] shadow-xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/school/admin')} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <ArrowLeft size={20} />
            </button>
            <div onClick={() => navigate('/school/grade')} className="flex flex-col cursor-pointer group">
              <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                Bulk Orders <ChevronDown size={10} className="group-hover:translate-y-0.5" />
              </div>
              <h1 className="text-xl font-bold text-white leading-none">{grade}</h1>
            </div>
          </div>
          <button onClick={() => navigate('/school/cart')} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white relative">
            <ShoppingBag size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full border-2 border-deep-purple"></span>
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
          <input
            type="text"
            placeholder={`Search items...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 bg-white rounded-2xl text-sm shadow-inner outline-none font-medium"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === cat ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-6 mt-6">
        {activeCategory === 'All' && !searchQuery && (
          <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-[#ffc107] to-[#ffb300] rounded-3xl p-6 shadow-xl shadow-yellow-100/50 block">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div className="max-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-deep-purple" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-deep-purple/60">Popular Item</span>
                </div>
                <h2 className="text-xl font-black text-deep-purple leading-tight mb-2">{grade} Kit</h2>
                <p className="text-deep-purple/70 text-[11px] font-bold leading-relaxed mb-4">Perfect for institutional batch orders.</p>
                <button className="px-5 py-2 bg-deep-purple text-white rounded-xl text-[10px] font-bold shadow-lg">
                  Order Now
                </button>
              </div>
              <div className="w-24 h-24 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/40">
                <Building2 size={48} className="text-deep-purple" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-deep-purple -ml-1">Bulk Products ({filteredProducts.length})</h2>
          <button className="text-[10px] font-black text-primary uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-gray-100">{sortBy}</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchoolProductsPage;
