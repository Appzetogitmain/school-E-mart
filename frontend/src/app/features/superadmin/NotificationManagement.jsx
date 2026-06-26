import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, Trash2, Send, Play, X, ChevronRight, CheckCircle, Info 
} from 'lucide-react';

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);

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

  // Send new notification
  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!titleInput.trim() || !messageInput.trim()) {
      alert('Please fill out both notification title and message.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-') + ' ' + new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    const newNotif = {
      id: Date.now(),
      users: selectedUserType,
      title: titleInput,
      message: messageInput,
      date: todayStr
    };

    setNotifications(prev => [newNotif, ...prev]);
    
    // Trigger floating preview
    triggerToast(titleInput, messageInput, selectedUserType);

    setTitleInput('');
    setMessageInput('');
  };

  // Delete notification
  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
      'System broadcast link checked. Notifications are functioning correctly!',
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
                <option value="Admin">Admin</option>
                <option value="Seller">Vendor (Seller)</option>
                <option value="Customer">Customer</option>
                <option value="Delivery">Delivery Partner</option>
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
                className="w-full flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-xs"
              >
                <Send size={13} className="stroke-[2.5]" />
                <span>Send Notification</span>
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
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
                {filteredNotifications.length === 0 ? (
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

                      {/* Date */}
                      <td className="px-4 py-4 text-gray-400 font-extrabold tabular-nums select-none whitespace-nowrap">
                        {n.date}
                      </td>

                      {/* Action Delete */}
                      <td className="px-4 py-4 text-center select-none">
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(n.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow-xs transition-all inline-flex items-center justify-center border border-red-600/10"
                        >
                          <Trash2 size={13} className="stroke-[2.5]" />
                        </button>
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
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">Healthy Delight</span>
        </p>
      </div>

    </div>
  );
};

export default NotificationManagement;
