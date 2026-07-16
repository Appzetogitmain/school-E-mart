import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, GraduationCap, Users, FileText, Calendar,
  ChevronRight, IndianRupee, Megaphone, Package, ShoppingCart,
  Store, Clipboard, Sliders, User, Building, HelpCircle, Key,
  Heart, Search, Wallet, UserPlus, Phone, Info, LogOut, Layers,
  Loader2, BookOpen
} from 'lucide-react';
import AuthPrompt from '../../components/AuthPrompt';
import useAuthStore from '../../../store/useAuthStore';
import { useSchoolId } from '../../../utils/schoolContext';
import { listStudents, listTeachers, listEvents, getSchool } from '../../../services/schoolApi';
import { listSchoolRfqs } from '../../../services/rfqApi';
import { mapSchoolRfqForList } from '../../../utils/mappers/rfqMapper';

const SchoolMorePage = () => {
  const navigate = useNavigate();
  // childInfo is shared with the parent portal — only a school login counts here
  const storedInfo = (() => {
    try {
      const raw = localStorage.getItem('childInfo');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const isGuest = !storedInfo || (storedInfo.role && storedInfo.role !== 'school');
  const user = isGuest ? null : storedInfo;
  const logout = useAuthStore((state) => state.logout);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = React.useState(false);

  const schoolId = useSchoolId();
  const [stats, setStats] = React.useState({
    students: 0,
    teachers: 0,
    pendingQuotes: 0,
    events: 0
  });
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [statsError, setStatsError] = React.useState('');
  const [academicYear, setAcademicYear] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      if (isGuest || !schoolId) {
        setStatsLoading(false);
        return;
      }

      setStatsLoading(true);
      setStatsError('');

      try {
        const [studentsRes, teachersRes, rfqsRes, eventsRes, school] = await Promise.all([
          listStudents(schoolId, { limit: 1 }),
          listTeachers(schoolId, { limit: 1 }),
          listSchoolRfqs(schoolId, { limit: 100 }),
          listEvents(schoolId, { limit: 100 }),
          getSchool(schoolId).catch(() => null)
        ]);

        if (cancelled) return;

        if (school?.academicYearCurrent) {
          setAcademicYear(school.academicYearCurrent);
        }

        const studentsCount = studentsRes.pagination?.total ?? studentsRes.data?.length ?? 0;
        const teachersCount = teachersRes.pagination?.total ?? teachersRes.data?.length ?? 0;
        
        const rfqs = rfqsRes.data || [];
        const requirements = rfqs.map(mapSchoolRfqForList);
        const pendingQuotesCount = requirements.filter((r) => r.status === 'Pending').length;

        const eventsCount = eventsRes.pagination?.total ?? eventsRes.data?.length ?? 0;

        setStats({
          students: studentsCount,
          teachers: teachersCount,
          pendingQuotes: pendingQuotesCount,
          events: eventsCount
        });
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load school stats:', err);
          setStatsError('Unable to load statistics');
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, [schoolId, isGuest]);

  // Navigation configuration sections matching mockup exactly
  const sections = [
    {
      title: 'School Management',
      items: [
        {
          title: 'Classes & Sections',
          desc: 'Create classes, sections and assign class teachers',
          icon: <Layers className="text-emerald-500 stroke-[2.5]" size={18} />,
          bg: 'bg-emerald-50',
          path: '/school/add-class',
          protected: true
        },
        {
          title: 'Students',
          desc: 'View and manage student information',
          icon: <GraduationCap className="text-blue-500 stroke-[2.5]" size={18} />,
          bg: 'bg-blue-50',
          path: '/school/students',
          protected: true
        },
        {
          title: 'Teachers',
          desc: 'Manage teachers and their roles',
          icon: <Users className="text-orange-500 stroke-[2.5]" size={18} />,
          bg: 'bg-orange-50',
          path: '/school/teacher-approvals',
          protected: true
        },
        {
          title: 'Class & Teacher Assignments',
          desc: 'Who teaches which class, subject & class teachers',
          icon: <BookOpen className="text-emerald-600 stroke-[2.5]" size={18} />,
          bg: 'bg-emerald-50',
          path: '/school/teacher-assignments',
          protected: true
        },
        {
          title: 'Parents',
          desc: 'View parent accounts linked via student enrollment',
          icon: <User className="text-indigo-500 stroke-[2.5]" size={18} />,
          bg: 'bg-indigo-50',
          path: '/school/parents',
          protected: true
        }
      ]
    },
    {
      title: 'Procurement',
      items: [
        {
          title: 'Vendors',
          desc: 'Manage vendors and supplier details',
          icon: <Store className="text-emerald-500 stroke-[2.5]" size={18} />,
          bg: 'bg-emerald-50',
          path: '/school/vendors',
          protected: true
        },
        {
          title: 'Requests',
          desc: 'View all uniform requests',
          icon: <Clipboard className="text-blue-500 stroke-[2.5]" size={18} />,
          bg: 'bg-blue-50',
          path: '/school/draft-requests',
          protected: true
        },
        {
          title: 'Quotations',
          desc: 'Review and compare vendor quotations',
          icon: <IndianRupee className="text-amber-500 stroke-[2.5]" size={18} />,
          bg: 'bg-amber-50',
          path: '/school/quotations',
          protected: true
        },
        {
          title: 'Procurement Wishlist',
          desc: 'Save items and kits to procure later',
          icon: <Heart className="text-rose-500 stroke-[2.5]" size={18} />,
          bg: 'bg-rose-50',
          path: '/school/wishlist',
          protected: true
        }
      ]
    },
    {
      title: 'Store Management',
      items: [
        {
          title: 'Kits',
          desc: 'Manage school kits and their items',
          icon: <Package className="text-indigo-500 stroke-[2.5]" size={18} />,
          bg: 'bg-indigo-50',
          path: '/school/kits'
        },
        {
          title: 'Orders',
          desc: 'View and track all orders',
          icon: <ShoppingCart className="text-rose-500 stroke-[2.5]" size={18} />,
          bg: 'bg-rose-50',
          path: '/school/orders',
          protected: true
        },
        {
          title: 'Manage Products',
          desc: 'Search and browse bulk school supplies',
          icon: <Search className="text-blue-500 stroke-[2.5]" size={18} />,
          bg: 'bg-blue-50',
          path: '/school/products'
        }
      ]
    },
    {
      title: 'Communication',
      items: [
        {
          title: 'Notices',
          desc: 'Create and manage notices',
          icon: <Megaphone className="text-orange-500 stroke-[2.5]" size={18} />,
          bg: 'bg-orange-50',
          path: '/school/send-notice',
          protected: true
        },
        {
          title: 'Events & Calendar',
          desc: 'Manage school events and calendar',
          icon: <Calendar className="text-emerald-500 stroke-[2.5]" size={18} />,
          bg: 'bg-emerald-50',
          path: '/school/events',
          protected: true
        }
      ]
    },
    {
      title: 'Partner & Wallet',
      items: [
        {
          title: 'School Wallet',
          desc: 'View transaction logs and check credit balance',
          icon: <Wallet className="text-[#3b2d7d] stroke-[2.5]" size={18} />,
          bg: 'bg-purple-50',
          path: '/school/wallet',
          protected: true
        },
        {
          title: 'Partner Referral',
          desc: 'Refer other schools and earn credits',
          icon: <UserPlus className="text-amber-500 stroke-[2.5]" size={18} />,
          bg: 'bg-amber-50',
          path: '/school/refer',
          protected: true
        }
      ]
    },
    {
      title: 'School Settings',
      items: [
        {
          title: 'School Profile',
          desc: 'Manage school information and branding',
          icon: <Building className="text-purple-600 stroke-[2.5]" size={18} />,
          bg: 'bg-purple-50',
          path: '/school/edit-profile',
          protected: true
        },
        {
          title: 'Change Password',
          desc: 'Update account security password',
          icon: <Key className="text-amber-500 stroke-[2.5]" size={18} />,
          bg: 'bg-amber-50',
          path: '/school/change-password',
          protected: true
        }
      ]
    },
    {
      title: 'Help & Support',
      items: [
        {
          title: 'Contact Us',
          desc: 'Get in touch with relationship manager',
          icon: <Phone className="text-emerald-500 stroke-[2.5]" size={18} />,
          bg: 'bg-emerald-50',
          path: '/school/contact'
        },
        {
          title: 'About Portal',
          desc: 'Learn more about the B2B School Portal',
          icon: <Info className="text-blue-500 stroke-[2.5]" size={18} />,
          bg: 'bg-blue-50',
          path: '/school/about'
        }
      ]
    },
    {
      title: 'Account Session',
      items: [
        {
          title: isGuest ? 'Sign In' : 'Sign Out',
          desc: isGuest ? 'Log into your School Administrator account' : 'Log out of your institutional session',
          icon: <LogOut className={`${isGuest ? 'text-emerald-500' : 'text-rose-500'} stroke-[2.5]`} size={18} />,
          bg: isGuest ? 'bg-emerald-50' : 'bg-rose-50',
          path: '/school/login',
          action: isGuest ? 'login' : 'logout'
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-12 font-outfit">
      
      {/* Top Banner Header */}
      <div className="bg-[#3b2d7d] text-white px-6 py-6 sticky top-0 z-50 rounded-b-[2rem] shadow-lg flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/school/admin')}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-black leading-tight">
              {isGuest ? 'School Portal' : (user?.school || 'School E-Mart')}
            </h1>
            {academicYear && (
              <div className="flex items-center gap-2 mt-1 text-[11px] text-purple-200 font-bold leading-none">
                <span>Academic Year <span className="px-1.5 py-0.5 bg-white/20 rounded font-black text-white ml-0.5">{academicYear}</span></span>
              </div>
            )}
          </div>
        </div>
        
        {/* Help / Support icon */}
        <button
          onClick={() => navigate('/school/contact')}
          aria-label="Help and support"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 text-white/90 active:scale-90 transition-transform"
        >
          <HelpCircle size={22} />
        </button>
      </div>

      {/* Admin Profile Details Strip Card */}
      <div className="px-6 pt-6">
        <div className="bg-gradient-to-r from-purple-50/40 to-indigo-50/20 border border-purple-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-[#3b2d7d] flex items-center justify-center shrink-0">
            <User size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block leading-none">
              {isGuest ? 'School Guest' : 'School Admin'}
            </span>
            <span className="text-sm font-black text-deep-purple block mt-1 leading-none">
              {isGuest ? 'Guest User' : (user?.name || 'Administrator')}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Strip Container */}
      <div className="px-6 pt-5 grid grid-cols-4 gap-2.5">
        
        {/* Stat 1: Students */}
        <div 
          onClick={() => {
            if (isGuest) {
              setIsAuthPromptOpen(true);
            } else {
              navigate('/school/students');
            }
          }}
          className="bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center cursor-pointer hover:bg-gray-50 active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-purple-50 text-[#3b2d7d] flex items-center justify-center mx-auto shrink-0">
            <GraduationCap size={16} />
          </div>
          <span className="text-sm font-black text-deep-purple block mt-2 leading-none">
            {statsLoading ? (
              <span className="flex justify-center items-center py-0.5">
                <Loader2 size={12} className="animate-spin text-[#3b2d7d]" />
              </span>
            ) : (
              (stats.students || 0).toLocaleString()
            )}
          </span>
          <span className="text-[8px] text-gray-400 font-black uppercase block mt-1 tracking-wider">Students</span>
        </div>

        {/* Stat 2: Teachers */}
        <div 
          onClick={() => {
            if (isGuest) {
              setIsAuthPromptOpen(true);
            } else {
              navigate('/school/teacher-approvals');
            }
          }}
          className="bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center cursor-pointer hover:bg-gray-50 active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shrink-0">
            <Users size={16} />
          </div>
          <span className="text-sm font-black text-deep-purple block mt-2 leading-none">
            {statsLoading ? (
              <span className="flex justify-center items-center py-0.5">
                <Loader2 size={12} className="animate-spin text-blue-600" />
              </span>
            ) : (
              (stats.teachers || 0).toLocaleString()
            )}
          </span>
          <span className="text-[8px] text-gray-400 font-black uppercase block mt-1 tracking-wider">Teachers</span>
        </div>

        {/* Stat 3: Pending Quotes */}
        <div 
          onClick={() => {
            if (isGuest) {
              setIsAuthPromptOpen(true);
            } else {
              navigate('/school/draft-requests');
            }
          }}
          className="bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center cursor-pointer hover:bg-gray-50 active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shrink-0">
            <FileText size={16} />
          </div>
          <span className="text-sm font-black text-deep-purple block mt-2 leading-none">
            {statsLoading ? (
              <span className="flex justify-center items-center py-0.5">
                <Loader2 size={12} className="animate-spin text-orange-500" />
              </span>
            ) : (
              (stats.pendingQuotes || 0).toLocaleString()
            )}
          </span>
          <span className="text-[8px] text-gray-400 font-black uppercase block mt-1 tracking-wider">Pending Quotes</span>
        </div>

        {/* Stat 4: Upcoming Events */}
        <div 
          onClick={() => {
            if (isGuest) {
              setIsAuthPromptOpen(true);
            } else {
              navigate('/school/create-event');
            }
          }}
          className="bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-sm text-center cursor-pointer hover:bg-gray-50 active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shrink-0">
            <Calendar size={16} />
          </div>
          <span className="text-sm font-black text-deep-purple block mt-2 leading-none">
            {statsLoading ? (
              <span className="flex justify-center items-center py-0.5">
                <Loader2 size={12} className="animate-spin text-emerald-500" />
              </span>
            ) : (
              (stats.events || 0).toLocaleString()
            )}
          </span>
          <span className="text-[8px] text-gray-400 font-black uppercase block mt-1 tracking-wider">Events</span>
        </div>

      </div>
      {statsError && (
        <div className="px-6 pt-2 text-center">
          <span className="text-[10px] text-rose-500 font-bold">{statsError}</span>
        </div>
      )}

      {/* Settings Sections Grid Navigation */}
      <div className="px-6 py-6 space-y-6">
        
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-3.5">
            <h2 className="text-xs font-black text-[#3b2d7d] uppercase tracking-widest">{sec.title}</h2>
            <div className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-sm divide-y divide-gray-100">
              
              {sec.items.map((item) => (
                <div 
                  key={item.title}
                  onClick={() => {
                    if (item.protected && isGuest) {
                      setIsAuthPromptOpen(true);
                      return;
                    }
                    if (item.action === 'logout') {
                      logout();
                      localStorage.removeItem('childInfo');
                      localStorage.removeItem('wishlist');
                    }
                    if (item.path) navigate(item.path);
                  }}
                  className={`p-4.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-purple-50/10 active:bg-purple-50/20 transition-colors ${item.action === 'logout' ? 'text-red-500 hover:bg-red-50/10' : ''}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-black leading-tight ${item.action === 'logout' ? 'text-red-500' : 'text-deep-purple'}`}>{item.title}</h4>
                      <span className="text-[10px] text-gray-400 font-bold block mt-1">{item.desc}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`shrink-0 ${item.action === 'logout' ? 'text-red-300' : 'text-gray-300'}`} />
                </div>
              ))}

            </div>
          </div>
        ))}

      </div>

      <AuthPrompt
        isOpen={isAuthPromptOpen}
        onClose={() => setIsAuthPromptOpen(false)}
        title="School Login Required"
        message="Please login as an administrator to manage your institutional portal and view procurement records."
      />

    </div>
  );
};

export default SchoolMorePage;
