import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, Search, ShoppingBag, User,
  ChevronDown, Bell, Sparkles, Package,
  Shirt, Book, PenTool, Footprints,
  ArrowRight, Star, ShoppingCart, Filter, Play,
  Grid, Layout, Building2, Users, ClipboardList
} from 'lucide-react';
import SchoolHeader from '../../components/SchoolHeader';
import SchoolSideMenu from '../../components/SchoolSideMenu';
import ProductCard from '../../components/ProductCard';
import SectionHeader from '../../components/SectionHeader';
import CategoryStory from '../../components/CategoryStory';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import AuthPrompt from '../../components/AuthPrompt';

const SchoolHome = () => {
  const navigate = useNavigate();
  const notifRef = useDraggableScroll();
  const kitsRef = useDraggableScroll();
  const catsRef = useDraggableScroll();
  const bannerRef = useDraggableScroll();
  const reelsRef = useDraggableScroll();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    const parsed = saved ? JSON.parse(saved) : null;
    return (parsed && parsed.role === 'school') ? parsed : {
      name: "School Admin",
      school: "School Management",
      role: "school",
      phone: ""
    };
  });

  const isGuest = !localStorage.getItem('childInfo');

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('childInfo');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'school') setSchoolInfo(parsed);
      }
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const bulkPackages = [
    {
      id: 1,
      name: "Standardized Class 2 Kit",
      price: "₹3,850",
      originalPrice: "₹5,200",
      image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=300&h=400&fit=crop",
      badge: "Institutional Rate"
    },
    {
      id: 2,
      name: "Faculty Winter Uniforms",
      price: "₹12,450",
      originalPrice: "₹15,000",
      image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=300&h=400&fit=crop",
      badge: "Staff Exclusive"
    }
  ];

  const categories = [
    { name: "Bulk Uniforms", image: "/assets/uniforms.png" },
    { name: "Lab Supplies", image: "/assets/books.png" },
    { name: "Office Stationery", image: "/assets/stationary.png" },
    { name: "Sports Gear", image: "/assets/toys_and_sports.png" },
    { name: "IT Hardware", image: "/assets/technology.png" },
  ];

  const products = [
    { id: 1, name: "Bulk A4 Paper Reams (10pk)", price: "₹2,150", originalPrice: "₹2,800", image: "https://images.unsplash.com/photo-1585336139118-132f08535091?q=80&w=200&h=200&fit=crop", type: "Office" },
    { id: 2, name: "Scientific Calculator Set", price: "₹8,499", originalPrice: "₹10,500", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=200&h=200&fit=crop", type: "Lab" },
    { id: 3, name: "Teacher's Planner 2026", price: "₹450", originalPrice: "₹650", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&h=200&fit=crop", type: "Faculty" },
    { id: 4, name: "Waterproof Staff Bags", price: "₹1,250", originalPrice: "₹1,800", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=200&h=200&fit=crop", type: "Faculty" },
  ];

  const handleBuyKit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
  };

  const renderProductCard = (product) => (
    <ProductCard key={product.id} product={product} />
  );

  return (
    <>
      <SchoolSideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={schoolInfo}
      />
      <SchoolHeader
        scrolled={scrolled}
        onMenuClick={() => setIsMenuOpen(true)}
        childInfo={schoolInfo}
      />
      <div
        onScroll={handleScroll}
        className="flex flex-col h-full bg-gray-50/50 pb-40 overflow-y-auto font-outfit"
      >
        <div className="h-[170px] shrink-0"></div>



        <div className="mt-8">
          <div ref={notifRef} className="flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-hide select-none active:cursor-grabbing">
            {[
              { id: 1, text: "GST Invoicing now available for bulk institutional orders.", icon: <ClipboardList size={16} className="text-accent-gold shrink-0" />, color: "bg-accent-gold/10 border-accent-gold/20" },
              { id: 2, text: "Vendor applications open for Q3 supply cycle.", icon: <Users size={16} className="text-primary shrink-0" />, color: "bg-primary/10 border-primary/20" }
            ].map((notif) => (
              <div key={notif.id} className={`min-w-[280px] ${notif.color} border px-4 py-3 rounded-2xl flex items-center gap-3 active:scale-95 transition-all`}>
                {notif.icon}
                <p className="text-[11px] font-semibold text-deep-purple leading-tight">
                  {notif.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <SectionHeader
            title="Institutional Packages"
            onViewAll={() => navigate('/school/products')}
            className="-ml-1"
          />
          <div ref={kitsRef} className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide select-none active:cursor-grabbing">
            {bulkPackages.map((kit) => (
              <Link
                key={kit.id}
                to={`/school/kit/${kit.id}`}
                className="min-w-[280px] bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-200/40 group active:scale-95 transition-all border border-gray-100 block"
              >
                <div className="h-48 relative">
                  <img src={kit.image} alt={kit.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-wider">
                    {kit.badge}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-deep-purple text-base mb-1">{kit.name}</h3>
                  <p className="text-[10px] text-gray-400 font-medium mb-4">Optimized for institutional bulk supply</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-primary font-bold text-lg">{kit.price}</span>
                      <span className="text-[9px] text-gray-400">per unit avg.</span>
                    </div>
                    <button
                      onClick={handleBuyKit}
                      className="px-5 py-2.5 bg-[#ffc107] text-black rounded-xl text-xs font-bold shadow-lg shadow-yellow-100 flex items-center gap-2 active:scale-90 transition-all relative z-10"
                    >
                      Order Bulk
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <SectionHeader title="School Categories" className="-ml-1" />
          <div className="flex gap-5 overflow-x-auto px-6 pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <CategoryStory
                key={cat.name}
                name={cat.name}
                image={cat.image}
                to={`/school/category/${cat.name.toLowerCase().replace(' ', '-')}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 pb-6">
          <SectionHeader
            title="Office & Facility Essentials"
            onViewAll={() => navigate('/school/products')}
            className="-ml-1"
          />
          <div className="grid grid-cols-2 gap-4 px-6">
            {products.map((product) => renderProductCard(product))}
          </div>
        </div>

        <div className="mt-8 px-6">
          <h2 className="text-lg font-semibold text-deep-purple mb-4 -ml-1">Vendor Spotlights</h2>
          <div className="rounded-2xl h-40 overflow-hidden relative mb-4 shadow-md border border-gray-100">
            <img src="/assets/category_banner2.png" className="w-full h-full object-cover" alt="Vendors" />
          </div>
        </div>

        <div className="px-6 pb-8 mt-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-deep-purple -ml-1">Case Studies</h2>
            </div>
            <button className="text-primary text-xs font-bold">Read All</button>
          </div>
          <div ref={reelsRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[
              { id: 1, title: "Modernizing Classrooms", views: "School Spotlight", thumb: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=300&h=533&fit=crop" },
              { id: 2, title: "Smart Inventory Management", views: "Expert Insights", thumb: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300&h=533&fit=crop" }
            ].map((reel) => (
              <div key={reel.id} className="min-w-[160px] h-[280px] rounded-[2rem] overflow-hidden relative group active:scale-95 transition-all shadow-lg border border-white/20">
                <img src={reel.thumb} alt={reel.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                  <span className="text-accent-gold text-[8px] font-black uppercase tracking-wider mb-1">{reel.views}</span>
                  <h4 className="text-white text-xs font-bold leading-tight">{reel.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AuthPrompt
        isOpen={isAuthPromptOpen}
        onClose={() => setIsAuthPromptOpen(false)}
        title="Institutional Access"
        message="Login as a School Administrator to place bulk orders and manage your procurement dashboard."
      />
    </>
  );
};

export default SchoolHome;
