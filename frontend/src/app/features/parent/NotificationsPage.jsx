import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Package, School, ShoppingBag, 
  Info, ChevronLeft, CheckCheck, Trash2,
  Calendar, Clock, ArrowRight
} from 'lucide-react';

const NotificationsPage = () => {
  const navigate = useNavigate();

  // Mock Data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Order Shipped! 🚀",
      message: "Your Complete Class 2 Kit has been handed over to the courier and is on its way.",
      type: "order",
      isRead: false,
      createdAt: "2 hours ago",
      actionLink: "/user/track-order/ORD123"
    },
    {
      id: 2,
      title: "New School Circular",
      message: "St. Xavier's High School has updated the uniform guidelines for the upcoming winter session.",
      type: "school",
      isRead: false,
      createdAt: "5 hours ago",
      actionLink: "/user/my-school"
    },
    {
      id: 3,
      title: "Flash Sale Live!",
      message: "Get 20% off on all school bags and lunch boxes from 'Zappy Sellers'. Ends today!",
      type: "seller",
      isRead: true,
      createdAt: "Yesterday",
      actionLink: "/user/category/bags"
    },
    {
      id: 4,
      title: "Profile Incomplete",
      message: "Complete your child's profile to get more accurate school kit recommendations.",
      type: "admin",
      isRead: true,
      createdAt: "2 days ago",
      actionLink: "/user/edit-profile"
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
      case 'school': return <School className="text-primary" size={20} />;
      case 'seller': return <ShoppingBag className="text-golden-yellow" size={20} />;
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
    <div className="min-h-screen bg-[#F8F7FF] pb-20 font-outfit">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-deep-purple p-1 active:scale-90 transition-all">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black text-deep-purple tracking-tight">Notifications</h1>
        </div>
        {notifications.length > 0 && notifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full uppercase tracking-wider active:scale-95 transition-all"
          >
            <CheckCheck size={12} /> Mark Read
          </button>
        )}
      </div>

      <div className="pt-24 px-6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 flex items-center justify-center mb-6 border border-gray-50">
              <Bell size={40} className="text-gray-200" />
            </div>
            <h2 className="text-xl font-black text-deep-purple mb-2">No notifications yet</h2>
            <p className="text-gray-400 text-sm max-w-[240px] leading-relaxed">
              We'll notify you when something important happens regarding your orders or school.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group relative p-4 rounded-3xl border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                  notification.isRead 
                    ? 'bg-white/60 border-gray-100 opacity-80' 
                    : 'bg-white border-primary/20 shadow-lg shadow-primary/5 ring-1 ring-primary/5'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    notification.isRead ? 'bg-gray-50' : 'bg-primary/10 shadow-inner'
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
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(108,78,255,0.6)]"></span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed mb-3 ${
                      notification.isRead ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        <Clock size={10} /> {notification.createdAt}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => deleteNotification(e, notification.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        {!notification.isRead && (
                          <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest">
                            View <ArrowRight size={10} />
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

        {/* Footer Info */}
        <div className="mt-12 text-center pb-10">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">You're all caught up!</p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-8 h-px bg-gray-200"></div>
            <Bell size={12} className="text-gray-300" />
            <div className="w-8 h-px bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
