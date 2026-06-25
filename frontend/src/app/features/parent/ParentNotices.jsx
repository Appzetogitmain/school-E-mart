import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Bell, 
  User, 
  Megaphone, 
  Calendar, 
  Sparkles, 
  Paperclip, 
  FileText, 
  Image, 
  ClipboardList, 
  Filter, 
  BookOpen,
  Pin,
  AlertTriangle,
  ArrowRight,
  Clock,
  ArrowUpDown,
  BookMarked
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import LoginRequired from '../../components/LoginRequired';
import { listParentNotices } from '../../../services/parentApi';
import { mapNoticeForParent } from '../../../utils/mappers/parentMapper';
import { getErrorMessage } from '../../../utils/apiHelpers';

const NOTICE_ICONS = {
  megaphone: <Megaphone size={18} />,
  academic: <BookOpen size={18} />,
  event: <Calendar size={18} />,
  urgent: <AlertTriangle size={18} />,
};

const withNoticeIcons = (rows = []) =>
  rows.map((row) => ({
    ...row,
    icon: NOTICE_ICONS[row.iconKey] || NOTICE_ICONS.megaphone,
  }));

const ParentNotices = () => {
  const navigate = useNavigate();

  // Helper functions to generate dynamic relative dates
  const getLocalDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDateNDaysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return getLocalDateString(d);
  };

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getLocalDateString(yesterday);
  }, []);

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    const [yyyy, mm, dd] = dateStr.split('-');
    const dateObj = new Date(yyyy, parseInt(mm) - 1, dd);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parseInt(dd)} ${months[dateObj.getMonth()]} ${yyyy}`;
  };

  // Header Scroll and SideMenu States
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navigation / UI States
  const [activeTab, setActiveTab] = useState('All Notices'); // 'All Notices', 'General', 'Academic', 'Events', 'Urgent'
  const [selectedDateFilter, setSelectedDateFilter] = useState('All Dates'); // 'All Dates', 'Today', 'Yesterday', 'Custom Range'
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null); // For detail modal

  // Custom range selector state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [tempFromDate, setTempFromDate] = useState('');
  const [tempToDate, setTempToDate] = useState('');

  // Student / Child Profile Info
  const [childInfo, setChildInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : {
      name: "Guest",
      school: "Explore Schools",
      grade: "Select Grade",
      rollNo: "Roll Number",
    };
  });

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('childInfo');
      if (saved) setChildInfo(JSON.parse(saved));
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const loadNotices = async () => {
      const schoolId = childInfo?.schoolId;
      const studentId = childInfo?.studentId;
      if (!schoolId || schoolId === 'explore-schools') {
        setNotices([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError('');
      try {
        const { data } = await listParentNotices(schoolId, {
          limit: 50,
          studentId,
        });
        setNotices(withNoticeIcons((data || []).map(mapNoticeForParent)));
      } catch (err) {
        setNotices([]);
        setFetchError(getErrorMessage(err, 'Unable to load notices'));
      } finally {
        setLoading(false);
      }
    };

    loadNotices();
  }, [childInfo]);

  // Tab Filtering Logic
  // Tabs: All Notices, General, Academic, Events, Urgent
  const filteredByTab = useMemo(() => {
    if (activeTab === 'All Notices') return notices;
    if (activeTab === 'General') return notices.filter(e => e.type === 'general');
    if (activeTab === 'Academic') return notices.filter(e => e.type === 'academic');
    if (activeTab === 'Events') return notices.filter(e => e.type === 'event');
    if (activeTab === 'Urgent') return notices.filter(e => e.type === 'urgent');
    return notices;
  }, [activeTab, notices]);

  // Dropdown Filtering + Sorting Logic
  const finalFilteredNotices = useMemo(() => {
    let result = filteredByTab;

    // Filter by Date
    if (selectedDateFilter === 'Today') {
      result = result.filter(e => e.date === todayStr);
    } else if (selectedDateFilter === 'Yesterday') {
      result = result.filter(e => e.date === yesterdayStr);
    } else if (selectedDateFilter === 'Custom Range') {
      result = result.filter(e => {
        if (fromDate && e.date < fromDate) return false;
        if (toDate && e.date > toDate) return false;
        return true;
      });
    }
    // Sort Notices
    return [...result].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredByTab, selectedDateFilter, fromDate, toDate, todayStr, yesterdayStr]);

  // Important/Urgent notices specifically for the upper slider panel
  const spotlightNotices = useMemo(() => {
    return notices.filter(n => n.isImportantSpotlight || n.type === 'urgent');
  }, [notices]);

  const isGuest = !localStorage.getItem('childInfo');

  if (isGuest) {
    return (
      <>
        <AppHeader
          scrolled={scrolled}
          onMenuClick={() => setIsMenuOpen(true)}
          childInfo={null}
          transparentAtTop={false}
        />
        <div className="flex flex-col h-full bg-white pb-32 font-outfit overflow-y-auto">
          <div className="h-[140px] shrink-0"></div>
          <LoginRequired 
            title="Notices Protected"
            message="Please login to view school announcements, urgent notice spotlight alerts and department updates."
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Dynamic Global Side Drawer Navigation */}
      
      {/* Dynamic Global Custom Header */}
      <AppHeader
        scrolled={scrolled}
        onMenuClick={() => setIsMenuOpen(true)}
        childInfo={childInfo}
        transparentAtTop={false}
      />

      <div 
        onScroll={handleScroll}
        className="flex flex-col h-full bg-[#FAFAFC] pb-24 overflow-y-auto overflow-x-hidden w-full font-outfit relative"
      >
        {/* Sticky AppHeader Spacer */}
        <div className="h-[140px] shrink-0"></div>

        {/* 1. Horizontal Navigation Tabs */}
        <div className="px-6 mt-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2.5 min-w-max pb-1">
            {[
              { id: 'All Notices', label: 'All Notices', icon: <ClipboardList size={14} /> },
              { id: 'General', label: 'General', icon: <Megaphone size={14} /> },
              { id: 'Academic', label: 'Academic', icon: <BookOpen size={14} /> },
              { id: 'Events', label: 'Events', icon: <Calendar size={14} /> },
              { id: 'Urgent', label: 'Urgent', icon: <AlertTriangle size={14} /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl text-[11px] font-extrabold border transition-all duration-300 ${
                    isActive
                      ? 'bg-[#6A47DE] border-[#6A47DE] text-white shadow-lg shadow-[#6A47DE]/20 scale-105'
                      : 'bg-white border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Interactive Dropdown Filters Bar */}
        <div className="px-6 mt-4 flex items-center relative z-20">
          {/* Date Selector */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
              }}
              className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl flex items-center gap-2 text-[10px] font-black text-gray-600 shadow-sm hover:border-gray-200 active:scale-[0.98] transition-all"
            >
              <Calendar size={12} className="text-gray-400 shrink-0" />
              <span>{selectedDateFilter === 'Custom Range' ? 'Custom' : selectedDateFilter}</span>
              <ChevronDown size={11} className="text-gray-400 shrink-0" />
            </button>
            
            {showDateDropdown && (
              <div className="absolute left-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 p-4 animate-fade-in text-[10px] font-black text-gray-600 w-[240px]">
                <div className="flex flex-col gap-1 mb-3 pb-2 border-b border-gray-50">
                  <span className="text-[8px] uppercase text-gray-400 font-extrabold tracking-wider">Quick Select</span>
                  {['All Dates', 'Today', 'Yesterday'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSelectedDateFilter(opt);
                        setFromDate('');
                        setToDate('');
                        setShowDateDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#6A47DE]/5 hover:text-[#6A47DE] transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[8px] uppercase text-gray-400 font-extrabold tracking-wider">Custom Range</span>
                  <input 
                    type="date"
                    value={tempFromDate}
                    onChange={(e) => setTempFromDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[10px]"
                  />
                  <input 
                    type="date"
                    value={tempToDate}
                    onChange={(e) => setTempToDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[10px]"
                  />
                  <button
                    onClick={() => {
                      if (tempFromDate || tempToDate) {
                        setFromDate(tempFromDate);
                        setToDate(tempToDate);
                        setSelectedDateFilter('Custom Range');
                      }
                      setShowDateDropdown(false);
                    }}
                    className="w-full py-1.5 bg-[#6A47DE] text-white rounded-lg font-black transition-all mt-1"
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backdrop clicks close active dropdown */}
        {showDateDropdown && (
          <div 
            onClick={() => {
              setShowDateDropdown(false);
            }} 
            className="fixed inset-0 z-10 bg-transparent"
          />
        )}

        {/* 3. Important Notices Spotlight Header & Section */}
        {spotlightNotices.length > 0 && (
          <div className="mt-6 px-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[#6A47DE]">
                <Megaphone size={16} className="animate-bounce" />
                <h2 className="text-sm font-extrabold text-gray-800">Important Notices</h2>
              </div>
              <button 
                onClick={() => {
                  setActiveTab('Urgent');
                }}
                className="text-xs font-bold text-[#6A47DE] hover:underline"
              >
                View All
              </button>
            </div>

            {/* Spotlight Card */}
            {spotlightNotices.map((spot) => (
              <div 
                key={spot.id}
                onClick={() => setSelectedNotice(spot)}
                className="w-full bg-[#FFF5F5] border border-[#FEE2E2] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden cursor-pointer"
              >
                {/* Warning background design ring */}
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#EF4444]/5 rounded-full blur-lg pointer-events-none"></div>

                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#EF4444] text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                    {spot.category}
                  </span>
                  <span className="text-[10px] font-black text-gray-400">
                    {spot.dateText}
                  </span>
                </div>

                <div className="flex gap-4">
                  {/* Circle Megaphone Icon badge */}
                  <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] shrink-0 shadow-sm border border-[#FCA5A5]/20">
                    {spot.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-black text-gray-800 tracking-tight leading-snug">
                      {spot.title}
                    </h3>
                    <p className="text-[11px] font-bold text-gray-500 leading-relaxed mt-1 line-clamp-2">
                      {spot.content}
                    </p>
                    
                    {spot.warning && (
                      <p className="text-[10px] font-black text-[#EF4444] mt-2 flex items-center gap-1">
                        <AlertTriangle size={12} className="shrink-0 animate-pulse" />
                        <span>{spot.warning}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#FCA5A5]/25 flex items-center justify-between text-[10px] font-black text-gray-400">
                  <div className="flex items-center gap-1.5">
                    {spot.attachments && (
                      <>
                        <Paperclip size={11} className="text-gray-400" />
                        <span className="text-gray-500 font-semibold">{spot.attachments}</span>
                      </>
                    )}
                  </div>
                  <span className="text-[#6A47DE] hover:text-[#5532C8] transition-colors flex items-center gap-0.5 font-black uppercase tracking-wider text-[9px]">
                    View Notice <ChevronRight size={10} strokeWidth={2.5} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. All Notices Feed Section */}
        <div className="mt-6 px-6 flex flex-col gap-4">
          <h2 className="text-sm font-extrabold text-gray-800 tracking-tight">All Notices</h2>
          
          {loading ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm py-14">
              <Megaphone size={40} className="text-gray-300 mb-2.5 animate-pulse" />
              <h4 className="text-xs font-extrabold text-gray-700">Loading Notices...</h4>
            </div>
          ) : finalFilteredNotices.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm py-14">
              <Megaphone size={40} className="text-gray-300 mb-2.5" />
              <h4 className="text-xs font-extrabold text-gray-700">No Notices Posted</h4>
              <p className="text-[10px] font-bold text-gray-400 mt-1 max-w-[200px] leading-normal">
                {fetchError || 'School notices from your child\'s school will appear here once published.'}
              </p>
              <button 
                onClick={() => {
                  setActiveTab('All Notices');
                  setSelectedDateFilter('All Dates');
                  setFromDate('');
                  setToDate('');
                }}
                className="mt-4 px-4 py-2 bg-[#6A47DE] text-white text-[10px] font-black rounded-lg hover:bg-[#5532C8] transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            finalFilteredNotices.map((notice) => (
              <div 
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="bg-white border border-gray-100 rounded-3xl p-4 flex gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-gray-200/60 transition-all duration-300 cursor-pointer relative"
              >
                {/* Round Custom Icon Container */}
                <div className={`w-11 h-11 rounded-2xl ${notice.bgColor} ${notice.iconColor} flex items-center justify-center shrink-0 border border-black/[0.01] shadow-sm`}>
                  {notice.icon}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {/* Top line with Date and Pin */}
                  <div className="flex items-center justify-between gap-2 text-gray-400">
                    <span className="text-[10px] font-bold">{notice.dateText}</span>
                    {notice.pinned && (
                      <Pin size={11} className="text-[#6A47DE] fill-[#6A47DE]/20 rotate-45 shrink-0" />
                    )}
                  </div>

                  <h3 className="text-xs font-black text-gray-800 tracking-tight leading-snug mt-1">
                    {notice.title}
                  </h3>
                  
                  <p className="text-[10.5px] font-bold text-gray-500 leading-snug mt-1.5 line-clamp-2 pr-1">
                    {notice.content}
                  </p>

                  {/* Badges footer */}
                  <div className="mt-3 flex items-center justify-between text-[9px] font-extrabold text-gray-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md font-black ${
                        notice.type === 'general' ? 'bg-[#EBFBF0] text-[#34A853]' :
                        notice.type === 'academic' ? 'bg-[#E8F0FE] text-[#1A73E8]' :
                        notice.type === 'event' ? 'bg-[#FFF6ED] text-[#F2994A]' :
                        'bg-[#FFF0F2] text-[#E04F5F]'
                      }`}>
                        {notice.category}
                      </span>
                      
                      {notice.attachments ? (
                        <span className="flex items-center gap-1 text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                          <Paperclip size={10} className="shrink-0" />
                          <span>{notice.attachments}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 font-semibold">--</span>
                      )}
                    </div>

                    <ChevronRight size={14} className="text-gray-400 shrink-0" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Dynamic Notice Detail Modal Sheet */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div 
            onClick={() => setSelectedNotice(null)}
            className="absolute inset-0"
          />
          <div className="bg-white border border-gray-100 rounded-t-[36px] w-full max-w-md p-6 pb-8 shadow-2xl relative z-10 animate-slide-up flex flex-col gap-5">
            {/* Grab Bar */}
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto -mt-2 mb-1 shrink-0" />
            
            {/* Header info */}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl ${selectedNotice.bgColor} ${selectedNotice.iconColor} flex items-center justify-center shrink-0 border border-black/[0.01] shadow-sm`}>
                {selectedNotice.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {selectedNotice.category}
                  </span>
                  {selectedNotice.pinned && (
                    <span className="px-2 py-0.5 rounded-lg bg-[#6A47DE]/10 text-[#6A47DE] text-[9px] font-black leading-none shrink-0 border border-[#6A47DE]/20">
                      Pinned
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-extrabold text-gray-800 leading-snug tracking-tight mt-1">
                  {selectedNotice.title}
                </h3>
              </div>
            </div>

            {/* Time / Metadata details card */}
            <div className="bg-[#FAFAFC] border border-gray-50 rounded-2xl p-4 flex flex-col gap-2.5 text-[11px] font-extrabold text-gray-400">
              <div className="flex items-center justify-between">
                <span>Date Published</span>
                <span className="text-gray-600 font-semibold">
                  {formatDateHeader(selectedNotice.date)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200/50 pt-2.5">
                <span>Department</span>
                <span className="text-[#6A47DE] font-extrabold">School Administration</span>
              </div>
            </div>

            {/* Content text */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Notice Announcement</span>
              <p className="text-xs font-bold text-gray-600 leading-relaxed bg-[#FAFAFC] p-4 rounded-2xl border border-gray-50/50 max-h-48 overflow-y-auto">
                {selectedNotice.content}
              </p>
              {selectedNotice.warning && (
                <p className="text-[10px] font-extrabold text-[#EF4444] bg-red-50 border border-red-100 p-3.5 rounded-xl flex items-start gap-2.5 mt-1 leading-snug">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{selectedNotice.warning}</span>
                </p>
              )}
            </div>

            {/* Attachments trigger */}
            {selectedNotice.attachments && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Attached Documents</span>
                <button 
                  onClick={() => alert(`Downloading attached document for: ${selectedNotice.title}`)}
                  className="w-full bg-[#EBFBF0] border border-[#D1F2D9] text-[#34A853] py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <Paperclip size={14} />
                  <span>Download Attachment ({selectedNotice.attachments})</span>
                </button>
              </div>
            )}

            {/* Actions button */}
            <div className="flex gap-3 mt-1 shrink-0">
              <button 
                onClick={() => setSelectedNotice(null)}
                className="flex-1 py-3.5 bg-gray-50 border border-gray-100 text-xs font-black text-gray-600 rounded-2xl hover:bg-gray-100 transition-colors active:scale-95 text-center"
              >
                Close Notice
              </button>
              <button 
                onClick={() => alert(`Acknowledge Notice: ${selectedNotice.title}`)}
                className="flex-1 py-3.5 bg-[#6A47DE] text-white text-xs font-black rounded-2xl hover:bg-[#5532C8] transition-colors active:scale-95 text-center shadow-lg shadow-[#6A47DE]/20"
              >
                Mark as Read
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ParentNotices;
