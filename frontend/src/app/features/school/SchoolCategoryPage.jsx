import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ChevronDown, Bell, User, Package,
  ArrowRight, Filter, Grid, Layout, Star, Building2
} from 'lucide-react';
import SchoolHeader from '../../components/SchoolHeader';
import ProductCard from '../../components/ProductCard';

const SchoolCategoryPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : { role: 'school' };
  });

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const mainCategories = [
    { name: "Bulk Uniforms", image: "/assets/uniforms.png", color: "from-blue-50/50 to-indigo-50/50" },
    { name: "Textbooks", image: "/assets/books.png", color: "from-orange-50/50 to-amber-50/50" },
    { name: "Office Supplies", image: "/assets/stationary.png", color: "from-purple-50/50 to-fuchsia-50/50" },
    { name: "Sports Gear", image: "/assets/toys_and_sports.png", color: "from-green-50/50 to-emerald-50/50" },
    { name: "Lab Equipment", image: "/assets/lab_and_science.png", color: "from-cyan-50/50 to-sky-50/50" },
    { name: "IT & Hardware", image: "/assets/technology.png", color: "from-indigo-50/50 to-blue-50/50" },
    { name: "Furniture", image: "/assets/furniture.png", color: "from-amber-50/50 to-yellow-50/50" },
    { name: "Janitorial", image: "/assets/transport.png", color: "from-rose-50/50 to-pink-50/50" },
    { name: "Infrastructure", image: "/assets/uniforms.png", color: "from-slate-50/50 to-gray-50/50" },
  ];

  const manageByGrade = [
    { grade: "Pre-Primary", range: "Institutional Supply", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&h=200&fit=crop" },
    { grade: "Primary", range: "Curriculum Kits", image: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=400&h=200&fit=crop" },
    { grade: "Secondary", range: "Exam Essentials", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&h=200&fit=crop" }
  ];

  const renderProductCard = (product) => (
    <ProductCard key={product.id} product={product} />
  );

  return (
    <>
      <SchoolHeader 
        scrolled={scrolled} 
        childInfo={schoolInfo} 
      />
      <div
        onScroll={handleScroll}
        className="flex flex-col h-full bg-white pb-32 overflow-y-auto font-outfit"
      >
        <div className="h-[185px] shrink-0"></div>

        {/* Institutional Categories Grid */}
        <div className="px-6 mt-4">
          <div className="grid grid-cols-3 gap-y-6">
            {mainCategories.map((cat) => (
              <Link
                key={cat.name}
                to={`/school/category/${cat.name.toLowerCase().replace(' ', '-')}`}
                className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all"
              >
                <div className={`w-24 h-24 bg-gradient-to-br ${cat.color} rounded-3xl p-3 border border-white shadow-sm group-hover:shadow-md transition-shadow relative overflow-hidden flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                  <img src={cat.image} alt={cat.name} className="w-16 h-16 object-contain mix-blend-multiply relative z-10 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <span className="mt-3 text-[10px] font-bold text-deep-purple uppercase tracking-wider text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Manage by Grade */}
        <div className="mt-12 px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-deep-purple -ml-1">Procurement by Grade</h2>
            <ArrowRight size={18} className="text-primary" />
          </div>

          <div className="space-y-4">
            {manageByGrade.map((item) => (
              <Link
                key={item.grade}
                to={`/school/grade?group=${encodeURIComponent(item.grade)}`}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm flex h-24 active:scale-[0.98] transition-all block"
              >
                <div className="w-32 h-full shrink-0">
                  <img src={item.image} alt={item.grade} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-center px-5">
                  <h3 className="text-base font-bold text-deep-purple">{item.grade}</h3>
                  <p className="text-xs text-gray-400 font-medium">{item.range}</p>
                </div>
                <div className="flex items-center pr-6">
                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-primary">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Highlights: Bulk Stationery */}
        <Link to="/school/category/office-supplies" className="mt-12 px-6 block group">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-deep-purple group-hover:text-primary transition-colors">Institutional Supplies</h2>
          </div>
          <div className="rounded-2xl h-36 overflow-hidden relative mb-4 shadow-md border border-gray-100 group-active:scale-[0.99] transition-all">
            <img src="/assets/category_banner3.png" className="w-full h-full object-cover" alt="Stationery" />
          </div>
        </Link>
        <div className="px-6 pb-20">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 301, name: "Bulk A4 Paper Reams", price: "₹2,150", image: "https://images.unsplash.com/photo-1585336139118-132f08535091?q=80&w=200&h=200&fit=crop" },
              { id: 302, name: "Classroom Board Markers", price: "₹850", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=200&h=200&fit=crop" },
            ].map((product) => renderProductCard(product))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SchoolCategoryPage;
