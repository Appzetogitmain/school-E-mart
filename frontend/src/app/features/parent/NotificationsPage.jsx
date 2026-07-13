import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Package, School, ShoppingBag,
  Info, ChevronLeft, CheckCheck, Trash2,
  Clock, ArrowRight, Loader2
} from 'lucide-react';
import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationApi,
} from '../../../services/notificationApi';
import useAuthStore from '../../../store/useAuthStore';
import { getErrorMessage } from '../../../utils/apiHelpers';

const mapNotification = (n) => ({
  id: n._id || n.id,
  title: n.title || 'Notification',
  message: n.body || '',
  type: n.type,
  isRead: Boolean(n.isRead),
  createdAt: n.createdAt,
  actionLink: n.actionUrl || null,
});

const NotificationsPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isAuthenticated) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const { data } = await listNotifications({ limit: 20 });
        if (!cancelled) {
          setNotifications((data || []).map(mapNotification));
        }
      } catch (err) {
        if (!cancelled) {
          setNotifications([]);
          setError(getErrorMessage(err, 'Unable to load notifications'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const markAsRead = async (id) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.isRead) return;

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationAsRead(id);
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
    }
  };

  const markAllRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsAsRead();
    } catch {
      setNotifications(previous);
    }
  };

  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotificationApi(id);
    } catch {
      setNotifications(previous);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order_update': return <Package className="text-blue-500" size={20} />;
      case 'school_notice': return <School className="text-primary" size={20} />;
      case 'event': return <School className="text-primary" size={20} />;
      case 'promo': return <ShoppingBag className="text-golden-yellow" size={20} />;
      default: return <Info className="text-gray-400" size={20} />;
    }
  };

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.actionLink) {
      navigate(notification.actionLink);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-20 font-outfit">
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-deep-purple p-1 active:scale-90 transition-all">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black text-deep-purple tracking-tight">Notifications</h1>
        </div>
        {notifications.length > 0 && notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full uppercase tracking-wider active:scale-95 transition-all"
          >
            <CheckCheck size={12} /> Mark Read
          </button>
        )}
      </div>

      <div className="pt-24 px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary mb-4" />
            <p className="text-sm text-gray-400">Loading notifications…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-semibold text-red-500 mb-2">{error}</p>
            <p className="text-xs text-gray-400">Please try again later.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 flex items-center justify-center mb-6 border border-gray-50">
              <Bell size={40} className="text-gray-200" />
            </div>
            <h2 className="text-xl font-black text-deep-purple mb-2">No notifications yet</h2>
            <p className="text-gray-400 text-sm max-w-[240px] leading-relaxed">
              We&apos;ll notify you when something important happens regarding your orders or school.
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
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(108,78,255,0.6)]" />
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed mb-3 ${
                      notification.isRead ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        <Clock size={10} /> {formatTime(notification.createdAt)}
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

        <div className="mt-12 text-center pb-10">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">You&apos;re all caught up!</p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-8 h-px bg-gray-200" />
            <Bell size={12} className="text-gray-300" />
            <div className="w-8 h-px bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
