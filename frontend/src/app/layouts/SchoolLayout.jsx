import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, GraduationCap, Building2, MoreHorizontal } from 'lucide-react';
import { useCart } from '../context/CartContext';

const SchoolLayout = () => {
  const { totalQuantity } = useCart();
  const location = useLocation();
  const isAuthPage = location.pathname.includes('/school/login') || location.pathname.includes('/school/signup');
  const isProductDetailPage = location.pathname.includes('/school/product/');

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 shadow-2xl relative overflow-hidden flex flex-col font-outfit">
      {/* Dynamic Content Area */}
      <div className={`flex-1 overflow-y-auto ${(!isAuthPage && !isProductDetailPage) ? 'pb-20' : ''}`}>
        <Outlet />
      </div>

      {/* Persistent Institutional Bottom Navigation */}
      {!isAuthPage && !isProductDetailPage && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-4 z-50">
          <div className="flex items-center justify-between">
            <NavItem to="/school/admin" icon={<Home size={22} />} label="Home" />
            <NavItem to="/school/grade" icon={<GraduationCap size={26} />} label="Grade" />
            <NavItem to="/school/categories" icon={<Grid size={22} />} label="Supplies" />
            <NavItem
              to="/school/cart"
              icon={
                <div className="relative">
                  <ShoppingCart size={22} />
                  {totalQuantity > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                      {totalQuantity}
                    </div>
                  )}
                </div>
              }
              label="Bulk Cart"
            />
            <NavItem to="/school/more" icon={<MoreHorizontal size={22} />} label="More" />
          </div>
        </nav>
      )}

      {/* Progress Notch */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary/10 z-[100]"></div>
    </div>
  );
};

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex flex-col items-center gap-1 transition-all duration-300
      ${isActive ? 'text-primary scale-110' : 'text-gray-400 hover:text-gray-600'}
    `}
  >
    <div className="relative">
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </NavLink>
);

export default SchoolLayout;
