import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  CalendarCheck, 
  User, 
  GraduationCap,
  ShoppingCart,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const AppLayout = () => {
  const { totalQuantity } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = React.useRef(null);
  
  // Exclude bottom nav on login, signup, storefront product detail pages, and reels page
  const isAuthPage = location.pathname.includes('/user/login') || location.pathname.includes('/user/signup');
  const isProductDetailPage = location.pathname.includes('/user/product/') || location.pathname.includes('/user/reels');
  const isCartOrCheckoutPage = location.pathname.includes('/user/cart') || location.pathname.includes('/user/checkout') || location.pathname.includes('/user/order-success');
  const showCartPill = totalQuantity > 0 && !isAuthPage && !isProductDetailPage && !isCartOrCheckoutPage;

  // Automatically scroll to the top of the container on route navigation
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

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
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden w-full ${(!isAuthPage && !isProductDetailPage) ? 'pb-24' : ''}`}
      >
        <Outlet />
      </div>

      {/* Floating View Cart Pill */}
      {showCartPill && (
        <div className="fixed bottom-20 left-0 right-0 max-w-md px-4 mx-auto z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div 
            onClick={() => navigate('/user/cart')}
            className="w-full bg-gradient-to-r from-[#3B248C] to-[#5B3FD6] text-white px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex items-center justify-between cursor-pointer hover:opacity-95 active:scale-[0.98] transition-all duration-300 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 relative">
                <ShoppingCart size={16} className="text-[#FFC933]" />
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white/20">
                  {totalQuantity}
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black tracking-wide leading-none">View Cart</span>
                <span className="text-[9px] text-white/70 font-bold tracking-wide mt-1 leading-none">
                  {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} added
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#FFC933]">Go to Cart</span>
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center border border-white/10">
                <ChevronRight size={12} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* 4. Learning Tab */}
            <BottomNavItem 
              to="/user/learning-hub" 
              active={getTabStyle('/user/learning-hub')}
              icon={<GraduationCap size={19} />} 
              label="Learning"
              inactiveColor="text-[#E04F5F]"
            />

            {/* 5. Profile Tab */}
            <BottomNavItem 
              to="/user/profile" 
              active={getTabStyle('/user/profile')}
              icon={<User size={19} />} 
              label="Profile"
              inactiveColor="text-[#9B51E0]"
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
