import React, { useState } from 'react';
import {
  Bell, Search, Filter,
  ChevronDown, Building2, User, X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const SchoolHeader = ({
  childInfo,
  showSearch: propShowSearch,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  searchPlaceholder = 'Search institutional supplies...',
  scrolled,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalQuery, setInternalQuery] = useState('');

  const isControlled = onSearchChange !== undefined;
  const currentSearch = isControlled ? (searchValue ?? '') : internalQuery;

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (isControlled) {
      onSearchChange(val);
    } else {
      setInternalQuery(val);
    }
  };

  const handleClear = () => {
    if (onClearSearch) {
      onClearSearch();
    } else if (isControlled) {
      onSearchChange('');
    } else {
      setInternalQuery('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(currentSearch);
    } else if (!isControlled) {
      const q = currentSearch.trim();
      if (q) {
        navigate(`/school/products?search=${encodeURIComponent(q)}`);
      }
    }
  };

  // Determine if we should show the search bar based on route
  const showSearch = propShowSearch !== undefined
    ? propShowSearch
    : (location.pathname === '/school/admin' ||
      location.pathname === '/school/categories' ||
      location.pathname === '/school/wishlist' ||
      location.pathname === '/school/orders' ||
      location.pathname === '/school/notifications' ||
      location.pathname.includes('/school/category/') ||
      location.pathname.includes('/school/products'));

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] bg-deep-purple py-6 rounded-b-[2.5rem] shadow-xl">
      <div className="px-6 flex flex-col gap-5">
        {/* Top Row: Logo/Identity, Notification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-lg overflow-hidden flex items-center justify-center">
                {childInfo?.schoolLogo || childInfo?.photo ? (
                  <img src={childInfo.schoolLogo || childInfo.photo} alt={childInfo?.school || childInfo?.name || "School Logo"} className="w-full h-full object-cover rounded-lg" />
                ) : childInfo?.school || childInfo?.name ? (
                  // Real identity has loaded, the school just has no logo uploaded —
                  // an honest "no logo" icon, never a generic brand image standing
                  // in for a real school's logo.
                  <div className="w-full h-full rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 size={18} />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-lg bg-white/20 animate-pulse" />
                )}
              </div>
              <div className="flex flex-col">
                <h1 className="text-white font-black text-sm tracking-tight leading-none truncate max-w-[200px]">
                  {childInfo?.school || childInfo?.name || <span className="inline-block h-3 w-24 bg-white/20 rounded animate-pulse" />}
                </h1>
                <span className="text-white/50 text-[8px] font-bold tracking-[0.2em] mt-1 uppercase">SCHOOL PORTAL</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/school/notifications')}
              className="w-10 h-10 rounded-full flex items-center justify-center relative transition-all active:scale-90 bg-white/10 text-white cursor-pointer"
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-deep-purple"></span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Search */}
        {showSearch && (
          <form onSubmit={handleSubmit} className="w-full animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-full relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
              <input
                type="text"
                value={currentSearch}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-full bg-white/10 border border-white/10 rounded-2xl py-3.5 pl-12 pr-11 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/20 focus:border-white/20 transition-all font-medium"
              />
              {currentSearch && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors cursor-pointer p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </header>
  );
};

export default SchoolHeader;
