import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Edit2, Heart, School,
  ShoppingBag, Search, UserPlus,
  Wallet, Phone, Info, LogOut, ChevronRight,
  GraduationCap, CalendarCheck, BookOpen, FileText, Bell,
  Hash, Check, Loader2, Users,
} from 'lucide-react';
import AuthPrompt from '../../components/AuthPrompt';
import useAuthStore from '../../../store/useAuthStore';
import { getMyProfile, setActiveChild } from '../../../services/parentApi';
import { syncChildInfoToStorage } from '../../../utils/mappers/userMapper';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [data, setData] = useState(null); // { user, profile, childProfile, children }
  const [switchingId, setSwitchingId] = useState(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);
  const isGuest = !isAuthenticated;

  useEffect(() => {
    if (!isAuthenticated) {
      setData(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMyProfile();
        if (!cancelled && profile) setData(profile);
      } catch {
        if (!cancelled) {
          setData({
            user: { name: authUser?.name, phone: authUser?.phone },
            childProfile: authUser?.childProfile || null,
            children: [],
          });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, authUser]);

  const parent = data?.user || {};
  const childProfile = data?.childProfile || null;
  const children = data?.children || [];
  // Unlinked shoppers (guest-checkout customers) have no student/school.
  const linked = Boolean(
    childProfile?.studentId && childProfile?.schoolId && childProfile.schoolId !== 'explore-schools'
  );

  // Parent names are stored with a trailing " Parent"; trim it for display
  const parentName = (parent.name || 'Parent').replace(/\s+Parent$/i, '');
  const studentName = childProfile?.name || 'Your Child';
  const studentClass = childProfile?.grade
    ? (/^(class|grade|nursery|kg|play)/i.test(childProfile.grade) ? childProfile.grade : `Class ${childProfile.grade}`)
    : null;

  const handleSwitchChild = async (child) => {
    if (!child?.childProfileId || child.childProfileId === childProfile?.childProfileId) return;
    setSwitchingId(child.childProfileId);
    try {
      const fresh = await setActiveChild(child.childProfileId);
      setData(fresh);
      // Re-sync childInfo so the whole app (header, attendance, homework…) follows
      syncChildInfoToStorage({
        ...fresh.user,
        role: 'parent',
        childProfile: fresh.childProfile,
        profile: fresh.profile,
      });
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore — keep current selection
    } finally {
      setSwitchingId(null);
    }
  };

  const quickActions = [
    { icon: <CalendarCheck size={20} />, label: 'Attendance', to: '/user/attendance', color: 'text-[#34A853] bg-[#EBFBF0]' },
    { icon: <BookOpen size={20} />, label: 'Homework', to: '/user/homework', color: 'text-[#F2994A] bg-[#FFF6ED]' },
    { icon: <FileText size={20} />, label: 'Diary', to: '/user/diary', color: 'text-[#1A73E8] bg-[#E8F0FE]' },
    { icon: <Bell size={20} />, label: 'Notices', to: '/user/notices', color: 'text-[#6A47DE] bg-[#F4EBFF]' },
  ];

  const menuItems = [
    { icon: <Edit2 size={20} />, label: 'Edit Profile', to: '/user/edit-profile', protected: true, color: 'text-[#6A47DE] bg-[#F4EBFF]' },
    { icon: <Heart size={20} />, label: 'Wishlist', to: '/user/wishlist', protected: true, color: 'text-red-500 bg-red-50' },
    { icon: <School size={20} />, label: 'My School', to: '/user/my-school', protected: true, color: 'text-blue-500 bg-blue-50' },
    { icon: <ShoppingBag size={20} />, label: 'My Orders', to: '/user/orders', protected: true, color: 'text-green-500 bg-green-50' },
    { icon: <Search size={20} />, label: 'My Products', to: '/user/products', color: 'text-orange-500 bg-orange-50' },
    { icon: <Wallet size={20} />, label: 'Wallet', to: '/user/wallet', protected: true, color: 'text-[#E04F5F] bg-[#FFF0F2]' },
    { icon: <UserPlus size={20} />, label: 'Refer & Earn', to: '/user/refer', protected: true, color: 'text-amber-500 bg-amber-50' },
    { icon: <Phone size={20} />, label: 'Contact us', to: '/user/contact', color: 'text-teal-500 bg-teal-50' },
    { icon: <Info size={20} />, label: 'About Us', to: '/user/about', color: 'text-gray-500 bg-gray-50' },
  ];

  const handleNavigation = (item) => {
    if (item.protected && isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    if (item.to) navigate(item.to);
  };

  const logout = useAuthStore((state) => state.logout);

  const handleAuthAction = async () => {
    if (isGuest) {
      navigate('/user/login');
    } else {
      await logout();
      localStorage.removeItem('childInfo');
      localStorage.removeItem('wishlist');
      window.dispatchEvent(new Event('storage'));
      navigate('/user/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-b border-gray-100 z-30 px-6 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-black text-deep-purple">My Profile</h1>
        <div className="w-10 h-10"></div>
      </div>

      <div className="pt-24 px-6 space-y-5">
        {isGuest ? (
          /* Guest card */
          <div className="bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] rounded-3xl p-6 text-white shadow-xl shadow-purple-900/10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0">
                <User size={36} className="text-gray-400" />
              </div>
              <div>
                <h2 className="text-lg font-black">Guest User</h2>
                <span className="inline-block bg-white/10 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-[#FFC933] border border-[#FFC933]/20 mt-1.5">
                  Limited Access
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {!linked ? (
              /* Unlinked shopper — e-commerce only, no student/school */
              <div className="bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-purple-900/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl pointer-events-none"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/20 shrink-0">
                    <User size={32} className="text-deep-purple/60" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block bg-white/15 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-white/90 mb-1">Shopper</span>
                    <h2 className="text-lg font-black tracking-tight truncate">{parentName}</h2>
                    {parent.phone && <p className="text-white/70 text-[11px] font-semibold mt-1">{parent.phone}</p>}
                  </div>
                </div>
              </div>
            ) : (
            /* 1. STUDENT CARD — first priority */
            <div className="bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-purple-900/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8 blur-xl pointer-events-none"></div>

              <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/20 shrink-0">
                  {childProfile?.photo ? (
                    <img src={childProfile.photo} alt={studentName} className="w-full h-full object-cover" />
                  ) : (
                    <GraduationCap size={34} className="text-deep-purple/60" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="inline-block bg-white/15 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-white/90 mb-1">
                    Student
                  </span>
                  <h2 className="text-lg font-black tracking-tight truncate">{studentName}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {childProfile?.rollNo && (
                      <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Hash size={10} /> Roll {childProfile.rollNo}
                      </span>
                    )}
                    {studentClass && (
                      <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold">{studentClass}</span>
                    )}
                  </div>
                  {childProfile?.schoolName && (
                    <p className="text-white/70 text-[11px] font-semibold mt-1.5 truncate flex items-center gap-1">
                      <School size={11} /> {childProfile.schoolName}
                    </p>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* 2. LINKED CHILDREN — switch active student */}
            {linked && children.length > 1 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 px-1">
                  <Users size={13} className="text-deep-purple" />
                  <h3 className="text-[11px] font-black text-deep-purple uppercase tracking-wider">
                    Linked Children
                  </h3>
                </div>
                <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
                  {children.map((child) => {
                    const active = child.childProfileId === childProfile?.childProfileId;
                    const busy = switchingId === child.childProfileId;
                    return (
                      <button
                        key={child.childProfileId}
                        onClick={() => handleSwitchChild(child)}
                        disabled={busy}
                        className={`shrink-0 min-w-[130px] text-left rounded-2xl p-3 border transition-all active:scale-[0.98] ${
                          active
                            ? 'bg-[#F4EBFF] border-[#D6BBFB] shadow-sm'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-white text-deep-purple' : 'bg-gray-50 text-gray-400'}`}>
                            {busy ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
                          </div>
                          {active && (
                            <span className="w-5 h-5 rounded-full bg-deep-purple text-white flex items-center justify-center">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-black text-gray-800 truncate mt-2">{child.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-0.5 truncate">
                          {child.rollNo ? `Roll ${child.rollNo}` : (child.grade || '—')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. QUICK ACTIONS — on behalf of the student (linked only) */}
            {linked && (
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100/50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-1 mb-3">
                For {studentName.split(' ')[0]}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.to)}
                    className="flex flex-col items-center gap-1.5 py-1.5 active:scale-95 transition-all"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.color}`}>
                      {action.icon}
                    </div>
                    <span className="text-[10px] font-bold text-gray-600">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* 4. PARENT CARD — second priority (linked only; unlinked shopper is
                shown in the header card above) */}
            {linked && (
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F4EBFF] text-deep-purple flex items-center justify-center shrink-0 overflow-hidden">
                {data?.profile?.avatarUrl ? (
                  <img src={data.profile.avatarUrl} alt={parentName} className="w-full h-full object-cover" />
                ) : (
                  <User size={22} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                  Parent Account
                </span>
                <h3 className="text-sm font-black text-gray-800 truncate mt-1">{parentName}</h3>
                {parent.phone && <p className="text-[11px] font-bold text-gray-400">{parent.phone}</p>}
              </div>
              <button
                onClick={() => navigate('/user/edit-profile')}
                className="w-9 h-9 rounded-xl bg-gray-50 text-deep-purple flex items-center justify-center shrink-0 active:scale-90 transition-all"
              >
                <Edit2 size={16} />
              </button>
            </div>
            )}
          </>
        )}

        {/* Menu Items */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100/50 space-y-1">
          {menuItems
            .filter((item) => linked || item.label !== 'My School')
            .map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#F8F7FF] active:bg-[#F0EEFF] rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-gray-700">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        {/* Auth Button */}
        <button
          onClick={handleAuthAction}
          className={`w-full py-4 rounded-2xl text-sm font-black shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 ${
            isGuest
              ? 'bg-primary text-white shadow-primary/10 hover:bg-deep-purple'
              : 'bg-white text-red-500 border border-red-100 shadow-red-100/10 hover:bg-red-50/50'
          }`}
        >
          <LogOut size={18} />
          {isGuest ? 'Sign In to Account' : 'Sign Out'}
        </button>

        <div className="pt-4 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">School E-Mart v1.0.4</p>
        </div>
      </div>

      <AuthPrompt
        isOpen={isAuthPromptOpen}
        onClose={() => setIsAuthPromptOpen(false)}
        title="Account Login Required"
        message="Please login to manage your profile, view order history, and access exclusive member benefits."
      />
    </div>
  );
};

export default ProfilePage;
