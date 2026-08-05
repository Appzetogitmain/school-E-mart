import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Users, CheckSquare, BookOpen, FileText } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { getMyProfile } from '../../services/parentApi';
import { syncChildInfoToStorage } from '../../utils/mappers/userMapper';

const TeacherLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname.includes('/school/login') || location.pathname.includes('/school/signup');

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // On app load, rebuild childInfo from the server so the header always
  // shows the real school name/logo instead of whatever was last cached in
  // localStorage. Mirrors AppLayout's equivalent refresh for the parent portal.
  React.useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    getMyProfile()
      .then((data) => {
        if (cancelled || !data?.user) return;
        syncChildInfoToStorage({
          ...data.user,
          role: data.user.role,
          childProfile: data.childProfile,
          profile: data.profile,
        });
        window.dispatchEvent(new Event('storage'));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);
  const isDetailsPage = 
    location.pathname.includes('/detail/') || 
    location.pathname.includes('/edit-profile') ||
    location.pathname.includes('/attendance') ||
    location.pathname.includes('/homework') ||
    location.pathname.includes('/diary') ||
    location.pathname.includes('/students/bulk') ||
    location.pathname.includes('/profile') ||
    location.pathname.includes('/notifications');

  // Helper to determine route active state
  const isRouteActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 shadow-2xl relative overflow-hidden flex flex-col font-outfit">
      {/* Dynamic Content Area — bounded above the in-flow nav below, so pages
          never need to reserve space and content can't hide behind the nav. */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Persistent Teacher Bottom Navigation - in-flow flex child (not fixed) */}
      {!isAuthPage && !isDetailsPage && (
        <nav className="shrink-0 bg-white/95 backdrop-blur-xl border-t border-gray-100/60 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] rounded-t-[1.8rem]">
          <div className="flex items-center justify-between">
            <BottomNavItem 
              to="/school/teacher/dashboard" 
              active={isRouteActive('/school/teacher/dashboard')}
              icon={<Home size={20} />} 
              activeColor="text-[#6A47DE]"
              activeBg="bg-[#F4EBFF]"
              inactiveColor="text-[#6A47DE] opacity-65 hover:opacity-100"
            />
            <BottomNavItem 
              to="/school/teacher/students" 
              active={isRouteActive('/school/teacher/students')}
              icon={<Users size={20} />} 
              activeColor="text-[#1A73E8]"
              activeBg="bg-[#E8F0FE]"
              inactiveColor="text-[#1A73E8] opacity-65 hover:opacity-100"
            />
            <BottomNavItem 
              to="/school/teacher/attendance" 
              active={isRouteActive('/school/teacher/attendance')}
              icon={<CheckSquare size={20} />} 
              activeColor="text-[#34A853]"
              activeBg="bg-[#E6F4EA]"
              inactiveColor="text-[#34A853] opacity-65 hover:opacity-100"
            />
            <BottomNavItem 
              to="/school/teacher/homework" 
              active={isRouteActive('/school/teacher/homework')}
              icon={<BookOpen size={20} />} 
              activeColor="text-[#F2994A]"
              activeBg="bg-[#FEF3E6]"
              inactiveColor="text-[#F2994A] opacity-65 hover:opacity-100"
            />
            <BottomNavItem 
              to="/school/teacher/diary" 
              active={isRouteActive('/school/teacher/diary')}
              icon={<FileText size={20} />} 
              activeColor="text-[#E04F5F]"
              activeBg="bg-[#FCE8E6]"
              inactiveColor="text-[#E04F5F] opacity-65 hover:opacity-100"
            />
          </div>
        </nav>
      )}

      {/* Progress Notch */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#6A47DE]/10 z-[100]"></div>
    </div>
  );
};

const BottomNavItem = ({ to, active, icon, activeColor, activeBg, inactiveColor }) => {
  return (
    <NavLink
      to={to}
      className="flex-1 flex justify-center items-center select-none py-1"
    >
      {active ? (
        /* Active Capsule Block with small colorful icon & no text */
        <div className={`rounded-2xl p-3.5 flex items-center justify-center transition-all duration-300 scale-110 shadow-sm ${activeBg} ${activeColor}`}>
          <div className="shrink-0">
            {icon}
          </div>
        </div>
      ) : (
        /* Inactive simple gray icon */
        <div className={`p-3 flex items-center justify-center transition-all duration-200 ${inactiveColor}`}>
          <div className="shrink-0">
            {icon}
          </div>
        </div>
      )}
    </NavLink>
  );
};

export default TeacherLayout;
