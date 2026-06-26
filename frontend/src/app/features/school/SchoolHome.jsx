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
  ArrowUpRight, CheckCircle2, FolderOpen, Loader2
} from 'lucide-react';
import SchoolHeader from '../../components/SchoolHeader';
import InstitutionalPackages from './InstitutionalPackages';
import SchoolCategories from './SchoolCategories';
import CategoryEssentials from './CategoryEssentials';
import VendorSpotlights from './VendorSpotlights';
import SchoolCaseStudies from './SchoolCaseStudies';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import AuthPrompt from '../../components/AuthPrompt';
import { listStudents, listTeachers, listNotices } from '../../../services/schoolApi';
import { listOrders } from '../../../services/ordersApi';
import { useCategoryTree } from '../../../hooks/useCategoryTree';
import { useProducts } from '../../../hooks/useProducts';
import { useSchoolId } from '../../../utils/schoolContext';
import { getErrorMessage } from '../../../utils/apiHelpers';

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

  const schoolId = useSchoolId();
  const { tree: categoryTree, loading: categoriesLoading } = useCategoryTree();
  const { products: featuredPackages, loading: packagesLoading } = useProducts({ featured: true, limit: 4 });
  const { products: essentialProducts, loading: productsLoading } = useProducts({ limit: 4, sort: 'popular' });

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    notices: 0,
    orders: 0,
    ordersPending: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [recentNotices, setRecentNotices] = useState([]);

  const categories = categoryTree.map((cat) => ({
    name: cat.name,
    image: cat.image,
    slug: cat.slug,
  }));

  const bulkPackages = featuredPackages.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    image: product.image,
    badge: 'Institutional Rate',
  }));

  const products = essentialProducts;

  useEffect(() => {
    let cancelled = false;

    const loadDashboardStats = async () => {
      if (!schoolId) {
        setStatsLoading(false);
        return;
      }

      setStatsLoading(true);
      setStatsError('');
      try {
        const [
          studentsResult,
          teachersResult,
          noticesResult,
          ordersResult,
          recentNoticesResult,
        ] = await Promise.all([
          listStudents(schoolId, { limit: 1 }),
          listTeachers(schoolId, { limit: 1 }),
          listNotices(schoolId, { limit: 1 }),
          listOrders({ limit: 1, schoolId }, { audience: 'school' }),
          listNotices(schoolId, { limit: 4 }),
        ]);

        if (cancelled) return;

        const pendingOrders = (ordersResult.data || []).filter(
          (order) => order.status === 'pending' || order.status === 'processing'
        ).length;

        setStats({
          students: studentsResult.pagination?.total ?? studentsResult.data?.length ?? 0,
          teachers: teachersResult.pagination?.total ?? teachersResult.data?.length ?? 0,
          notices: noticesResult.pagination?.total ?? noticesResult.data?.length ?? 0,
          orders: ordersResult.pagination?.total ?? ordersResult.data?.length ?? 0,
          ordersPending: pendingOrders,
        });
        setRecentNotices(recentNoticesResult.data || []);
      } catch (err) {
        if (!cancelled) {
          setStatsError(getErrorMessage(err, 'Unable to load dashboard stats'));
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    loadDashboardStats();
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

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
            {statsLoading ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-8">
                <Loader2 size={28} className="animate-spin text-primary mb-2" />
                <p className="text-xs text-gray-400 font-bold">Loading overview…</p>
              </div>
            ) : (
              <>
                <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-primary shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black text-deep-purple block leading-none">{stats.students}</span>
                    <span className="text-xs text-gray-450 font-bold block mt-1">Students</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                    <Users size={16} />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black text-deep-purple block leading-none">{stats.teachers}</span>
                    <span className="text-xs text-gray-455 font-bold block mt-1">Teachers</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                    <Megaphone size={16} />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black text-deep-purple block leading-none">{stats.notices}</span>
                    <span className="text-xs text-gray-455 font-bold block mt-1">Active Notices</span>
                    <button type="button" onClick={() => navigate('/school/notifications')} className="text-[10px] text-primary font-bold hover:underline cursor-pointer block mt-1">View all</button>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                    <Package size={16} />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black text-deep-purple block leading-none">{stats.orders}</span>
                    <span className="text-xs text-gray-455 font-bold block mt-1">Kit Orders</span>
                    {stats.ordersPending > 0 && (
                      <span className="text-[10px] text-primary font-bold block mt-1">{stats.ordersPending} Pending</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                    <ShoppingCart size={16} />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black text-deep-purple block leading-none">0</span>
                    <span className="text-xs text-gray-455 font-bold block mt-1">Purchase Requests</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between min-h-[96px]">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Store size={16} />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-black text-deep-purple block leading-none">0</span>
                    <span className="text-xs text-gray-455 font-bold block mt-1">Active Vendors</span>
                  </div>
                </div>
              </>
            )}
          </div>
          {statsError && (
            <p className="text-xs text-red-500 font-semibold text-center">{statsError}</p>
          )}

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

              {/* Add Class */}
              <button 
                onClick={() => navigate('/school/add-class')}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-all w-16"
              >
                <div className="w-11 h-11 rounded-full bg-[#E5F7FF] text-[#00A3FF] flex items-center justify-center shadow-sm">
                  <GraduationCap size={16} />
                </div>
                <span className="text-[11px] font-black text-center text-deep-purple leading-tight block">Add Class</span>
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
              {recentNotices.length === 0 ? (
                <div className="p-8 text-center">
                  <Megaphone size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-400">No recent activity yet</p>
                </div>
              ) : (
                recentNotices.map((notice) => (
                  <div
                    key={notice._id || notice.id}
                    className="p-4 flex items-center gap-3.5 hover:bg-gray-50/50 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => navigate('/school/notifications')}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-primary flex items-center justify-center shrink-0">
                      <Megaphone size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-deep-purple block leading-tight">{notice.title}</span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          {notice.publishedAt || notice.createdAt
                            ? new Date(notice.publishedAt || notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                            : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-450 font-bold truncate mt-1">
                        {notice.body || notice.content || notice.summary || ''}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Bid Progress Banner - hidden until procurement API exists */}

        </div>

        {/* ============================================================== */}
        {/* ORIGINAL: INSTITUTIONAL BULK MARKETPLACE BENEATH */}
        {/* ============================================================== */}
        <div className="border-t border-gray-100/80 mt-2 pt-4">
          
          <div className="mt-4">
            {recentNotices.length > 0 && (
              <div ref={notifRef} className="flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-hide select-none active:cursor-grabbing">
                {recentNotices.slice(0, 2).map((notice) => (
                  <div key={notice._id || notice.id} className="min-w-[280px] bg-primary/10 border border-primary/20 px-4 py-3 rounded-2xl flex items-center gap-3 active:scale-95 transition-all">
                    <Megaphone size={16} className="text-primary shrink-0" />
                    <p className="text-[11px] font-semibold text-deep-purple leading-tight line-clamp-2">
                      {notice.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {packagesLoading ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">Loading packages…</div>
          ) : bulkPackages.length > 0 ? (
            <InstitutionalPackages
              packages={bulkPackages}
              kitsRef={kitsRef}
              onBuyClick={handleBuyKit}
            />
          ) : (
            <div className="px-6 py-8 text-center">
              <Package size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-400">No institutional packages available</p>
            </div>
          )}

          {categoriesLoading ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">Loading categories…</div>
          ) : categories.length > 0 ? (
            <SchoolCategories categories={categories} />
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm font-bold text-gray-400">No categories available</p>
            </div>
          )}

          {productsLoading ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">Loading products…</div>
          ) : products.length > 0 ? (
            <CategoryEssentials
              title="Office & Facility Essentials"
              products={products}
              onViewAll={() => navigate('/school/products')}
            />
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm font-bold text-gray-400">No products available</p>
            </div>
          )}
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
