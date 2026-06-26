import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Package, ShoppingBag,
  Info, CheckCheck, Trash2,
  Clock, ArrowRight, Building2,
  Quote, ShieldCheck, Loader2
} from 'lucide-react';
import SchoolHeader from '../../components/SchoolHeader';
import { listNotices } from '../../../services/schoolApi';
import { useSchoolId } from '../../../utils/schoolContext';
import { getErrorMessage } from '../../../utils/apiHelpers';

const SchoolNotificationsPage = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();
  const [schoolInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : { role: 'school', name: 'School Admin', school: 'School Management' };
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      if (!schoolId) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        const { data } = await listNotices(schoolId, { limit: 20 });
        if (!cancelled) {
          setNotifications(
            (data || []).map((notice) => ({
              id: notice._id || notice.id,
              title: notice.title || 'School Notice',
              message: notice.body || notice.content || notice.summary || '',
              type: 'school',
              isRead: Boolean(notice.isRead || notice.readAt),
              createdAt: notice.publishedAt || notice.createdAt,
              actionLink: '/school/admin',
            }))
          );
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
  }, [schoolId]);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (e, id) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
    <div className="flex flex-col h-full bg-[#f8f5f2] font-outfit">
      <SchoolHeader showSearch={true} childInfo={schoolInfo} />

      <div className="flex-1 overflow-y-auto pt-48 pb-32 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Stay Updated</p>
            <h1 className="text-2xl font-black text-deep-purple tracking-tight">Institutional Notifications</h1>
          </div>
          {notifications.length > 0 && notifications.some((n) => !n.isRead) && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/5 px-4 py-2 rounded-full uppercase tracking-wider active:scale-95 transition-all border border-primary/10"
            >
              <CheckCheck size={14} /> Mark Read
            </button>
          )}
        </div>

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
            <h2 className="text-xl font-black text-deep-purple mb-2">No updates yet</h2>
            <p className="text-gray-400 text-sm max-w-[240px] leading-relaxed">
              We&apos;ll notify you here about bulk orders, vendor quotes, and institutional rewards.
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
                        <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(108,78,255,0.6)]" />
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed mb-4 ${
                      notification.isRead ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        <Clock size={10} /> {formatTime(notification.createdAt)}
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

        <div className="mt-16 text-center pb-20">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Institutional Portal Catch-up</p>
          <div className="flex items-center justify-center gap-5">
            <div className="w-10 h-px bg-gray-200" />
            <ShieldCheck size={16} className="text-gray-200" />
            <div className="w-10 h-px bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolNotificationsPage;
