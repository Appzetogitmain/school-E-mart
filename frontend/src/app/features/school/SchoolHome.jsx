import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, Search, ShoppingBag, User,
  ChevronDown, Bell, Sparkles, Package,
  Shirt, Book, PenTool, Footprints,
  ArrowRight, Star, ShoppingCart, Filter, Play,
  Grid, Layout, Building2, Users, ClipboardList,
  GraduationCap, Megaphone, Calendar, Store, Clock,
  Clipboard, MoreHorizontal, ChevronRight, ShieldAlert,
  ArrowUpRight, CheckCircle2, FolderOpen
} from 'lucide-react';
import SchoolHeader from '../../components/SchoolHeader';
import InstitutionalPackages from './InstitutionalPackages';
import SchoolCategories from './SchoolCategories';
import CategoryEssentials from './CategoryEssentials';
import VendorSpotlights from './VendorSpotlights';
import SchoolCaseStudies from './SchoolCaseStudies';
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
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState('Academic Year 2025–26');

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

  return (
    <>
      <SchoolHeader
        scrolled={scrolled}
        childInfo={schoolInfo}
      />
      
      <div
        onScroll={handleScroll}
        className="flex flex-col h-full bg-gray-50/50 pb-40 overflow-y-auto font-outfit"
      >
        {/* Spacer for Sticky Header */}
        <div className="h-[185px] shrink-0"></div>

        {/* ============================================================== */}
        {/* NEW: DYNAMIC SCHOOL ADMIN PROCUREMENT & OVERVIEW DASHBOARD */}
        {/* ============================================================== */}
        <div className="px-6 py-4 space-y-6">
          
          {/* Header Row with Academic Year Dropdown */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-deep-purple">Overview</h2>
            <div className="relative">
              <select 
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="bg-white border border-gray-150 rounded-full px-4 py-1.5 text-xs font-black text-gray-550 focus:outline-none cursor-pointer flex items-center gap-1 shadow-sm appearance-none pr-8"
              >
                <option value="Academic Year 2025–26">Academic Year 2025–26</option>
                <option value="Academic Year 2026–27">Academic Year 2026–27</option>
              </select>
              <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* 6 Grid Overview Cards */}
          <div className="grid grid-cols-3 gap-3.5">
            {/* Grid 1: Students */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-primary shrink-0">
                <GraduationCap size={16} />
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-black text-deep-purple block leading-none">1,248</span>
                <span className="text-xs text-gray-450 font-bold block mt-1">Students</span>
                <span className="text-[10px] text-emerald-500 font-bold block mt-1">↑ 3% this month</span>
              </div>
            </div>

            {/* Grid 2: Teachers */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <Users size={16} />
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-black text-deep-purple block leading-none">68</span>
                <span className="text-xs text-gray-455 font-bold block mt-1">Teachers</span>
                <span className="text-[10px] text-emerald-500 font-bold block mt-1">↑ 2% this month</span>
              </div>
            </div>

            {/* Grid 3: Active Notices */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <Megaphone size={16} />
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-black text-deep-purple block leading-none">8</span>
                <span className="text-xs text-gray-455 font-bold block mt-1">Active Notices</span>
                <span className="text-[10px] text-primary font-bold hover:underline cursor-pointer block mt-1">View all</span>
              </div>
            </div>

            {/* Grid 4: Kit Orders */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Package size={16} />
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-black text-deep-purple block leading-none">156</span>
                <span className="text-xs text-gray-455 font-bold block mt-1">Kit Orders</span>
                <span className="text-[10px] text-primary font-bold block mt-1">12 Pending</span>
              </div>
            </div>

            {/* Grid 5: Purchase Requests */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
              <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                <ShoppingCart size={16} />
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-black text-deep-purple block leading-none">23</span>
                <span className="text-xs text-gray-455 font-bold block mt-1">Purchase Requests</span>
                <span className="text-[10px] text-red-500 font-bold block mt-1">5 Pending</span>
              </div>
            </div>

            {/* Grid 6: Active Vendors */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Store size={16} />
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-black text-deep-purple block leading-none">24</span>
                <span className="text-xs text-gray-455 font-bold block mt-1">Active Vendors</span>
                <span className="text-[10px] text-primary font-bold hover:underline cursor-pointer block mt-1">View all</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid Container */}
          <div className="space-y-3.5">
            <h2 className="text-base font-black text-deep-purple">Quick Actions</h2>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-y-5 gap-x-2 w-full justify-items-center pb-2">
              {/* Send Notice */}
              <button 
                onClick={() => navigate('/school/send-notice')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-all w-16"
              >
                <div className="w-11 h-11 rounded-full bg-[#E8E4FF] text-primary flex items-center justify-center shadow-sm">
                  <Megaphone size={16} />
                </div>
                <span className="text-[11px] font-black text-center text-deep-purple leading-tight block">Send Notice</span>
              </button>

              {/* Create Event */}
              <button 
                onClick={() => navigate('/school/create-event')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-all w-16"
              >
                <div className="w-11 h-11 rounded-full bg-[#FFF3DF] text-amber-500 flex items-center justify-center shadow-sm">
                  <Calendar size={16} />
                </div>
                <span className="text-[11px] font-black text-center text-deep-purple leading-tight block">Create Event</span>
              </button>

              {/* Create Kit */}
              <button 
                onClick={() => navigate('/school/create-kit')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-all w-16"
              >
                <div className="w-11 h-11 rounded-full bg-[#E5FDF1] text-emerald-500 flex items-center justify-center shadow-sm">
                  <Package size={16} />
                </div>
                <span className="text-[11px] font-black text-center text-deep-purple leading-tight block">Create Kit</span>
              </button>

              {/* New Purchase Request */}
              <button 
                onClick={() => navigate('/school/create-request')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-all w-16"
              >
                <div className="w-11 h-11 rounded-full bg-[#E6F3FF] text-blue-500 flex items-center justify-center shadow-sm">
                  <Clipboard size={16} />
                </div>
                <span className="text-[11px] font-black text-center text-deep-purple leading-tight block">New Request</span>
              </button>

              {/* Drafts */}
              <button 
                onClick={() => navigate('/school/draft-requests')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-all w-16"
              >
                <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shadow-sm">
                  <FolderOpen size={16} />
                </div>
                <span className="text-[11px] font-black text-center text-deep-purple leading-tight block">Drafts</span>
              </button>

              {/* Teacher Approvals */}
              <button 
                onClick={() => navigate('/school/teacher-approvals')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-all w-16"
              >
                <div className="w-11 h-11 rounded-full bg-[#EBF0FF] text-indigo-500 flex items-center justify-center shadow-sm">
                  <Users size={16} />
                </div>
                <span className="text-[11px] font-black text-center text-deep-purple leading-tight block">Teacher Approvals</span>
              </button>

              {/* More */}
              <button 
                onClick={() => navigate('/school/more')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-all w-16"
              >
                <div className="w-11 h-11 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shadow-sm">
                  <MoreHorizontal size={16} />
                </div>
                <span className="text-[11px] font-black text-center text-deep-purple leading-tight block">More</span>
              </button>
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-deep-purple">Recent Activity</h2>
              <button className="text-xs text-primary font-black hover:underline">View All</button>
            </div>

            <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm divide-y divide-gray-100/50 overflow-hidden">
              {/* Activity 1 */}
              <div className="p-4 flex items-center gap-3.5 hover:bg-gray-50/50 cursor-pointer active:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-primary flex items-center justify-center shrink-0">
                  <Megaphone size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-deep-purple block leading-tight">New Notice Published</span>
                    <span className="text-[10px] text-gray-400 font-bold">10:30 AM</span>
                  </div>
                  <p className="text-[11px] text-gray-450 font-bold truncate mt-1">Summer Vacation will begin from 21 May 2025.</p>
                </div>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
              </div>

              {/* Activity 2 */}
              <div className="p-4 flex items-center gap-3.5 hover:bg-gray-50/50 cursor-pointer active:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                  <Package size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-deep-purple block leading-tight">Kit Order Received</span>
                    <span className="text-[10px] text-gray-400 font-bold">Yesterday</span>
                  </div>
                  <p className="text-[11px] text-gray-455 font-bold truncate mt-1">Class 5 Academic Kit – 20 orders received</p>
                </div>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
              </div>

              {/* Activity 3 */}
              <div className="p-4 flex items-center gap-3.5 hover:bg-gray-50/50 cursor-pointer active:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <ShoppingCart size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-deep-purple block leading-tight">Quotation Received</span>
                    <span className="text-[10px] text-gray-400 font-bold">14 May 2025</span>
                  </div>
                  <p className="text-[11px] text-gray-455 font-bold truncate mt-1">3 quotations received for Notebook Purchase</p>
                </div>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
              </div>

              {/* Activity 4 */}
              <div className="p-4 flex items-center gap-3.5 hover:bg-gray-50/50 cursor-pointer active:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-deep-purple block leading-tight">New Teacher Added</span>
                    <span className="text-[10px] text-gray-400 font-bold">13 May 2025</span>
                  </div>
                  <p className="text-[11px] text-gray-455 font-bold truncate mt-1">Mrs. Neha Sharma has joined as Mathematics Teacher</p>
                </div>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
              </div>
            </div>
          </div>

          {/* Bottom Bid Progress Banner */}
          <div className="bg-purple-50/70 border border-purple-100 rounded-[2rem] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                <Clipboard size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-deep-purple leading-tight">Uniform Bid 2026–27 is in Progress</h4>
                <p className="text-[11px] text-gray-455 font-bold mt-1">5 vendors have submitted their bids.</p>
              </div>
            </div>

            <button 
              type="button"
              className="px-4 py-2 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all active:scale-95 rounded-2xl text-xs font-black shrink-0 shadow-sm"
            >
              View Bids
            </button>
          </div>

        </div>

        {/* ============================================================== */}
        {/* ORIGINAL: INSTITUTIONAL BULK MARKETPLACE BENEATH */}
        {/* ============================================================== */}
        <div className="border-t border-gray-100/80 mt-2 pt-4">
          
          <div className="mt-4">
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

          <InstitutionalPackages 
            packages={bulkPackages}
            kitsRef={kitsRef}
            onBuyClick={handleBuyKit}
          />

          <SchoolCategories 
            categories={categories}
          />

          <CategoryEssentials 
            title="Office & Facility Essentials"
            products={products}
            onViewAll={() => navigate('/school/products')}
          />
          <VendorSpotlights />
          <SchoolCaseStudies reelsRef={reelsRef} />
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
