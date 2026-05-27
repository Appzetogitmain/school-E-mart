import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Bell, 
  User, 
  MessageSquare, 
  Megaphone, 
  Calendar, 
  Sparkles, 
  Paperclip, 
  FileText, 
  Image, 
  ClipboardList, 
  Home, 
  Clock, 
  ArrowLeft, 
  Filter, 
  CheckCircle2,
  BookOpen,
  Info
} from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import LoginRequired from '../../components/LoginRequired';

const ParentDiary = () => {
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
    const [yyyy, mm, dd] = dateStr.split('-');
    const dateObj = new Date(yyyy, parseInt(mm) - 1, dd);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${parseInt(dd)} ${months[dateObj.getMonth()]} ${yyyy}`;
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parseInt(dd)} ${months[parseInt(mm) - 1]}`;
  };

  // Header Scroll and SideMenu States
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navigation / UI States
  const [activeTab, setActiveTab] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All Dates'); // 'All Dates', 'Today', 'Yesterday', 'Custom Range'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All Categories');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null); // For detail modal

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

  // Backend Integration Hook for Diary Entries:
  // Feed fetched API data directly into this hook to automatically populate the diary feed!
  // E.g. setDiaryEntries(apiData)
  const [diaryEntries, setDiaryEntries] = useState([
    {
      id: 'entry-1',
      type: 'message',
      date: getDateNDaysAgo(0),
      title: 'Message from Class Teacher',
      badgeText: 'New',
      badgeColor: 'bg-[#F4EBFF] text-[#7F56D9] border-[#D6BBFB]',
      timestamp: '10:30 AM',
      content: 'Dear Parents, Please encourage your child to complete the Math worksheet. Let know if you need any help.',
      sender: 'Class Teacher',
      accentColor: '#7F56D9',
      bgColor: 'bg-[#F9F5FF]',
      iconColor: 'text-[#7F56D9]',
      icon: <MessageSquare size={18} />
    },
    {
      id: 'entry-2',
      type: 'notice',
      date: getDateNDaysAgo(0),
      title: 'School Notice',
      badgeText: 'Important',
      badgeColor: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
      timestamp: '09:15 AM',
      content: 'School will remain closed on Monday, 26 May 2025 on account of Republic Day.',
      sender: 'Admin',
      accentColor: '#34A853',
      bgColor: 'bg-[#EBFBF0]',
      iconColor: 'text-[#34A853]',
      icon: <Megaphone size={18} />
    },
    {
      id: 'entry-3',
      type: 'event',
      date: getDateNDaysAgo(1),
      title: 'Upcoming Event Reminder',
      badgeText: '',
      badgeColor: '',
      timestamp: '04:30 PM',
      content: 'PTM for Class 5 will be held on 28 May 2025 (Wednesday) from 10:00 AM to 1:00 PM.',
      sender: 'School Admin',
      accentColor: '#1A73E8',
      bgColor: 'bg-[#E8F0FE]',
      iconColor: 'text-[#1A73E8]',
      icon: <Calendar size={18} />
    },
    {
      id: 'entry-4',
      type: 'circular',
      date: getDateNDaysAgo(3),
      title: 'Circular',
      badgeText: '',
      badgeColor: '',
      timestamp: '11:00 AM',
      content: 'Summer Camp registration is now open. Interested students can give their names to the class teacher.',
      sender: '1 Attachment',
      hasAttachment: true,
      accentColor: '#F2994A',
      bgColor: 'bg-[#FFF6ED]',
      iconColor: 'text-[#F2994A]',
      icon: <FileText size={18} />
    },
    {
      id: 'entry-5',
      type: 'homework',
      date: getDateNDaysAgo(5),
      title: 'Homework Update',
      badgeText: '',
      badgeColor: '',
      timestamp: '02:15 PM',
      content: 'Science project on "Parts of a Plant" is due on 28 May 2025.',
      sender: 'Class Teacher',
      accentColor: '#E04F5F',
      bgColor: 'bg-[#FFF0F2]',
      iconColor: 'text-[#E04F5F]',
      icon: <BookOpen size={18} />
    },
    {
      id: 'entry-6',
      type: 'gallery',
      date: getDateNDaysAgo(8),
      title: 'Gallery Update',
      badgeText: '',
      badgeColor: '',
      timestamp: '05:00 PM',
      content: 'New photos from the Annual Sports Day have been added to the gallery.',
      sender: 'School Admin',
      accentColor: '#2F80ED',
      bgColor: 'bg-[#EEF4FC]',
      iconColor: 'text-[#2F80ED]',
      icon: <Image size={18} />
    }
  ]);

  // Tab Filtering Logic
  // Tabs: All, Messages (message), Notices (notice), Events (event), Updates (circular, homework, gallery)
  const filteredByTab = useMemo(() => {
    if (activeTab === 'All') return diaryEntries;
    if (activeTab === 'Messages') return diaryEntries.filter(e => e.type === 'message');
    if (activeTab === 'Notices') return diaryEntries.filter(e => e.type === 'notice');
    if (activeTab === 'Events') return diaryEntries.filter(e => e.type === 'event');
    if (activeTab === 'Updates') {
      return diaryEntries.filter(e => ['circular', 'homework', 'gallery'].includes(e.type));
    }
    return diaryEntries;
  }, [activeTab, diaryEntries]);

  // Dropdown Filtering Logic (including Custom range filters)
  const finalFilteredEntries = useMemo(() => {
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

    // Filter by Category
    if (selectedCategoryFilter !== 'All Categories') {
      const catMap = {
        'Messages': 'message',
        'Notices': 'notice',
        'Events': 'event',
        'Circulars': 'circular',
        'Homework': 'homework',
        'Gallery': 'gallery'
      };
      const typeToFilter = catMap[selectedCategoryFilter];
      if (typeToFilter) {
        result = result.filter(e => e.type === typeToFilter);
      }
    }

    return result;
  }, [filteredByTab, selectedDateFilter, fromDate, toDate, selectedCategoryFilter, todayStr, yesterdayStr]);

  // Sort entries newest first
  const sortedEntries = useMemo(() => {
    return [...finalFilteredEntries].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.id.localeCompare(a.id);
    });
  }, [finalFilteredEntries]);

  // Grouped Entries for rendering timeline sections dynamically (Today, Yesterday, Date Header)
  const groupedEntries = useMemo(() => {
    const groups = {};

    sortedEntries.forEach(entry => {
      let header = '';
      if (entry.date === todayStr) {
        header = 'Today';
      } else if (entry.date === yesterdayStr) {
        header = 'Yesterday';
      } else {
        header = formatDateHeader(entry.date);
      }

      if (!groups[header]) {
        groups[header] = [];
      }
      groups[header].push(entry);
    });

    return groups;
  }, [sortedEntries, todayStr, yesterdayStr]);

  // Render text for Date Selector Button based on filter state
  const displayDateFilterText = useMemo(() => {
    if (selectedDateFilter === 'Custom Range') {
      if (fromDate && toDate) {
        if (fromDate === toDate) return formatShortDate(fromDate);
        return `${formatShortDate(fromDate)} - ${formatShortDate(toDate)}`;
      }
      if (fromDate) return `From ${formatShortDate(fromDate)}`;
      if (toDate) return `To ${formatShortDate(toDate)}`;
      return 'All Dates';
    }
    return selectedDateFilter;
  }, [selectedDateFilter, fromDate, toDate]);

  const categoryOptions = ['All Categories', 'Messages', 'Notices', 'Events', 'Circulars', 'Homework', 'Gallery'];

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
            title="Digital Diary Protected"
            message="Please login to view your child's daily homework updates, circulars, remarks and direct notices."
          />
        </div>
      </>
    );
  }

  return (
    <>

      {/* Dynamic Global Header Component */}
      <AppHeader
        scrolled={scrolled}
        onMenuClick={() => setIsMenuOpen(true)}
        childInfo={childInfo}
        transparentAtTop={false}
      />

      <div 
        onScroll={handleScroll}
        className="flex flex-col h-full bg-[#FAFAFC] pb-6 overflow-y-auto overflow-x-hidden w-full font-outfit relative"
      >
        {/* Sticky AppHeader Spacer */}
        <div className="h-[140px] shrink-0"></div>

        {/* 2. Overlapping Student Info / Category Stats Summary Card */}
        <div className="px-6 mt-4 relative z-10">
          <div className="bg-white border border-gray-100/80 rounded-3xl p-5 flex items-center gap-4 shadow-[0_10px_25px_rgba(91,63,214,0.06)] backdrop-blur-md">
            {/* Lavender Avatar Circle */}
            <div className="w-14 h-14 rounded-full bg-[#F3EFFF] border border-[#EAE3FF] flex items-center justify-center shrink-0">
              <ClipboardList size={24} className="text-[#6A47DE]" />
            </div>
            
            {/* Details */}
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-extrabold text-gray-800 leading-tight tracking-tight truncate">
                Digital Diary Feed
              </h2>
              <p className="text-xs font-bold text-gray-400 mt-1">
                Academic Year 2025 - 2026
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-gray-400">
                  Total Entries: {sortedEntries.length}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">
                  Category: {selectedCategoryFilter}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Horizontal Navigation Tabs */}
        <div className="px-6 mt-6 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2.5 min-w-max pb-1">
            {[
              { id: 'All', label: 'All', icon: <ClipboardList size={14} /> },
              { id: 'Messages', label: 'Messages', icon: <MessageSquare size={14} /> },
              { id: 'Notices', label: 'Notices', icon: <Megaphone size={14} /> },
              { id: 'Events', label: 'Events', icon: <Calendar size={14} /> },
              { id: 'Updates', label: 'Updates', icon: <Sparkles size={14} /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-extrabold border transition-all duration-300 ${
                    isActive
                      ? 'bg-[#6A47DE]/10 border-[#6A47DE]/30 text-[#6A47DE] shadow-[0_2px_8px_rgba(106,71,222,0.08)]'
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

        {/* 4. Dropdown Filters Bar */}
        <div className="px-6 mt-4 flex items-center justify-between gap-3 relative z-20">
          {/* Date Selector */}
          <div className="flex-1 relative">
            <button 
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowCategoryDropdown(false);
              }}
              className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-xs font-black text-gray-600 shadow-[0_2px_6px_rgba(0,0,0,0.015)] hover:border-gray-200 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Calendar size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{displayDateFilterText}</span>
              </div>
              <ChevronDown size={14} className="text-gray-400 shrink-0" />
            </button>
            
            {showDateDropdown && (
              <div className="absolute left-0 mt-1.5 bg-white border border-gray-100 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.12)] z-30 p-4 animate-fade-in text-[11px] font-black text-gray-600 w-[270px]">
                {/* Quick Select Section */}
                <div className="flex flex-col gap-1 mb-4 pb-3.5 border-b border-gray-100">
                  <span className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider mb-1.5">Quick Select</span>
                  {['All Dates', 'Today', 'Yesterday'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSelectedDateFilter(opt);
                        setFromDate('');
                        setToDate('');
                        setTempFromDate('');
                        setTempToDate('');
                        setShowDateDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                        selectedDateFilter === opt && !fromDate && !toDate
                          ? 'bg-[#6A47DE]/5 text-[#6A47DE]' 
                          : 'hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Dynamic From and To Date Picker Form */}
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider">Custom Date Range</span>
                  
                  <div className="flex flex-col gap-2.5">
                    {/* From input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] text-gray-400 font-black uppercase tracking-wider">From Date</label>
                      <input 
                        type="date"
                        value={tempFromDate}
                        onChange={(e) => setTempFromDate(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:border-[#6A47DE]/40 text-xs w-full"
                      />
                    </div>
                    {/* To input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] text-gray-400 font-black uppercase tracking-wider">To Date</label>
                      <input 
                        type="date"
                        value={tempToDate}
                        onChange={(e) => setTempToDate(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:border-[#6A47DE]/40 text-xs w-full"
                      />
                    </div>
                  </div>

                  {/* Datepicker Actions */}
                  <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setTempFromDate('');
                        setTempToDate('');
                        setFromDate('');
                        setToDate('');
                        setSelectedDateFilter('All Dates');
                        setShowDateDropdown(false);
                      }}
                      className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-extrabold transition-all text-center text-[10px]"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        if (tempFromDate || tempToDate) {
                          setFromDate(tempFromDate);
                          setToDate(tempToDate);
                          setSelectedDateFilter('Custom Range');
                        } else {
                          setSelectedDateFilter('All Dates');
                        }
                        setShowDateDropdown(false);
                      }}
                      className="flex-1 py-2 bg-[#6A47DE] hover:bg-[#5532C8] text-white rounded-xl font-extrabold transition-all text-center text-[10px]"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div className="flex-1 relative">
            <button 
              onClick={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowDateDropdown(false);
              }}
              className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-xs font-black text-gray-600 shadow-[0_2px_6px_rgba(0,0,0,0.015)] hover:border-gray-200 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Filter size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{selectedCategoryFilter}</span>
              </div>
              <ChevronDown size={14} className="text-gray-400 shrink-0" />
            </button>
            
            {showCategoryDropdown && (
              <div className="absolute right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 py-2 animate-fade-in text-[11px] font-black text-gray-600 w-full min-w-[150px]">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedCategoryFilter(opt);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-5 py-2.5 transition-colors ${
                      selectedCategoryFilter === opt 
                        ? 'bg-[#6A47DE]/5 text-[#6A47DE]' 
                        : 'hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Backdrop overlay for closing dropdowns */}
        {(showDateDropdown || showCategoryDropdown) && (
          <div 
            onClick={() => {
              setShowDateDropdown(false);
              setShowCategoryDropdown(false);
            }} 
            className="fixed inset-0 z-10 bg-transparent"
          />
        )}

        {/* 5. Timeline Feed List */}
        <div className="px-6 mt-6 flex flex-col gap-5 flex-1">
          {sortedEntries.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-[0_4px_12px_rgba(0,0,0,0.01)] py-16 mt-4">
              <ClipboardList size={44} className="text-gray-300 mb-3" />
              <h4 className="text-sm font-extrabold text-gray-700">No Diary Entries Found</h4>
              <p className="text-[11px] font-bold text-gray-400 mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                We couldn't find any items matching your date range or filter settings. Clear or adjust your filters to view posts.
              </p>
              <button 
                onClick={() => {
                  setActiveTab('All');
                  setSelectedDateFilter('All Dates');
                  setSelectedCategoryFilter('All Categories');
                  setFromDate('');
                  setToDate('');
                  setTempFromDate('');
                  setTempToDate('');
                }}
                className="mt-5 px-4 py-2 bg-[#6A47DE] text-white text-[11px] font-black rounded-xl hover:bg-[#5532C8] active:scale-95 transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            Object.keys(groupedEntries).map((timelineHeader) => {
              const entriesInGroup = groupedEntries[timelineHeader];
              if (entriesInGroup.length === 0) return null;

              return (
                <div key={timelineHeader} className="flex flex-col gap-3">
                  {/* Timeline Header (Dynamic Dates or Today/Yesterday) */}
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-0.5">{timelineHeader}</h3>
                  
                  {/* Entries inside group */}
                  <div className="flex flex-col gap-3.5">
                    {entriesInGroup.map((entry) => (
                      <div 
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className="bg-white border border-gray-100 rounded-3xl flex flex-col overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.012)] hover:shadow-md hover:border-gray-200/60 transition-all duration-300 cursor-pointer relative"
                      >
                        {/* Left border strip accent */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl"
                          style={{ backgroundColor: entry.accentColor }}
                        />

                        <div className="p-5 pl-7 flex gap-4">
                          {/* Circle Icon Badge Container */}
                          <div className={`w-11 h-11 rounded-2xl ${entry.bgColor} ${entry.iconColor} flex items-center justify-center shrink-0 border border-black/[0.02] shadow-sm`}>
                            {entry.icon}
                          </div>

                          {/* Text Fields Block */}
                          <div className="flex-1 min-w-0">
                            {/* Title line */}
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-[13px] font-extrabold text-gray-800 tracking-tight leading-tight">
                                  {entry.title}
                                </h4>
                                {entry.badgeText && (
                                  <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black leading-none shrink-0 ${entry.badgeColor}`}>
                                    {entry.badgeText}
                                  </span>
                                )}
                              </div>
                              
                              <span className="text-[10px] font-black text-gray-400 shrink-0">
                                {entry.timestamp}
                              </span>
                            </div>

                            {/* Body Description Content */}
                            <p className="text-[11.5px] font-bold text-gray-500 leading-snug mt-2 line-clamp-2 pr-1">
                              {entry.content}
                            </p>

                            {/* Card Footer row */}
                            <div className="mt-4 pt-3.5 border-t border-gray-50 flex items-center justify-between text-[10px] font-black text-gray-400">
                              <div className="flex items-center gap-1.5 hover:text-gray-600">
                                {entry.hasAttachment ? (
                                  <Paperclip size={11} className="text-gray-400 shrink-0" />
                                ) : (
                                  <User size={11} className="text-gray-400 shrink-0" />
                                )}
                                <span className="font-semibold text-gray-500">{entry.sender}</span>
                              </div>
                              
                              <span className="text-[#6A47DE] hover:text-[#5532C8] transition-colors flex items-center gap-0.5 font-black uppercase tracking-wider text-[9px]">
                                Tap to read <ChevronRight size={10} strokeWidth={2.5} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 7. Deeply Dynamic Detail Overlay Modal Sheet */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div 
            onClick={() => setSelectedEntry(null)}
            className="absolute inset-0"
          />
          <div className="bg-white border border-gray-100 rounded-t-[36px] w-full max-w-md p-6 pb-8 shadow-2xl relative z-10 animate-slide-up flex flex-col gap-5">
            {/* Top pill/handle bar */}
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto -mt-2 mb-1 shrink-0" />
            
            {/* Header info */}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl ${selectedEntry.bgColor} ${selectedEntry.iconColor} flex items-center justify-center shrink-0 border border-black/[0.01] shadow-sm`}>
                {selectedEntry.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {selectedEntry.type}
                  </span>
                  {selectedEntry.badgeText && (
                    <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black leading-none shrink-0 ${selectedEntry.badgeColor}`}>
                      {selectedEntry.badgeText}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-extrabold text-gray-800 leading-snug tracking-tight mt-1">
                  {selectedEntry.title}
                </h3>
              </div>
            </div>

            {/* Time / Metadata details card */}
            <div className="bg-[#FAFAFC] border border-gray-50 rounded-2xl p-4 flex flex-col gap-2.5 text-[11px] font-extrabold text-gray-400">
              <div className="flex items-center justify-between">
                <span>Date & Time</span>
                <span className="text-gray-600 font-semibold">
                  {selectedEntry.date === todayStr ? 'Today' : selectedEntry.date === yesterdayStr ? 'Yesterday' : formatDateHeader(selectedEntry.date)}, {selectedEntry.timestamp}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200/50 pt-2.5">
                <span>Published By</span>
                <span className="text-[#6A47DE] font-extrabold">{selectedEntry.sender}</span>
              </div>
            </div>

            {/* Content text */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Message details</span>
              <p className="text-xs font-bold text-gray-600 leading-relaxed bg-[#FAFAFC] p-4 rounded-2xl border border-gray-50/50 max-h-48 overflow-y-auto">
                {selectedEntry.content}
              </p>
            </div>

            {/* Actions button */}
            <div className="flex gap-3 mt-1 shrink-0">
              <button 
                onClick={() => setSelectedEntry(null)}
                className="flex-1 py-3.5 bg-gray-50 border border-gray-100 text-xs font-black text-gray-600 rounded-2xl hover:bg-gray-100 transition-colors active:scale-95 text-center"
              >
                Close Details
              </button>
              <button 
                onClick={() => alert(`Acknowledge: ${selectedEntry.title}`)}
                className="flex-1 py-3.5 bg-[#6A47DE] text-white text-xs font-black rounded-2xl hover:bg-[#5532C8] transition-colors active:scale-95 text-center shadow-lg shadow-[#6A47DE]/20"
              >
                Acknowledge Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ParentDiary;
