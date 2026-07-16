import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight, ArrowLeft, Bell, Info,
  CheckCircle2, ShoppingBag, RotateCcw,
  Megaphone, ShieldCheck, ChevronDown,
  Star, Package, ListChecks, AlertCircle, Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import SectionHeader from '../../components/SectionHeader';
import ProductCard from '../../components/ProductCard';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import LoginRequired from '../../components/LoginRequired';
import AuthPrompt from '../../components/AuthPrompt';
import { getSchool, listNotices } from '../../../services/schoolApi';
import { getChildInfoFromStorage } from '../../../utils/parentContext';
import { useProducts } from '../../../hooks/useProducts';

const MySchoolPage = () => {
  const navigate = useNavigate();
  const kitsRef = useDraggableScroll();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isGuest = !localStorage.getItem('childInfo');
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(isGuest);

  const [childInfo, setChildInfo] = useState(() => {
    const saved = getChildInfoFromStorage();
    return saved || {
      name: 'Guest',
      school: 'Explore Schools',
      grade: 'Select Grade',
      progress: { completed: 0, total: 0 },
    };
  });

  const schoolId = childInfo?.schoolId;
  const { products: recommendedKits, loading: kitsLoading } = useProducts(
    { featured: true, limit: 6 },
    { enabled: Boolean(schoolId) && !isGuest }
  );
  const [announcements, setAnnouncements] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  const loadSchool = useCallback(async () => {
    if (!schoolId) return;
    try {
      const school = await getSchool(schoolId);
      setChildInfo((prev) => ({
        ...prev,
        school: school?.name || prev.school,
      }));
    } catch {
      // keep stored fallback
    }
  }, [schoolId]);

  useEffect(() => {
    loadSchool();
  }, [loadSchool]);

  useEffect(() => {
    let cancelled = false;

    const loadNotices = async () => {
      if (!schoolId || isGuest) {
        setAnnouncements([]);
        setNoticesLoading(false);
        return;
      }

      setNoticesLoading(true);
      try {
        const { data } = await listNotices(schoolId, { limit: 5 });
        if (!cancelled) {
          setAnnouncements(
            (data || []).map((notice) => ({
              id: notice._id || notice.id,
              title: notice.title,
              date: notice.publishedAt || notice.createdAt
                ? new Date(notice.publishedAt || notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : '',
            }))
          );
        }
      } catch {
        if (!cancelled) setAnnouncements([]);
      } finally {
        if (!cancelled) setNoticesLoading(false);
      }
    };

    loadNotices();
    return () => {
      cancelled = true;
    };
  }, [schoolId, isGuest]);

  React.useEffect(() => {
    const handleUpdate = () => {
      const saved = getChildInfoFromStorage();
      if (saved) {
        setChildInfo((prev) => ({
          ...prev,
          name: saved.name || prev.name,
          school: saved.school || prev.school,
          grade: saved.grade || prev.grade,
          schoolId: saved.schoolId || prev.schoolId,
        }));
      }
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const progress = childInfo.progress || { completed: 0, total: 0 };
  const mandatoryItems = [];
  const missingItems = [];

  const renderProductCard = (product) => (
    <ProductCard key={product.id} product={product} />
  );

  return (
    <>
      <AppHeader
        scrolled={scrolled}
        onMenuClick={() => setIsMenuOpen(true)}
        childInfo={childInfo}
      />
      <div
        onScroll={handleScroll}
        className="flex flex-col h-full bg-white pb-32 font-outfit overflow-y-auto"
      >
        <div className="h-[140px] shrink-0"></div>
        
        {isGuest ? (
          <LoginRequired 
            title="School Store Protected"
            message="Please login to see products, notices, and mandatory items specifically for your child's school."
          />
        ) : (
          <>
            <div className="px-6 py-6 bg-gray-50/50 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">
                    {(childInfo.name || '?')[0]}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-deep-purple leading-none mb-1">{childInfo.name}</h2>
                    <span className="text-[11px] text-gray-500 font-medium">{childInfo.grade}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pt-8 space-y-12">
              <section>
                <div className="bg-deep-purple rounded-[2.5rem] p-7 text-white shadow-xl shadow-purple-900/10 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <ListChecks size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold opacity-70 uppercase tracking-widest leading-none">Status</h3>
                        <p className="text-lg font-black tracking-tight">Requirements Checklist</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold opacity-80">{progress.completed} of {progress.total || 0} items completed</span>
                        {progress.total > 0 && (
                          <span className="text-xs font-black text-yellow-400">{((progress.completed / progress.total) * 100).toFixed(0)}%</span>
                        )}
                      </div>
                      {progress.total > 0 ? (
                        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
                            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                          />
                        </div>
                      ) : (
                        <p className="text-xs opacity-70">No checklist items yet for your grade.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader
                  title="Recommended Kits"
                  onViewAll={() => navigate('/user/products')}
                  viewAllLabel="All Kits"
                  className="px-0"
                />
                {kitsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={28} className="animate-spin text-primary" />
                  </div>
                ) : recommendedKits.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-200 rounded-3xl">
                    <Package size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-400">No recommended kits yet</p>
                  </div>
                ) : (
                  <div ref={kitsRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {recommendedKits.map((kit) => (
                      <div key={kit.id} className="min-w-[260px] bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-50 flex flex-col">
                        <div className="h-36 relative bg-gray-50">
                          <img src={kit.image} alt={kit.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                          <h3 className="text-sm font-bold text-deep-purple line-clamp-1">{kit.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-base font-black text-primary">₹{kit.price?.toLocaleString?.() || kit.price}</span>
                            <button
                              onClick={() => navigate(`/user/kit/${kit.id}`)}
                              className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-gray-50 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone size={16} className="text-primary" />
                  <h2 className="text-base font-bold text-deep-purple">Notices</h2>
                </div>
                {noticesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : announcements.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No school notices yet.</p>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-deep-purple leading-tight">{msg.title}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold">{msg.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {mandatoryItems.length > 0 && (
                <section>
                  <SectionHeader title="Mandatory Items" className="px-0" />
                  <div className="grid grid-cols-2 gap-3">
                    {mandatoryItems.map((item) => renderProductCard(item))}
                  </div>
                </section>
              )}

              {missingItems.length > 0 && (
                <section>
                  <SectionHeader title="Missing Items" className="px-0" />
                  <div className="grid grid-cols-2 gap-3">
                    {missingItems.map((item) => renderProductCard(item))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </div>
      <AuthPrompt 
        isOpen={isAuthPromptOpen} 
        onClose={() => setIsAuthPromptOpen(false)} 
        title="School Store Protected"
        message="Login to see products, notices, and mandatory items specifically for your child's school."
      />
    </>
  );
};

export default MySchoolPage;
