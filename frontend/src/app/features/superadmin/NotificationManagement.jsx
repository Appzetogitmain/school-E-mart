import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell, Trash2, Send, Play, X, ChevronRight, CheckCircle, Info
} from 'lucide-react';
import {
  listNotificationCampaigns,
  createNotificationCampaign,
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

// UI audience value -> API payload
const AUDIENCE_PAYLOAD = {
  'All Users': { targetAudience: 'custom_segment', segmentRules: { roles: ['parent', 'vendor', 'school', 'teacher'] } },
  Customer: { targetAudience: 'all_parents' },
  Seller: { targetAudience: 'all_vendors' },
  School: { targetAudience: 'all_schools' },
};

const AUDIENCE_LABEL = {
  all_parents: 'Customer',
  all_vendors: 'Vendor',
  all_schools: 'School',
  specific_users: 'Specific',
  custom_segment: 'All Users',
};

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [selectedUserType, setSelectedUserType] = useState('All Users');
  const [titleInput, setTitleInput] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Filtering / pagination states
  const [filterType, setFilterType] = useState('All');
  const [showCount, setShowCount] = useState('10');
  const [searchQuery, setSearchQuery] = useState('');

  // Floating Toast alert simulator state
  const [activeToast, setActiveToast] = useState(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listNotificationCampaigns({ limit: 50 });
      setNotifications(
        (data || []).map((c) => ({
          id: c._id,
          users: AUDIENCE_LABEL[c.targetAudience] || c.targetAudience,
          title: c.title,
          message: c.messageBody,
          metrics: c.metrics,
          date: c.audit?.createdAt ? new Date(c.audit.createdAt).toLocaleString() : '—',
        }))
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load campaigns'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Send new notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!titleInput.trim() || !messageInput.trim()) {
      alert('Please fill out both notification title and message.');
      return;
    }

    const audience = AUDIENCE_PAYLOAD[selectedUserType] || AUDIENCE_PAYLOAD['All Users'];
    setSending(true);
    try {
      await createNotificationCampaign({
        title: titleInput.trim(),
        messageBody: messageInput.trim(),
        ...audience,
      });
      triggerToast(titleInput, messageInput, selectedUserType);
      setTitleInput('');
      setMessageInput('');
      await loadCampaigns();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to send notification'));
    } finally {
      setSending(false);
    }
  };

  // Trigger floating Toast
  const triggerToast = (title, message, audience) => {
    setActiveToast({ title, message, audience });
    setTimeout(() => {
      setActiveToast(null);
    }, 4500);
  };

  // Trigger a pre-configured Test Notification
  const handleTriggerTest = () => {
    triggerToast(
      '⚡ Quick Test Alert',
      'This is a local preview only — click Send Notification to broadcast for real.',
      'All Users'
    );
  };

  // Filter notification ledger
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'All' ||
      n.users.toLowerCase() === filterType.toLowerCase() ||
      (filterType === 'Vendor' && n.users === 'Seller');

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION WITH BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Notification</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              SYSTEM ALERTS
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Broadcast push bulletins, promotional updates, and alert triggers to user applications.</p>
        </div>
      </div>

      {/* TWO COLUMN GRID PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: SEND NOTIFICATION */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider border-b border-gray-100 pb-3 select-none">
            Send Notification
          </h3>

          <form onSubmit={handleSendNotification} className="space-y-4 text-xs font-bold text-gray-700">
            
            {/* User Type Select */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Select User Type</label>
              <select
                value={selectedUserType}
                onChange={(e) => setSelectedUserType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
              >
                <option value="All Users">All Users</option>
                <option value="Customer">Customers (Parents)</option>
                <option value="Seller">Vendors (Sellers)</option>
                <option value="School">Schools</option>
              </select>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Notification Title</label>
              <input
                type="text"
                required
                placeholder="Enter alert title or summary header..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
            </div>

            {/* Message Input */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Enter Message</label>
              <textarea
                rows="6"
                required
                placeholder="Write full text message to push to target devices..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-semibold"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 select-none space-y-2.5">
              <button
                type="button"
                onClick={handleTriggerTest}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#0B1528] border border-gray-200 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-xs"
              >
                <Play size={13} className="stroke-[2.5]" />
                <span>Test Notification</span>
              </button>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-xs"
              >
                <Send size={13} className="stroke-[2.5]" />
                <span>{sending ? 'Sending…' : 'Send Notification'}</span>
              </button>
            </div>

          </form>

        </div>

        {/* RIGHT COLUMN: VIEW NOTIFICATION LEDGER */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider border-b border-gray-100 pb-3 select-none">
            View Notification
          </h3>

          {/* Filtering row */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-gray-600 select-none pb-2 border-b border-gray-50">
            
            <div className="flex items-center gap-4">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Filter by Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none cursor-pointer font-bold"
                >
                  <option value="All">All</option>
                  <option value="Admin">Admin</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Customer">Customer</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </div>

              {/* Show entry limit */}
              <select
                value={showCount}
                onChange={(e) => setShowCount(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none cursor-pointer font-bold"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="10000">All</option>
              </select>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              />
              <Bell size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

          </div>

          {/* TABLE LOG */}
          <div className="overflow-x-auto border border-gray-150 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                  <th className="px-4 py-3 text-center w-12">Sr No</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Sent / Failed</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400 font-extrabold select-none">
                      Loading campaigns…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-rose-500 font-extrabold select-none">
                      {error}
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400 font-extrabold select-none">
                      No broadcast notifications recorded.
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.slice(0, parseInt(showCount)).map((n, idx) => (
                    <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Sr No */}
                      <td className="px-4 py-4 text-center text-gray-400 font-extrabold tabular-nums select-none">
                        {idx + 1}
                      </td>

                      {/* User Type Badge */}
                      <td className="px-4 py-4 select-none">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider block text-center max-w-[110px] truncate">
                          {n.users === 'Seller' ? 'Vendor' : n.users}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-4 text-gray-900 font-extrabold select-text">
                        {n.title}
                      </td>

                      {/* Message */}
                      <td className="px-4 py-4 text-gray-400 font-medium max-w-[180px] truncate select-text">
                        {n.message}
                      </td>

                      {/* Delivery metrics */}
                      <td className="px-4 py-4 text-gray-500 font-extrabold tabular-nums select-none whitespace-nowrap">
                        <span className="text-emerald-600">{n.metrics?.successful ?? 0}</span>
                        {' / '}
                        <span className="text-rose-500">{n.metrics?.failed ?? 0}</span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-gray-400 font-extrabold tabular-nums select-none whitespace-nowrap">
                        {n.date}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* FLOATING REAL-TIME TEST TOAST ALERT SIMULATOR */}
      {activeToast && createPortal(
        <div className="fixed bottom-6 right-6 z-[99999] animate-slide-in select-none">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-2xl max-w-sm flex items-start gap-4">
            <div className="p-2.5 bg-indigo-600 rounded-xl shrink-0 shadow-md">
              <Bell size={18} className="text-white animate-bounce" />
            </div>
            <div className="text-left space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">
                  Broadcast target: {activeToast.audience === 'Seller' ? 'Vendor' : activeToast.audience}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveToast(null)}
                  className="text-gray-500 hover:text-white transition-all"
                >
                  <X size={14} />
                </button>
              </div>
              <h4 className="text-xs font-black text-white truncate">{activeToast.title}</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed font-semibold select-text break-words">
                {activeToast.message}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FOOTER COPYRIGHT BAR */}
      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">School E-Mart</span>
        </p>
      </div>

    </div>
  );
};

export default NotificationManagement;
