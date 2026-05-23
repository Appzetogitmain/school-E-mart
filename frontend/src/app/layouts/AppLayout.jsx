import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  CalendarCheck, 
  Calendar, 
  Contact 
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const AppLayout = () => {
  const { totalQuantity } = useCart();
  const location = useLocation();
  
  // Exclude bottom nav on login, signup, and storefront product detail pages
  const isAuthPage = location.pathname.includes('/user/login') || location.pathname.includes('/user/signup');
  const isProductDetailPage = location.pathname.includes('/user/product/');

  // Determine active states for high-fidelity tab styling
  const getTabStyle = (path) => {
    if (path === '/user/home') {
      return location.pathname === '/user/home' || location.pathname === '/' || location.pathname === '/user';
    }
    return location.pathname === path;
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 shadow-2xl relative overflow-hidden flex flex-col font-outfit w-full">
      {/* Dynamic Content Area */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden w-full ${(!isAuthPage && !isProductDetailPage) ? 'pb-24' : ''}`}>
        <Outlet />
      </div>

      {/* Persistent Bottom Navigation - Styled exactly like the mockup! */}
      {!isAuthPage && !isProductDetailPage && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100/60 px-4 py-2.5 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-1">
            
            {/* 1. Home Tab */}
            <BottomNavItem 
              to="/user/home" 
              active={getTabStyle('/user/home')}
              icon={<Home size={19} />} 
              label="Home"
              activeColor="text-[#6A47DE]"
              inactiveColor="text-[#6A47DE]"
            />

            {/* 2. Diary Tab */}
            <BottomNavItem 
              to="/user/diary" 
              active={getTabStyle('/user/diary')}
              icon={<BookOpen size={19} />} 
              label="Diary"
              activeColor="text-[#1A73E8]"
              inactiveColor="text-[#1A73E8]"
            />

            {/* 3. Attendance Tab */}
            <BottomNavItem 
              to="/user/attendance" 
              active={getTabStyle('/user/attendance')}
              icon={<CalendarCheck size={19} />} 
              label="Attendance"
              activeColor="text-[#34A853]"
              inactiveColor="text-[#34A853]"
            />

            {/* 4. Calendar Tab */}
            <BottomNavItem 
              to="/user/calendar" 
              active={getTabStyle('/user/calendar')}
              icon={<Calendar size={19} />} 
              label="Calendar"
              activeColor="text-[#F2994A]"
              inactiveColor="text-[#F2994A]"
            />

            {/* 5. Phonebook Tab */}
            <BottomNavItem 
              to="/user/phonebook" 
              active={getTabStyle('/user/phonebook')}
              icon={<Contact size={19} />} 
              label="Phonebook"
              activeColor="text-[#E04F5F]"
              inactiveColor="text-[#E04F5F]"
            />

          </div>
        </nav>
      )}

      {/* Progress Notch for Mobile Browser Emulation */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#6A47DE]/10 z-[100]"></div>
    </div>
  );
};

const BottomNavItem = ({ to, active, icon, label, inactiveColor }) => {
  return (
    <NavLink
      to={to}
      className="flex-1 flex justify-center items-center select-none"
    >
      {active ? (
        /* Active Capsule Block */
        <div className="bg-[#F4EBFF] text-[#6A47DE] rounded-[22px] px-4.5 py-1.5 flex flex-col items-center justify-center scale-100 transition-all duration-300 min-w-[74px]">
          <div className="text-[#6A47DE] shrink-0">
            {icon}
          </div>
          <span className="text-[10px] font-black tracking-tight mt-0.5 leading-none">
            {label}
          </span>
          {/* Active bottom line indicator */}
          <div className="h-[3px] w-6 bg-[#6A47DE] rounded-full mt-1 shrink-0" />
        </div>
      ) : (
        /* Inactive Tab Block */
        <div className="flex flex-col items-center justify-center py-1 transition-all duration-200">
          <div className={`${inactiveColor} shrink-0 opacity-95`}>
            {icon}
          </div>
          <span className="text-[#0C142E] text-[10px] font-bold tracking-tight mt-1 opacity-70 leading-none">
            {label}
          </span>
        </div>
      )}
    </NavLink>
  );
};

export default AppLayout;
