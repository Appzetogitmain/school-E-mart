import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Package, ShoppingBag, 
  Info, CheckCheck, Trash2,
  Clock, ArrowRight, Building2,
  Quote, ShieldCheck
} from 'lucide-react';
import SchoolHeader from '../../components/SchoolHeader';
import SchoolSideMenu from '../../components/SchoolSideMenu';

const SchoolNotificationsPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const schoolInfo = { name: "Adarsh Public School", code: "APS-1024" };

  // Mock Data for Schools
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Bulk Order Delivered 📦",
      message: "The order for 100 sets of Class 5 Uniforms has been delivered to your school reception.",
      type: "order",
      isRead: false,
      createdAt: "1 hour ago",
      actionLink: "/school/orders"
    },
    {
      id: 2,
      title: "New Vendor Quote Received",
      message: "Vendor 'Quality Uniforms Ltd' has submitted a competitive quote for your bulk stationery request.",
      type: "quote",
      isRead: false,
      createdAt: "4 hours ago",
      actionLink: "/school/wishlist"
    },
    {
      id: 3,
      title: "Partnership Verified",
      message: "Your school portal partnership has been successfully verified. You can now earn commissions on all parent orders.",
      type: "admin",
      isRead: true,
      createdAt: "Yesterday",
      actionLink: "/school/partner"
    },
    {
      id: 4,
      title: "Institutional Wallet Updated",
      message: "A commission of ₹12,500 from parent orders has been credited to your institutional wallet.",
      type: "wallet",
      isRead: true,
      createdAt: "3 days ago",
      actionLink: "/school/wallet"
    }
  ]);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (e, id) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="text-blue-500" size={20} />;
      case 'quote': return <Quote className="text-amber-500" size={20} />;
      case 'admin': return <ShieldCheck className="text-primary" size={20} />;
      case 'wallet': return <Building2 className="text-emerald-500" size={20} />;
      default: return <Info className="text-gray-400" size={20} />;
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.actionLink) {
      navigate(notification.actionLink);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f5f2] font-outfit">
      <SchoolSideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={schoolInfo} />
      <SchoolHeader 
        showSearch={true} 
        onMenuClick={() => setIsMenuOpen(true)} 
        childInfo={schoolInfo} 
      />

      <div className="flex-1 overflow-y-auto pt-40 pb-32 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Stay Updated</p>
            <h1 className="text-2xl font-black text-deep-purple tracking-tight">Institutional Notifications</h1>
          </div>
          {notifications.length > 0 && notifications.some(n => !n.isRead) && (
            <button 
              onClick={markAllRead}
              className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/5 px-4 py-2 rounded-full uppercase tracking-wider active:scale-95 transition-all border border-primary/10"
            >
              <CheckCheck size={14} /> Mark Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 flex items-center justify-center mb-6 border border-gray-50">
              <Bell size={40} className="text-gray-200" />
            </div>
            <h2 className="text-xl font-black text-deep-purple mb-2">No updates yet</h2>
            <p className="text-gray-400 text-sm max-w-[240px] leading-relaxed">
              We'll notify you here about bulk orders, vendor quotes, and institutional rewards.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group relative p-5 rounded-[2.5rem] border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                  notification.isRead 
                    ? 'bg-white/60 border-gray-100/50' 
                    : 'bg-white border-primary/20 shadow-xl shadow-primary/5 ring-1 ring-primary/5'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    notification.isRead ? 'bg-gray-50' : 'bg-primary/10'
                  }`}>
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-bold truncate ${
                        notification.isRead ? 'text-gray-500' : 'text-deep-purple'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(108,78,255,0.6)]"></span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed mb-4 ${
                      notification.isRead ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        <Clock size={10} /> {notification.createdAt}
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => deleteNotification(e, notification.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        {!notification.isRead && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
                            Review <ArrowRight size={12} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Catch-up */}
        <div className="mt-16 text-center pb-20">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Institutional Portal Catch-up</p>
          <div className="flex items-center justify-center gap-5">
            <div className="w-10 h-px bg-gray-200"></div>
            <ShieldCheck size={16} className="text-gray-200" />
            <div className="w-10 h-px bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolNotificationsPage;
