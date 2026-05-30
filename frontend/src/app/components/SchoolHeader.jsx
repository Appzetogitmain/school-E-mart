import {
  Bell, Search, Filter,
  ChevronDown, Building2, User
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const SchoolHeader = ({ childInfo, showSearch: propShowSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we should show the search bar based on route
  const showSearch = propShowSearch !== undefined
    ? propShowSearch
    : (location.pathname === '/school/admin' ||
      location.pathname === '/school/categories' ||
      location.pathname === '/school/wishlist' ||
      location.pathname === '/school/orders' ||
      location.pathname === '/school/notifications' ||
      location.pathname.includes('/school/products'));

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] bg-deep-purple py-6 rounded-b-[2.5rem] shadow-xl">
      <div className="px-6 flex flex-col gap-5">
        {/* Top Row: Logo/Identity, Notification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl p-1.5 shadow-lg">
                <img src="/assets/logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-white font-black text-sm tracking-tight leading-none">SCHOOL E-MART</h1>
                <span className="text-white/50 text-[8px] font-bold tracking-[0.2em] mt-1">SCHOOL PORTAL</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/school/notifications')}
              className="w-10 h-10 rounded-full flex items-center justify-center relative transition-all active:scale-90 bg-white/10 text-white"
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-deep-purple"></span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Search */}
        {showSearch && (
          <div className="w-full animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-full relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search institutional supplies..."
                className="w-full bg-white/10 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/20 focus:border-white/20 transition-all font-medium"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default SchoolHeader;
