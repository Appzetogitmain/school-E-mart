import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, ShoppingBag, Star, 
  ChevronRight, Filter
} from 'lucide-react';

const SubcategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [activeSub, setActiveSub] = useState('All');

  // Mock Data for Subcategories (Uniforms Example)
  const subcategories = [
    { id: 'all', name: 'All', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=100&h=100&fit=crop' },
    { id: 'shirts', name: 'Shirts', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=100&h=100&fit=crop' },
    { id: 'trousers', name: 'Trousers', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=100&h=100&fit=crop' },
    { id: 'blazers', name: 'Blazers', image: 'https://images.unsplash.com/photo-1591336373305-5850a990a5a0?q=80&w=100&h=100&fit=crop' },
    { id: 'sweaters', name: 'Sweaters', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=100&h=100&fit=crop' },
    { id: 'shoes', name: 'Shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=100&h=100&fit=crop' },
    { id: 'socks', name: 'Socks', image: 'https://images.unsplash.com/photo-1582966271819-755813ec3b90?q=80&w=100&h=100&fit=crop' },
  ];

  const products = [
    { id: 1, name: "Summer Polo Shirt", price: "₹350", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=200&h=200&fit=crop" },
    { id: 2, name: "Daily Cotton Trousers", price: "₹550", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=200&h=200&fit=crop" },
    { id: 3, name: "White Sports Uniform", price: "₹450", image: "https://images.unsplash.com/photo-1591336373305-5850a990a5a0?q=80&w=200&h=200&fit=crop" },
    { id: 4, name: "Cotton School Socks", price: "₹120", image: "https://images.unsplash.com/photo-1582966271819-755813ec3b90?q=80&w=200&h=200&fit=crop" },
    { id: 5, name: "Oxford School Blazer", price: "₹1250", image: "https://images.unsplash.com/photo-1591336373305-5850a990a5a0?q=80&w=200&h=200&fit=crop" },
    { id: 6, name: "V-Neck Sweater", price: "₹850", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=200&h=200&fit=crop" }
  ];

  const renderProductCard = (product) => (
    <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden group active:scale-[0.98] transition-all">
      <div className="relative aspect-square bg-white p-2">
        <div className="absolute top-0 left-0 bg-[#ef4444] text-white text-[9px] font-bold px-2 py-1 rounded-br-lg z-10">
          SAVE ₹{Math.floor(Math.random() * 500 + 100)}
        </div>
        <button className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors z-10">
          <Star size={16} />
        </button>
        <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="p-2.5 flex flex-col flex-1">
        <h3 className="text-[11px] font-bold text-deep-purple leading-snug line-clamp-2 h-8 mb-1 uppercase tracking-tight">
          {product.name}
        </h3>
        <p className="text-[9px] text-gray-400 font-medium mb-2 truncate">Premium Cotton Blend</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] text-gray-400 line-through">₹{parseInt(product.price.replace('₹', '')) + 200}</span>
          <span className="text-[12px] font-bold text-black">{product.price}</span>
        </div>
        <button className="w-full py-2 bg-[#ffc107] text-black rounded-lg text-[10px] font-bold shadow-md shadow-yellow-100 active:scale-95 transition-all flex items-center justify-center gap-1">
          <ShoppingBag size={12} />
          ADD
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white font-outfit">
      {/* 1. Sticky Top Header */}
      <div className="bg-white px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-50 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple active:scale-90 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-deep-purple capitalize">{categoryId || 'Uniforms'}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">124 Items found</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all">
            <Search size={20} />
          </button>
          <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all relative">
            <ShoppingBag size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Left Sidebar (Subcategories) */}
        <div className="w-20 bg-gray-50/50 border-r border-gray-100 overflow-y-auto scrollbar-hide py-4">
          <div className="flex flex-col items-center gap-6">
            {subcategories.map((sub) => (
              <button 
                key={sub.id} 
                onClick={() => setActiveSub(sub.name)}
                className="flex flex-col items-center gap-2 group w-full px-1"
              >
                <div className={`w-14 h-14 rounded-full border-2 p-1 transition-all duration-300 relative ${activeSub === sub.name ? 'border-primary bg-white shadow-md' : 'border-transparent bg-white/50'}`}>
                  <img src={sub.image} alt={sub.name} className="w-full h-full object-cover rounded-full mix-blend-multiply" />
                  {activeSub === sub.name && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full"></div>
                  )}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-tighter text-center leading-tight transition-colors ${activeSub === sub.name ? 'text-primary' : 'text-gray-400'}`}>
                  {sub.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Main Content (Product Grid) */}
        <div className="flex-1 overflow-y-auto bg-white px-4 pt-4 pb-24">
          {/* Promo Banner */}
          <div className="bg-amber-50 rounded-3xl p-6 mb-6 relative overflow-hidden h-36 flex flex-col justify-center">
            <div className="relative z-10 max-w-[60%]">
              <h2 className="text-deep-purple text-lg font-bold leading-tight mb-2">Everything for School Uniforms</h2>
              <button className="bg-black text-white text-[10px] font-bold px-4 py-2 rounded-full active:scale-95 transition-all">
                ORDER NOW
              </button>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400&h=300&fit=crop" 
              className="absolute right-0 top-0 h-full w-[45%] object-cover mix-blend-multiply opacity-80" 
              alt="Promo"
            />
            <div className="absolute top-2 left-2 bg-[#ffc107] text-black text-[8px] font-black px-2 py-1 rounded-lg">
              30% OFF
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-deep-purple uppercase tracking-wider">{activeSub} Products</h2>
            <button className="flex items-center gap-1.5 text-primary text-[11px] font-bold bg-primary/10 px-3 py-1.5 rounded-full">
              <Filter size={14} />
              FILTER
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => renderProductCard(product))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubcategoryPage;
