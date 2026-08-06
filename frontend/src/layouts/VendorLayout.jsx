import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, FileText, Package, BookOpen,
  Tag, CreditCard, Wallet, RotateCcw, MessageSquare, Megaphone,
  BarChart3, Settings, HelpCircle, ChevronDown, ChevronRight, ChevronLeft,
  Menu, Bell, User, MoreVertical, CheckCircle2, Clock3, ShieldAlert, LogOut, X, ShoppingCart
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationApi';

const formatNotificationTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// The sidebar identity badge must reflect the vendor's real Super Admin
// approval status — it used to say "Verified Vendor" unconditionally, so a
// brand-new, not-yet-approved registrant saw themselves as verified with no
// indication their account was still under review.
const VENDOR_STATUS_BADGE = {
  approved: { label: 'Verified Vendor', className: 'text-emerald-400', icon: CheckCircle2, iconClassName: 'fill-emerald-400/20 text-emerald-400' },
  suspended: { label: 'Account Suspended', className: 'text-red-400', icon: ShieldAlert, iconClassName: 'text-red-400' },
  pending: { label: 'Pending Approval', className: 'text-amber-400', icon: Clock3, iconClassName: 'text-amber-400' },
};

const getVendorStatusBadge = (user) => {
  const status = user?.profile?.approvalStatus;
  return VENDOR_STATUS_BADGE[status] || VENDOR_STATUS_BADGE.pending;
};

const VendorLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const statusBadge = getVendorStatusBadge(user);
  const StatusIcon = statusBadge.icon;

  const handleLogout = () => {
    logout();
    navigate('/vendor/login');
  };

  const [pendingRfqCount, setPendingRfqCount] = useState(0);

  React.useEffect(() => {
    import('../services/rfqApi').then(({ listVendorRfqs }) => {
      listVendorRfqs({ limit: 100 })
        .then((res) => {
          const pending = (res?.data || []).filter((r) => r.status === 'pending').length;
          setPendingRfqCount(pending);
        })
        .catch(() => setPendingRfqCount(0));
    });
  }, []);

  // Real notifications (RFQ invites, order updates, ...) from the shared
  // notification feed — this used to be four hardcoded sample entries with
  // no connection to anything that actually happened on the account.
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const loadNotifications = useCallback(() => {
    setNotificationsLoading(true);
    Promise.all([
      listNotifications({ limit: 6 }).catch(() => ({ data: [] })),
      getUnreadNotificationCount().catch(() => ({ data: { count: 0 } })),
    ])
      .then(([notifResult, countResult]) => {
        setNotifications(notifResult?.data || []);
        setUnreadCount(countResult?.data?.count ?? 0);
      })
      .finally(() => setNotificationsLoading(false));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleOpenNotifications = () => {
    setNotificationDropdownOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id || notification.id);
        setNotifications((prev) =>
          prev.map((n) => ((n._id || n.id) === (notification._id || notification.id) ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Leave it unread client-side if the mark-read call fails — better
        // than claiming it's read when the server never recorded that.
      }
    }
    setNotificationDropdownOpen(false);
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore — the dropdown just won't reflect it until next load.
    }
  };

  // Define sidebar menu structure
  const sidebarItems = [
    { 
      label: 'Dashboard', 
      path: '/vendor/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      label: 'Orders', 
      path: '/vendor/orders', 
      icon: ShoppingBag
    },
    { 
      label: 'Quotations', 
      path: '/vendor/quotations', 
      icon: FileText, 
      badge: pendingRfqCount > 0 ? pendingRfqCount : null
    },
    { 
      label: 'Products', 
      path: '/vendor/products', 
      icon: Package
    },
    { 
      label: 'Stock', 
      path: '/vendor/price-stock', 
      icon: Tag
    },
    { 
      label: 'Returns', 
      path: '/vendor/returns', 
      icon: RotateCcw 
    },
    { 
      label: 'Money Requests', 
      path: '/vendor/payments', 
      icon: CreditCard 
    },
    { 
      label: 'Payment History', 
      path: '/vendor/wallet', 
      icon: FileText 
    },
    { 
      label: 'Profile', 
      path: '/vendor/profile', 
      icon: User 
    }
  ];

  const toggleSubmenu = (label) => {
    if (openSubmenu === label) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(label);
    }
  };

  const handleItemClick = (item) => {
    if (item.hasSubmenu) {
      if (isCollapsed) {
        setIsCollapsed(false);
      }
      toggleSubmenu(item.label);
    } else {
      navigate(item.path);
      setIsMobileOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FC] font-sans antialiased text-gray-900">
      
      {/* 1. SIDEBAR / SIDE PANEL */}
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out bg-[#2E1E6B] text-white shadow-xl ${
          isCollapsed ? 'w-20' : 'w-[260px]'
        }`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-900/30">
              <ShoppingCart size={18} className="text-[#2E1E6B]" strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-tight animate-fade-in">
                <span className="font-extrabold text-base tracking-tight text-white">School E-MART</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Vendor Panel</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto no-scrollbar space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.submenuItems?.some(sub => location.pathname === sub.path));
            const isSubmenuOpen = openSubmenu === item.label;

            return (
              <div key={item.label} className="w-full">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium ${
                    isActive 
                      ? 'bg-white/12 text-white font-semibold' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  
                  {!isCollapsed && (
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="bg-[#FF4A55] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-[#FF4A55]/20 animate-scale-in">
                          {item.badge}
                        </span>
                      )}
                      {item.hasSubmenu && (
                        <ChevronDown 
                          size={14} 
                          className={`text-white/40 group-hover:text-white transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`} 
                        />
                      )}
                    </div>
                  )}
                </button>

                {/* Submenu Dropdown */}
                {!isCollapsed && item.hasSubmenu && isSubmenuOpen && (
                  <div className="mt-1 ml-9 space-y-1 border-l border-white/10 pl-3 animate-fade-in">
                    {item.submenuItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <button
                          key={subItem.label}
                          onClick={() => navigate(subItem.path)}
                          className={`w-full text-left py-1.5 px-3 rounded-lg text-xs transition-colors ${
                            isSubActive 
                              ? 'text-white font-semibold' 
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {subItem.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer User Section */}
        <div className="p-4 border-t border-white/5 bg-[#251759]">
          <div className="flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-200 shrink-0">
                <User size={18} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex flex-col leading-tight animate-fade-in text-left">
                  <span className="text-sm font-bold text-white truncate">{user?.profile?.storeName || user?.name || 'Vendor Store'}</span>
                  <span className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${statusBadge.className}`}>
                    <StatusIcon size={10} className={statusBadge.iconClassName} />
                    {statusBadge.label}
                  </span>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
                
                {profileDropdownOpen && (
                  <div className="absolute bottom-12 right-0 w-48 bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-scale-in">
                    <button 
                      onClick={() => { navigate('/vendor/settings'); setProfileDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={14} /> Settings
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Menu for smaller screens) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-[260px] bg-[#2E1E6B] text-white flex flex-col h-full shadow-2xl animate-fade-in">
            {/* Logo Section */}
            <div className="h-20 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/30">
                  <ShoppingCart size={18} className="text-[#2E1E6B]" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-extrabold text-base tracking-tight text-white">School E-MART</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Vendor Panel</span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.submenuItems?.some(sub => location.pathname === sub.path));
                const isSubmenuOpen = openSubmenu === item.label;

                return (
                  <div key={item.label} className="w-full">
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium ${
                        isActive 
                          ? 'bg-white/12 text-white font-semibold' 
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-white/60'}`} />
                        <span>{item.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="bg-[#FF4A55] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-[#FF4A55]/20">
                            {item.badge}
                          </span>
                        )}
                        {item.hasSubmenu && (
                          <ChevronDown 
                            size={14} 
                            className={`text-white/40 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} 
                          />
                        )}
                      </div>
                    </button>

                    {item.hasSubmenu && isSubmenuOpen && (
                      <div className="mt-1 ml-9 space-y-1 border-l border-white/10 pl-3">
                        {item.submenuItems.map((subItem) => {
                          const isSubActive = location.pathname === subItem.path;
                          return (
                            <button
                              key={subItem.label}
                              onClick={() => { navigate(subItem.path); setIsMobileOpen(false); }}
                              className={`w-full text-left py-1.5 px-3 rounded-lg text-xs transition-colors ${
                                isSubActive 
                                  ? 'text-white font-semibold' 
                                  : 'text-white/60 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {subItem.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Sidebar Footer User Section */}
            <div className="p-4 border-t border-white/5 bg-[#251759]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-200">
                    <User size={18} />
                  </div>
                  <div className="flex flex-col leading-tight text-left">
                    <span className="text-sm font-bold text-white">{user?.profile?.storeName || user?.name || 'Vendor Store'}</span>
                    <span className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${statusBadge.className}`}>
                      <StatusIcon size={10} className={statusBadge.iconClassName} />
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center px-4 md:px-8 justify-between sticky top-0 z-40">
          {/* Header Left */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100 md:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Navigation links matching the mockup */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/vendor/orders" className="text-sm font-semibold text-gray-600 hover:text-[#5B3FD6] transition-colors">Orders</Link>
              <Link to="/vendor/quotations" className="text-sm font-semibold text-gray-600 hover:text-[#5B3FD6] transition-colors">Quotations</Link>
              <Link to="/vendor/products" className="text-sm font-semibold text-gray-600 hover:text-[#5B3FD6] transition-colors">Products</Link>
              <Link to="/vendor/reports" className="text-sm font-semibold text-gray-600 hover:text-[#5B3FD6] transition-colors">Reports</Link>
            </nav>
          </div>

          {/* Header Right */}
          <div className="flex items-center gap-4">
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={handleOpenNotifications}
                className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-[#5B3FD6] transition-all relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#FF4A55] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-scale-in">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="font-bold text-sm">Notifications</span>
                    {notifications.some((n) => !n.isRead) && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-[#5B3FD6] font-bold cursor-pointer hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="py-6 flex items-center justify-center text-gray-400 text-xs font-bold">Loading…</div>
                    ) : notifications.length === 0 ? (
                      <div className="py-6 text-center text-gray-400 text-xs font-bold">No notifications yet.</div>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          type="button"
                          key={notif._id || notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className="w-full flex gap-2.5 text-left text-xs p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-gray-200' : 'bg-[#5B3FD6]'}`}></span>
                          <div className="flex-1 min-w-0">
                            <p className={`truncate ${notif.isRead ? 'text-gray-600 font-semibold' : 'text-gray-800 font-bold'}`}>{notif.title}</p>
                            <p className="text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.body}</p>
                            <span className="text-[9px] text-gray-400 font-medium block mt-1">{formatNotificationTime(notif.createdAt)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Section */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 pl-3 pr-2 py-1.5 bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-xl transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-[#5B3FD6] flex items-center justify-center text-white font-extrabold text-xs shadow-md shadow-purple-200 shrink-0">
                  {(user?.name || 'V').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="font-bold text-xs text-gray-800">{user?.name || 'Vendor'}</span>
                  <span className="text-[9px] font-bold text-gray-400">{user?.profile?.storeName || user?.name || 'Vendor Store'}</span>
                </div>
                <ChevronDown size={14} className="text-gray-400 shrink-0 hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2.5 z-50 animate-scale-in">
                  <div className="px-3 py-2 mb-1 text-xs border-b border-gray-50 text-left">
                    <p className="font-extrabold text-gray-800">{user?.name || 'Vendor'}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{user?.email || 'vendor@schoolemart.com'}</p>
                  </div>
                  <button 
                    onClick={() => { navigate('/vendor/profile'); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={14} /> My Profile
                  </button>
                  <button 
                    onClick={() => { navigate('/vendor/settings'); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={14} /> Settings
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Content area */}
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto animate-fade-in overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default VendorLayout;
