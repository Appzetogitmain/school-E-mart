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
import apiClient from '../../../services/apiClient';
import ProductCard from '../../components/ProductCard';
import SectionHeader from '../../components/SectionHeader';
import CategoryStory from '../../components/CategoryStory';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import AuthPrompt from '../../components/AuthPrompt';
import RecentUpdates from './RecentUpdates';
import QuickActions from './QuickActions';
import ParentLearningHub from './ParentLearningHub';
import RecommendedKits from './RecommendedKits';
import PromoCategoryBanners from './PromoCategoryBanners';
import ReelsRow from './ReelsRow';
import { useCategoryTree } from '../../../hooks/useCategoryTree';
import { useProducts } from '../../../hooks/useProducts';
import { findHeaderCategory } from '../../../utils/mappers/categoryMapper';

const ParentHome = () => {
  const navigate = useNavigate();
  const notifRef = useDraggableScroll();
  const catsRef = useDraggableScroll();
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
  const { tree: categoryTree } = useCategoryTree();
  const { products: essentialProducts, loading: essentialLoading } = useProducts({ limit: 4, sort: 'popular' });
  const uniformsHeader = findHeaderCategory(categoryTree, 'uniforms');
  const stationeryHeader = findHeaderCategory(categoryTree, 'stationery');
  const { products: uniformProducts } = useProducts(
    { headerId: uniformsHeader?.id, limit: 2, sort: 'popular' },
    { enabled: Boolean(uniformsHeader?.id) }
  );
  const { products: stationeryProducts } = useProducts(
    { headerId: stationeryHeader?.id, limit: 2, sort: 'popular' },
    { enabled: Boolean(stationeryHeader?.id) }
  );

  const categories = categoryTree.length
    ? categoryTree.map((cat) => ({
        name: cat.name,
        image: cat.image,
        slug: cat.slug,
      }))
    : [
        { name: 'Uniforms', image: '/assets/uniforms.png', slug: 'uniforms' },
        { name: 'Books', image: '/assets/books.png', slug: 'books' },
        { name: 'Stationery', image: '/assets/stationary.png', slug: 'stationery' },
        { name: 'Sports', image: '/assets/toys_and_sports.png', slug: 'sports' },
        { name: 'Technology', image: '/assets/technology.png', slug: 'technology' },
      ];

  const [todayAttendance, setTodayAttendance] = useState(null);

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('childInfo');
      if (saved) setChildInfo(JSON.parse(saved));
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  useEffect(() => {
    const fetchTodayAttendance = async () => {
      const studentId = childInfo?.studentId;
      const schoolId = childInfo?.schoolId;
      if (!studentId || !schoolId || schoolId === 'explore-schools') return;

      try {
        const today = new Date().toISOString().slice(0, 10);
        const response = await apiClient.get(`/schools/${schoolId}/attendance/history`, {
          params: { studentId, date: today }
        });
        const records = response.data.data.records || [];
        if (records.length > 0) {
          setTodayAttendance(records[0]);
        } else {
          setTodayAttendance(null);
        }
      } catch (err) {
        console.error('Failed to fetch today attendance:', err);
      }
    };
    fetchTodayAttendance();
  }, [childInfo]);

  const getTodayStatusDetails = () => {
    if (!todayAttendance) {
      return {
        label: 'Pending',
        color: 'text-[#F2994A]',
        bg: 'bg-[#FEF6EC]',
        dotBg: 'bg-[#F2994A]',
        time: 'Not marked yet',
        icon: <BookOpen size={12} strokeWidth={2.5} />
      };
    }
    const status = todayAttendance.status;
    const remarks = todayAttendance.remarks;
    if (status === 'present' && remarks === 'Late') {
      return {
        label: 'Late',
        color: 'text-[#F2994A]',
        bg: 'bg-[#FFF6ED]',
        dotBg: 'bg-[#F2994A]',
        time: 'Marked at 09:45 a.m.',
        icon: <Check size={12} strokeWidth={3.5} />
      };
    }
    if (status === 'present') {
      return {
        label: 'Present',
        color: 'text-[#34A853]',
        bg: 'bg-[#EBFBF0]',
        dotBg: 'bg-[#34A853]',
        time: 'Marked at 09:15 a.m.',
        icon: <Check size={12} strokeWidth={3.5} />
      };
    }
    if (status === 'absent') {
      return {
        label: 'Absent',
        color: 'text-[#D93025]',
        bg: 'bg-[#FEF3F2]',
        dotBg: 'bg-[#D93025]',
        time: 'Absent today',
        icon: <Check size={12} strokeWidth={3.5} />
      };
    }
    if (status === 'leave') {
      return {
        label: 'Leave',
        color: 'text-[#7F56D9]',
        bg: 'bg-[#F9F5FF]',
        dotBg: 'bg-[#7F56D9]',
        time: 'Approved leave',
        icon: <Check size={12} strokeWidth={3.5} />
      };
    }
    return {
      label: 'Holiday',
      color: 'text-[#7F56D9]',
      bg: 'bg-[#F9F5FF]',
      dotBg: 'bg-[#7F56D9]',
      time: 'School closed',
      icon: <Check size={12} strokeWidth={3.5} />
    };
  };

  const todayDetails = getTodayStatusDetails();

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const products = essentialProducts;

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
              <div 
                onClick={() => navigate('/user/attendance')}
                className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md active:scale-[0.98] transition-all duration-300 cursor-pointer"
              >
                {/* Double Ring Badge */}
                <div className={`w-9 h-9 rounded-full ${todayDetails.bg} flex items-center justify-center shrink-0`}>
                  <div className={`w-[26px] h-[26px] rounded-full ${todayDetails.dotBg} flex items-center justify-center text-white shadow-sm`}>
                    {todayDetails.icon}
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-[11px] font-semibold text-gray-500 leading-none">Attendance</p>
                  <p className={`text-[13px] font-black ${todayDetails.color} leading-none mt-1.5 truncate`}>{todayDetails.label}</p>
                  <p className="text-[9px] font-medium text-gray-400 leading-none mt-1 truncate">{todayDetails.time}</p>
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

        <RecommendedKits 
          isGuest={isGuest} 
          onAuthRequired={() => setIsAuthPromptOpen(true)} 
        />

        <div className="mt-8">
          <SectionHeader title="Categories" />
          <div className="flex gap-5 overflow-x-auto px-6 pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <CategoryStory
                key={cat.name}
                name={cat.name}
                image={cat.image}
                to={`/user/category/${cat.slug || cat.name.toLowerCase()}`}
              />
            ))}
          </div>
        </div>

        <PromoCategoryBanners />

        <div className="mt-10 pb-6">
          <SectionHeader
            title="Essential Products"
            onViewAll={() => navigate('/user/products')}
          />
          <div className="grid grid-cols-2 gap-4 px-6">
            {essentialLoading ? (
              <p className="col-span-2 text-center text-sm text-gray-400 py-6">Loading products...</p>
            ) : (
              products.map((product) => renderProductCard(product))
            )}
          </div>
        </div>

        <div className="mt-4 px-6">
          <h2 className="text-lg font-semibold text-deep-purple mb-4">Uniforms</h2>
          <div className="rounded-2xl h-36 overflow-hidden relative mb-4 shadow-md border border-gray-100">
            <img src="/assets/category_banner1.png" className="w-full h-full object-cover" alt="Uniforms" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(uniformProducts.length ? uniformProducts : products.slice(0, 2)).map((product) => renderProductCard(product))}
          </div>
        </div>

        <div className="mt-8 px-6 pb-12">
          <h2 className="text-lg font-semibold text-deep-purple mb-4">Stationery</h2>
          <div className="rounded-2xl h-36 overflow-hidden relative mb-4 shadow-md border border-gray-100">
            <img src="/assets/category_banner3.png" className="w-full h-full object-cover" alt="Stationery" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(stationeryProducts.length ? stationeryProducts : products.slice(0, 2)).map((product) => renderProductCard(product))}
          </div>
        </div>

        <ReelsRow />
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
