import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, Search, ShoppingBag, User,
  ChevronDown, Bell, Sparkles, Package,
  Shirt, Book, PenTool, Footprints,
  ArrowRight, Star, ShoppingCart, Filter, Play,
  Grid, Layout, CheckCircle2, BookOpen, Check
} from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import ProductCard from '../../components/ProductCard';
import SectionHeader from '../../components/SectionHeader';
import CategoryStory from '../../components/CategoryStory';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import AuthPrompt from '../../components/AuthPrompt';
import RecentUpdates from './RecentUpdates';
import QuickActions from './QuickActions';
import ParentLearningHub from './ParentLearningHub';

const ParentHome = () => {
  const navigate = useNavigate();
  const notifRef = useDraggableScroll();
  const kitsRef = useDraggableScroll();
  const catsRef = useDraggableScroll();
  const bannerRef = useDraggableScroll();
  const reelsRef = useDraggableScroll();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [childInfo, setChildInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : {
      name: "Guest",
      school: "Explore Schools",
      grade: "Select Grade",
      phone: ""
    };
  });

  const isGuest = !localStorage.getItem('childInfo');

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('childInfo');
      if (saved) setChildInfo(JSON.parse(saved));
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const kits = [
    {
      id: 1,
      name: "Complete Class 2 Kit",
      price: "₹4,299",
      originalPrice: "₹5,499",
      image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=300&h=400&fit=crop",
      badge: "School Recommended"
    },
    {
      id: 2,
      name: "Winter Uniform Bundle",
      price: "₹1,850",
      originalPrice: "₹2,450",
      image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=300&h=400&fit=crop",
      badge: "Winter Essential"
    }
  ];

  const categories = [
    { name: "Uniforms", image: "/assets/uniforms.png" },
    { name: "Books", image: "/assets/books.png" },
    { name: "Stationery", image: "/assets/stationary.png" },
    { name: "Sports", image: "/assets/toys_and_sports.png" },
    { name: "Technology", image: "/assets/technology.png" },
  ];

  const products = [
    { id: 1, name: "Oxford English Grammar", price: "₹450", originalPrice: "₹599", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&h=200&fit=crop", type: "Book" },
    { id: 2, name: "Formal School Shoes", price: "₹899", originalPrice: "₹1,299", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=200&h=200&fit=crop", type: "Shoes" },
    { id: 3, name: "Math Geometry Box", price: "₹240", originalPrice: "₹350", image: "https://images.unsplash.com/photo-1634045550273-db9897ca800c?q=80&w=200&h=200&fit=crop", type: "Stationery" },
    { id: 4, name: "Cotton School Socks", price: "₹120", originalPrice: "₹199", image: "https://images.unsplash.com/photo-1582966271819-755813ec3b90?q=80&w=200&h=200&fit=crop", type: "Uniform" },
  ];

  const handleBuyKit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    // Logic for buy kit
  };

  const renderProductCard = (product) => (
    <ProductCard key={product.id} product={product} />
  );

  return (
    <>
            <AppHeader
        scrolled={scrolled}
        onMenuClick={() => setIsMenuOpen(true)}
        childInfo={childInfo}
        transparentAtTop={true}
      />
      <div
        onScroll={handleScroll}
        className="flex flex-col h-full bg-gray-50/50 pb-40 overflow-y-auto overflow-x-hidden w-full font-outfit"
      >
        {/* Flat Purple Header Background Block */}
        <div className="bg-gradient-to-b from-[#3B248C] to-[#5B3FD6] h-[160px] w-full relative shrink-0">
          {/* Soft Premium Warm Accent Glows */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFC933]/15 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none"></div>
        </div>

        {/* Today at a Glance Overlapping Section (Narrower and floating halfway) */}
        {!isGuest && (
          <div className="relative z-10 -mt-10 mx-5 sm:mx-6 bg-white rounded-2xl p-5 shadow-lg border border-gray-100/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-deep-purple">Today at a Glance</h2>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              {/* Attendance Status Card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-300">
                {/* Double Ring Green Checkmark Badge */}
                <div className="w-9 h-9 rounded-full bg-[#EBFBF0] flex items-center justify-center shrink-0">
                  <div className="w-[26px] h-[26px] rounded-full bg-[#34A853] flex items-center justify-center text-white shadow-sm">
                    <Check size={12} strokeWidth={3.5} />
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-[11px] font-semibold text-gray-500 leading-none">Attendance</p>
                  <p className="text-[13px] font-black text-[#34A853] leading-none mt-1.5 truncate">Present</p>
                  <p className="text-[9px] font-medium text-gray-400 leading-none mt-1 truncate">Marked at 09:15 a.m.</p>
                </div>
              </div>

              {/* Homework Summary Card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-300">
                {/* Double Ring Orange Book Badge */}
                <div className="w-9 h-9 rounded-full bg-[#FFF6ED] flex items-center justify-center shrink-0">
                  <div className="w-[26px] h-[26px] rounded-full bg-[#F2994A] flex items-center justify-center text-white shadow-sm">
                    <BookOpen size={12} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-[11px] font-semibold text-gray-500 leading-none">Homework</p>
                  <p className="text-[13px] font-black text-[#F2994A] leading-none mt-1.5 truncate">2 Pending</p>
                  <p className="text-[9px] font-medium text-gray-400 leading-none mt-1 truncate">Due Tomorrow</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isGuest && (
          <div className="mt-4">
            <div ref={notifRef} className="flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-hide select-none active:cursor-grabbing">
              {[
                { id: 1, text: "New session starts from 15th June. Order your kits early!", icon: <Sparkles size={16} className="text-accent-gold shrink-0" />, color: "bg-accent-gold/10 border-accent-gold/20" },
                { id: 2, text: "Winter uniform guidelines updated. Check categories.", icon: <Bell size={16} className="text-primary shrink-0" />, color: "bg-primary/10 border-primary/20" }
              ].map((notif) => (
                <button 
                  key={notif.id} 
                  onClick={() => navigate('/user/notifications')}
                  className={`min-w-[280px] ${notif.color} border px-4 py-3 rounded-2xl flex items-center gap-3 active:scale-95 transition-all cursor-pointer text-left`}
                >
                  {notif.icon}
                  <p className="text-[11px] font-semibold text-deep-purple leading-tight">
                    {notif.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timeline-style Recent Updates Section */}
        {!isGuest && <RecentUpdates />}

        {/* Quick Actions Grid Section */}
        <QuickActions />

        {/* Learning Hub Section */}
        <ParentLearningHub />

        {!isGuest && (
          <div className="mt-8">
            <SectionHeader
              title="Recommended Kits"
              onViewAll={() => navigate('/user/products')}
            />
            <div ref={kitsRef} className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide select-none active:cursor-grabbing">
              {kits.map((kit) => (
                <Link
                  key={kit.id}
                  to={`/user/kit/${kit.id}`}
                  className="min-w-[280px] bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-200/40 group active:scale-95 transition-all border border-gray-100 block"
                >
                  <div className="h-48 relative">
                    <img src={kit.image} alt={kit.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-deep-purple text-base mb-1">{kit.name}</h3>
                    <p className="text-[10px] text-gray-400 font-medium mb-4">Everything your child needs for Class 2</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-primary font-bold text-lg">{kit.price}</span>
                      </div>
                      <button
                        onClick={handleBuyKit}
                        className="px-5 py-2.5 bg-[#ffc107] text-black rounded-xl text-xs font-bold shadow-lg shadow-yellow-100 flex items-center gap-2 active:scale-90 transition-all relative z-10"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <SectionHeader title="Categories" />
          <div className="flex gap-5 overflow-x-auto px-6 pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <CategoryStory
                key={cat.name}
                name={cat.name}
                image={cat.image}
                to={`/user/category/${cat.name.toLowerCase()}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 relative z-10 min-h-[190px]">
          <div className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x snap-mandatory scrollbar-hide">
            {[
              { id: 1, title: "Modern Uniforms", image: "/assets/category_banner1.png" },
              { id: 2, title: "Institutional Quality", image: "/assets/category_banner2.png" },
              { id: 3, title: "Science & Lab Setup", image: "/assets/category_banner3.png" }
            ].map((banner) => (
              <div key={banner.id} className="min-w-[300px] h-[180px] rounded-2xl relative overflow-hidden snap-center flex-shrink-0 bg-primary/5 shadow-md border border-gray-100">
                <img src={banner.image} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 pb-6">
          <SectionHeader
            title="Essential Products"
            onViewAll={() => navigate('/user/products')}
          />
          <div className="grid grid-cols-2 gap-4 px-6">
            {products.map((product) => renderProductCard(product))}
          </div>
        </div>

        <div className="mt-4 px-6">
          <h2 className="text-lg font-semibold text-deep-purple mb-4">Uniforms</h2>
          <div className="rounded-2xl h-36 overflow-hidden relative mb-4 shadow-md border border-gray-100">
            <img src="/assets/category_banner1.png" className="w-full h-full object-cover" alt="Uniforms" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 201, name: "Summer Polo Shirt", price: "₹350", originalPrice: "₹499", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=200&h=200&fit=crop" },
              { id: 202, name: "Daily Cotton Trousers", price: "₹550", originalPrice: "₹799", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=200&h=200&fit=crop" }
            ].map((product) => renderProductCard(product))}
          </div>
        </div>

        <div className="mt-8 px-6 pb-12">
          <h2 className="text-lg font-semibold text-deep-purple mb-4">Stationery</h2>
          <div className="rounded-2xl h-36 overflow-hidden relative mb-4 shadow-md border border-gray-100">
            <img src="/assets/category_banner3.png" className="w-full h-full object-cover" alt="Stationery" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 301, name: "Advanced Drawing Set", price: "₹280", originalPrice: "₹399", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=200&h=200&fit=crop" },
              { id: 302, name: "Premium Pen Pack", price: "₹120", originalPrice: "₹180", image: "https://images.unsplash.com/photo-1585336139118-132f08535091?q=80&w=200&h=200&fit=crop" },
            ].map((product) => renderProductCard(product))}
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-deep-purple">Watch & Explore</h2>
            </div>
            <button 
              onClick={() => navigate('/user/reels')}
              className="text-primary text-xs font-bold cursor-pointer active:scale-95 transition-transform"
            >
              Watch All
            </button>
          </div>
          <div ref={reelsRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[
              { id: 1, title: "Smart Kit Unboxing", views: "12k", thumb: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=300&h=533&fit=crop" },
              { id: 2, title: "Uniform Quality Test", views: "8.5k", thumb: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300&h=533&fit=crop" }
            ].map((reel) => (
              <div 
                key={reel.id} 
                onClick={() => navigate('/user/reels')}
                className="min-w-[160px] h-[280px] rounded-[2rem] overflow-hidden relative group active:scale-95 transition-all shadow-lg border border-white/20 cursor-pointer"
              >
                <img src={reel.thumb} alt={reel.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    <Play size={16} fill="currentColor" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AuthPrompt
        isOpen={isAuthPromptOpen}
        onClose={() => setIsAuthPromptOpen(false)}
        title="Complete Your Kit"
        message="Login to add these recommended school kits to your cart and ensure your child is session-ready!"
      />
    </>
  );
};

export default ParentHome;
