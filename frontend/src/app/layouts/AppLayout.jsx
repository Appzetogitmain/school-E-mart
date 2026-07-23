import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  CalendarCheck,
  User,
  GraduationCap,
  ShoppingCart,
  ChevronRight,
  Store,
  Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import useAuthStore from '../../store/useAuthStore';
import { getMyProfile } from '../../services/parentApi';
import { syncChildInfoToStorage } from '../../utils/mappers/userMapper';
import { isSchoolLinked, readChildInfoRaw } from '../../utils/schoolLinked';

const AppLayout = () => {
  const { totalQuantity } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = React.useRef(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // On app load, rebuild childInfo from the server so the header/greeting show
  // the current student (not a stale parent name a prior /auth/me may have
  // written). /users/me always includes the active childProfile.
  React.useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    getMyProfile()
      .then((data) => {
        if (cancelled || !data) return;
        // childProfile is null for unlinked customers — sync anyway so their
        // name/address flow through and school features stay hidden.
        syncChildInfoToStorage({
          ...data.user,
          role: 'parent',
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

  // Track link status so unlinked shoppers get a pure e-commerce bottom nav.
  const [childInfo, setChildInfo] = React.useState(() => readChildInfoRaw());
  React.useEffect(() => {
    const handler = () => setChildInfo(readChildInfoRaw());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  React.useEffect(() => {
    setChildInfo(readChildInfoRaw());
  }, [isAuthenticated, location.pathname]);
  const showEcommerceNav = isAuthenticated && !isSchoolLinked(childInfo);


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
      {/* Dynamic Content Area — the bottom nav below is an in-flow flex child,
          so this scroll region is physically bounded above it. Pages never need
          to reserve space for the nav and content can't hide behind it. */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden w-full"
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

      {/* Persistent Bottom Navigation - in-flow flex child (not fixed) so it
          always reserves its own space and never overlaps page content. */}
      {!isAuthPage && !isProductDetailPage && (
        <nav className="shrink-0 bg-white border-t border-gray-100/60 px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-1">
            {showEcommerceNav ? (
              /* Unlinked shopper — pure e-commerce tabs, no school features */
              <>
                <BottomNavItem to="/user/home" active={getTabStyle('/user/home')} icon={<Home size={19} />} label="Home" inactiveColor="text-[#6A47DE]" />
                <BottomNavItem to="/user/categories" active={getTabStyle('/user/categories')} icon={<Store size={19} />} label="Shop" inactiveColor="text-[#1A73E8]" />
                <BottomNavItem to="/user/cart" active={getTabStyle('/user/cart')} icon={<ShoppingCart size={19} />} label="Cart" inactiveColor="text-[#34A853]" />
                <BottomNavItem to="/user/orders" active={getTabStyle('/user/orders')} icon={<Package size={19} />} label="Orders" inactiveColor="text-[#E04F5F]" />
                <BottomNavItem to="/user/profile" active={getTabStyle('/user/profile')} icon={<User size={19} />} label="Profile" inactiveColor="text-[#9B51E0]" />
              </>
            ) : (
              <>
                <BottomNavItem to="/user/home" active={getTabStyle('/user/home')} icon={<Home size={19} />} label="Home" activeColor="text-[#6A47DE]" inactiveColor="text-[#6A47DE]" />
                <BottomNavItem to="/user/diary" active={getTabStyle('/user/diary')} icon={<BookOpen size={19} />} label="Diary" activeColor="text-[#1A73E8]" inactiveColor="text-[#1A73E8]" />
                <BottomNavItem to="/user/attendance" active={getTabStyle('/user/attendance')} icon={<CalendarCheck size={19} />} label="Attendance" activeColor="text-[#34A853]" inactiveColor="text-[#34A853]" />
                <BottomNavItem to="/user/learning-hub" active={getTabStyle('/user/learning-hub')} icon={<GraduationCap size={19} />} label="Learning" inactiveColor="text-[#E04F5F]" />
                <BottomNavItem to="/user/profile" active={getTabStyle('/user/profile')} icon={<User size={19} />} label="Profile" inactiveColor="text-[#9B51E0]" />
              </>
            )}
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
