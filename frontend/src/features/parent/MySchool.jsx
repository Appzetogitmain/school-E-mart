import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  ChevronDown,
  Bell,
  Package,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Truck,
  Building,
  History,
  Loader2,
} from 'lucide-react';
import ProductCard from '../../components/ui/ProductCard';
import useAuthStore from '../../store/useAuthStore';
import LoginPromptModal from '../../components/shared/LoginPromptModal';
import { listSchools, getSchool, listNotices, listClasses } from '../../services/schoolApi';
import { getChildInfoFromStorage } from '../../utils/parentContext';
import { useProducts } from '../../hooks/useProducts';
import { getErrorMessage } from '../../utils/apiHelpers';

const MySchool = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [grades, setGrades] = useState([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const schoolId = selectedSchool?.id;

  const { products: recommendedKits, loading: kitsLoading } = useProducts(
    { featured: true, limit: 4 },
    { enabled: Boolean(schoolId), mapperKey: 'marketing' }
  );
  const { products: essentialProducts, loading: essentialsLoading } = useProducts(
    { limit: 6, sort: 'popular' },
    { enabled: Boolean(schoolId), mapperKey: 'marketing' }
  );

  useEffect(() => {
    let cancelled = false;

    listSchools({ limit: 50 })
      .then(({ data }) => {
        if (cancelled) return;
        const mapped = (data || []).map((school) => ({
          id: school._id || school.id,
          name: school.name,
          code: school.code || school.schoolCode || '',
          city: school.city || school.address?.city || '',
        }));
        setSchools(mapped);

        const childInfo = getChildInfoFromStorage();
        const storedSchoolId = childInfo?.schoolId;
        const match = storedSchoolId
          ? mapped.find((s) => s.id === storedSchoolId)
          : null;
        setSelectedSchool(match || mapped[0] || null);
        if (childInfo?.grade) setSelectedGrade(childInfo.grade);
      })
      .catch((err) => {
        if (!cancelled) {
          setSchools([]);
          setLoadError(getErrorMessage(err, 'Unable to load schools'));
        }
      })
      .finally(() => {
        if (!cancelled) setSchoolsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadGrades = useCallback(async () => {
    if (!schoolId) {
      setGrades([]);
      return;
    }
    try {
      const classes = await listClasses(schoolId);
      const labels = [...new Set((classes || []).map((c) => c.classGrade).filter(Boolean))];
      setGrades(labels);
      if (labels.length > 0 && !selectedGrade) {
        setSelectedGrade(labels[0]);
      }
    } catch {
      setGrades([]);
    }
  }, [schoolId, selectedGrade]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  useEffect(() => {
    let cancelled = false;

    const loadNotices = async () => {
      if (!schoolId) {
        setAnnouncements([]);
        return;
      }

      setNoticesLoading(true);
      try {
        const { data } = await listNotices(schoolId, { limit: 4 });
        if (!cancelled) {
          setAnnouncements(
            (data || []).map((notice) => ({
              id: notice._id || notice.id,
              title: notice.title,
              date: notice.publishedAt || notice.createdAt
                ? new Date(notice.publishedAt || notice.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '',
              content: notice.body || notice.content || notice.summary || '',
              type: notice.priority === 'high' ? 'alert' : 'info',
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
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return undefined;
    let cancelled = false;

    getSchool(schoolId)
      .then((school) => {
        if (cancelled || !school) return;
        setSelectedSchool((prev) => ({
          ...prev,
          name: school.name || prev?.name,
          code: school.code || school.schoolCode || prev?.code,
          city: school.city || school.address?.city || prev?.city,
        }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  const handleProtectedAction = (action, value = null) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (action === 'changeSchool') {
      setSelectedSchool(value);
      setSelectedGrade('');
      setShowSchoolDropdown(false);
    } else if (action === 'changeGrade') {
      setSelectedGrade(value);
    } else if (action === 'findSchool') {
      navigate('/user/profile-setup');
    } else if (action === 'checkout') {
      navigate('/user/cart');
    }
  };

  const schoolName = selectedSchool?.name || 'Select a school';

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <div className="bg-white border-b border-gray-100 sticky top-[128px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 w-full lg:w-auto">
              <div
                onClick={() => !schoolsLoading && setShowSchoolDropdown(!showSchoolDropdown)}
                className="flex items-center gap-4 px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:border-primary transition-all group"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Building size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My School</p>
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">
                    {schoolsLoading ? 'Loading schools…' : schoolName}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 transition-transform ${showSchoolDropdown ? 'rotate-180' : ''}`}
                />
              </div>

              {showSchoolDropdown && schools.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 z-50 max-h-64 overflow-y-auto">
                  {schools.map((school) => (
                    <div
                      key={school.id}
                      onClick={() => handleProtectedAction('changeSchool', school)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                        <GraduationCap size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{school.name}</p>
                        {(school.city || school.code) && (
                          <p className="text-[10px] text-gray-400 font-medium">
                            {[school.city, school.code].filter(Boolean).join(' • ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="p-2 border-t border-gray-50 mt-2">
                    <button
                      onClick={() => handleProtectedAction('findSchool')}
                      className="w-full py-2.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Search size={14} /> Find Another School
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full lg:w-64">
              <div className="relative">
                <select
                  value={selectedGrade}
                  onChange={(e) => handleProtectedAction('changeGrade', e.target.value)}
                  disabled={grades.length === 0}
                  className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all disabled:opacity-50"
                >
                  {grades.length === 0 ? (
                    <option value="">No grades available</option>
                  ) : (
                    grades.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                  <Package size={18} />
                </div>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loadError && (
          <p className="text-sm text-red-500 text-center mb-6">{loadError}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-12">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Bell className="text-accent-orange" size={24} /> School Notices
                </h2>
              </div>
              {noticesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <Bell size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">No school notices yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {announcements.map((notice) => (
                    <div
                      key={notice.id}
                      className={`p-5 rounded-2xl border ${
                        notice.type === 'alert'
                          ? 'bg-orange-50/50 border-orange-100'
                          : 'bg-blue-50/50 border-blue-100'
                      } transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                            notice.type === 'alert' ? 'bg-accent-orange text-white' : 'bg-primary text-white'
                          }`}
                        >
                          {notice.type === 'alert' ? 'Action Required' : 'Update'}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">{notice.date}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">{notice.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{notice.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-primary/5 -mx-4 px-4 sm:mx-0 sm:px-8 py-8 sm:rounded-[2.5rem] border border-primary/10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-deep-purple">Recommended Kits</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Pre-bundled essentials verified by {schoolName}
                  </p>
                </div>
              </div>

              {kitsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
              ) : recommendedKits.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">No recommended kits available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {recommendedKits.map((kit) => (
                    <div key={kit.id} className="relative group">
                      <ProductCard product={kit} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Mandatory Essentials</h2>
              </div>

              {essentialsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
              ) : essentialProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <ShoppingBag size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">No essential products available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {essentialProducts.map((product) => (
                    <div key={product.id} className="relative">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm sticky top-[160px]">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                <History className="text-primary" size={20} /> Smart Checklist
              </h3>

              <div className="text-center py-8 mb-8">
                <CheckCircle2 size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">No checklist items yet</p>
                <p className="text-xs text-gray-400 mt-1">Shopping progress will appear here once available.</p>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Truck size={14} /> Delivery Preferences
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center gap-2 p-3 bg-white border-2 border-primary rounded-xl text-center">
                    <ShoppingBag size={18} className="text-primary" />
                    <span className="text-[10px] font-bold text-primary">School Pickup</span>
                    <span className="text-[8px] text-gray-400">FREE Delivery</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl text-center hover:border-gray-300 transition-all">
                    <Truck size={18} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-700">Home Delivery</span>
                    <span className="text-[8px] text-gray-400">Charges apply</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleProtectedAction('checkout')}
                className="w-full py-4 bg-accent-orange text-deep-purple font-bold rounded-2xl shadow-xl shadow-orange-200 hover:bg-accent-gold transition-all active:scale-95"
              >
                Checkout All Essentials
              </button>
            </div>

            <div className="bg-gray-900 rounded-[2rem] p-8 text-white">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                <History size={20} className="text-accent-orange" /> Buy Again
              </h3>
              <div className="text-center py-8">
                <ShoppingBag size={32} className="text-white/20 mx-auto mb-3" />
                <p className="text-sm font-bold text-white/60">No previous orders</p>
                <p className="text-xs text-white/40 mt-1">Items you&apos;ve ordered will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Please login to personalize your school experience, track your child's shopping progress, and access school-approved bundles."
      />
    </div>
  );
};

export default MySchool;
