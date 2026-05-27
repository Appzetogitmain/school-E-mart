import React, { useState } from 'react';
import { 
  ChevronDown, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Paperclip, 
  Eye, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import ParentHomeworkDetails from './ParentHomeworkDetails';
import LoginRequired from '../../components/LoginRequired';

const ParentHomework = () => {
  const [activeTab, setActiveTab] = useState('Pending');
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);

  // Dropdown Sort States
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortOrder, setSortOrder] = useState('Newest');

  // Backend Integration State Hook for Homework Summary Stats:
  // E.g. setHomeworkStats({ pending: 3, submitted: 2, completed: 8, overdue: 1 })
  const [homeworkStats, setHomeworkStats] = useState(null);

  const [childInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : {
      name: "Priya Damodaran",
      school: "St. Xavier's High School",
      grade: "Class 2",
      phone: "+91 79999 42772",
      progress: { completed: 12, total: 18 }
    };
  });

  const handleScroll = (e) => {
    if (e.target.scrollTop > 10) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  // Mock list items optimized to show pending items only by default
  // Built structure-first with double-hyphens so that it is dead-easy to map to database fields later!
  const homeworkItems = [
    {
      id: 'math',
      subject: 'Mathematics',
      description: 'Solve the given worksheet on Fractions (Page 45-46) in the notebook.',
      image: '/assets/math_homework.png',
      isHighPriority: true,
      status: 'Due Soon',
      statusColor: 'bg-[#FFF6ED] text-[#F2994A] border-[#F2994A]/10',
      assignedDate: '-- -- ----',
      dueDate: '-- -----',
      daysRemaining: '-- Day Left',
      teacher: '-- -.- --',
      attachmentsCount: 1,
      tabType: 'Pending'
    },
    {
      id: 'english',
      subject: 'English',
      description: "Write a short story (150-200 words) on 'My Best Friend' in your English notebook.",
      image: '/assets/english_homework.png',
      isHighPriority: false,
      status: 'Overdue',
      statusColor: 'bg-[#FEF3F2] text-[#D93025] border-[#D93025]/10',
      assignedDate: '-- -- ----',
      dueDate: '-- -----',
      daysRemaining: '-- Day Overdue',
      teacher: '-- -.- --',
      attachmentsCount: 1,
      tabType: 'Pending'
    },
    {
      id: 'science',
      subject: 'Science',
      description: 'Draw and label the parts of a plant in your notebook.',
      image: '/assets/science_homework.png',
      isHighPriority: false,
      status: 'On Track',
      statusColor: 'bg-[#EBFBF0] text-[#34A853] border-[#34A853]/10',
      assignedDate: '-- -- ----',
      dueDate: '-- -----',
      daysRemaining: '-- Day Left',
      teacher: '-- -.- --',
      attachmentsCount: 1,
      tabType: 'Pending'
    }
  ];

  const isGuest = !localStorage.getItem('childInfo');

  if (isGuest) {
    return (
      <div className="max-w-md mx-auto h-[100dvh] relative overflow-hidden flex flex-col font-outfit w-full bg-white">
        <AppHeader
          scrolled={scrolled}
          onMenuClick={() => setIsMenuOpen(true)}
          childInfo={null}
          transparentAtTop={false}
        />
        <div className="flex flex-col h-full bg-gray-50/50 pb-40 overflow-y-auto overflow-x-hidden w-full font-outfit">
          <div className="h-[140px] shrink-0"></div>
          <LoginRequired 
            title="Homework Protected"
            message="Please login to view your child's pending assignments, homework details, and submission portal."
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Side Menu Drawer Placeholder to keep standard nav functional */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5B3FD6]/10 flex items-center justify-center text-[#5B3FD6] font-bold">
              SM
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-800">School Mart</h4>
              <p className="text-[10px] text-gray-400 font-bold">Parent Portal</p>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs font-black">Close</button>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <button onClick={() => window.location.href='/user/home'} className="w-full text-left px-4 py-3 text-sm font-black text-gray-600 rounded-xl hover:bg-gray-50 flex items-center gap-3">
            <span>🏠</span> Home Dashboard
          </button>
          <button onClick={() => window.location.href='/user/attendance'} className="w-full text-left px-4 py-3 text-sm font-black text-gray-600 rounded-xl hover:bg-gray-50 flex items-center gap-3">
            <span>📅</span> Attendance Tracker
          </button>
          <button onClick={() => { setActiveTab('Pending'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-black text-[#5B3FD6] rounded-xl bg-[#5B3FD6]/5 flex items-center gap-3">
            <span>📝</span> Class Homework
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in" />
      )}

      {/* Main Base Page Frame */}
      <div className="max-w-md mx-auto h-[100dvh] relative overflow-hidden flex flex-col font-outfit w-full bg-white">
        <AppHeader
          scrolled={scrolled}
          onMenuClick={() => setIsMenuOpen(true)}
          childInfo={childInfo}
          transparentAtTop={false}
        />
        
        <div
          onScroll={handleScroll}
          className="flex flex-col h-full bg-gray-50/50 pb-40 overflow-y-auto overflow-x-hidden w-full font-outfit"
        >
          {/* Sticky AppHeader Spacer */}
          <div className="h-[140px] shrink-0"></div>

          {/* 1. Horizontal Navigation Tabs */}
          <div className="px-6 mt-4">
            <div className="bg-white border border-gray-100/50 rounded-2xl p-1.5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              {['All', 'Pending', 'Submitted', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-center py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
                    activeTab === tab
                      ? 'bg-[#5B3FD6]/10 text-[#5B3FD6]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Homework Summary Micro-Cards Bar (Explicit Flexbox Row Alignment) */}
          <div className="px-6 mt-4">
            <div className="flex flex-row items-center gap-2 w-full">
              {/* Pending Stat */}
              <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)] min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FFF6ED] flex items-center justify-center text-[#F2994A] mb-1">
                  <FileText size={15} />
                </div>
                <span className="text-[10px] font-black text-gray-400">Pending</span>
                <span className="text-sm font-black text-gray-800 mt-0.5">
                  {homeworkStats ? homeworkStats.pending : '--'}
                </span>
              </div>

              {/* Submitted Stat */}
              <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)] min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#F9F5FF] flex items-center justify-center text-[#7F56D9] mb-1">
                  <BookOpen size={15} />
                </div>
                <span className="text-[10px] font-black text-gray-400">Submitted</span>
                <span className="text-sm font-black text-gray-800 mt-0.5">
                  {homeworkStats ? homeworkStats.submitted : '--'}
                </span>
              </div>

              {/* Completed Stat */}
              <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)] min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#EBFBF0] flex items-center justify-center text-[#34A853] mb-1">
                  <CheckCircle2 size={15} />
                </div>
                <span className="text-[10px] font-black text-gray-400">Completed</span>
                <span className="text-sm font-black text-gray-800 mt-0.5">
                  {homeworkStats ? homeworkStats.completed : '--'}
                </span>
              </div>

              {/* Overdue Stat */}
              <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)] min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FEF3F2] flex items-center justify-center text-[#D93025] mb-1">
                  <AlertCircle size={15} />
                </div>
                <span className="text-[10px] font-black text-gray-400">Overdue</span>
                <span className="text-sm font-black text-gray-800 mt-0.5">
                  {homeworkStats ? homeworkStats.overdue : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Section Title with Sort Selector */}
          <div className="px-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-800">
                {activeTab === 'All' ? 'All Homework' : `${activeTab} Homework`}
              </h2>
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="text-xs font-black text-gray-500 hover:text-gray-700 flex items-center gap-1 active:scale-95 transition-transform"
                >
                  Sort: {sortOrder} <ChevronDown size={12} className="text-gray-400" />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-1.5 w-32 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-2 animate-fade-in text-[11px] font-black text-gray-600">
                    {['Newest', 'Oldest', 'Due Date'].map((order) => (
                      <button
                        key={order}
                        onClick={() => {
                          setSortOrder(order);
                          setShowSortDropdown(false);
                        }}
                        className="w-full text-left px-5 py-2.5 hover:bg-[#5B3FD6]/5 hover:text-[#5B3FD6] transition-colors"
                      >
                        {order}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Homework Lists */}
          <div className="px-6 flex flex-col gap-4">
            {/* Filtered mapping: By default, we show the pending cards when the 'Pending' or 'All' tab is active */}
            {(activeTab === 'Pending' || activeTab === 'All') ? (
              homeworkItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-300"
                >
                  {/* Body Content Row */}
                  <div className="p-4 flex gap-4">
                    {/* Thumbnail Image Wrapper */}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100/50 shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.subject} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=150&q=80";
                        }}
                      />
                      {item.isHighPriority && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase tracking-wider">
                          High Priority
                        </span>
                      )}
                    </div>

                    {/* Meta Fields Content Block */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[14px] font-black text-gray-800 truncate">{item.subject}</h4>
                        <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black leading-none shrink-0 ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </div>
                      
                      <p className="text-[11px] font-bold text-gray-500 leading-snug mt-1.5 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Structure-First Metadata Rows */}
                      <div className="mt-3 flex flex-col gap-1 text-[9.5px] font-black text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 flex items-center justify-center">📅</span>
                          <span>Assigned: <span className="text-gray-500 font-semibold">{item.assignedDate}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 flex items-center justify-center">⏰</span>
                          <span>Due: <span className="text-gray-500 font-semibold">{item.dueDate}</span> <span className="text-[#F2994A] font-extrabold">({item.daysRemaining})</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 flex items-center justify-center">👤</span>
                          <span>Teacher: <span className="text-gray-500 font-semibold">{item.teacher}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-[11px] font-black text-gray-500">
                    <div className="flex items-center gap-1 hover:text-gray-700 cursor-pointer">
                      <Paperclip size={12} className="text-gray-400" />
                      <span>{item.attachmentsCount} Attachment</span>
                    </div>
                    <button 
                      onClick={() => setSelectedHomework(item)}
                      className="flex items-center gap-1 text-[#5B3FD6] hover:text-[#4a32b0] transition-colors cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Clean Empty States for empty tabs - keeps mock data footprint virtually zero!
              <div className="bg-white border border-gray-100 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)] py-14">
                <ClipboardList size={36} className="text-gray-300 mb-2" />
                <h4 className="text-[13px] font-black text-gray-700">No {activeTab} Homework</h4>
                <p className="text-[11px] font-semibold text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  All homework submitted by child or graded by teachers will show up here dynamically.
                </p>
              </div>
            )}
          </div>


        </div>
        {selectedHomework && (
          <ParentHomeworkDetails 
            homework={selectedHomework}
            onClose={() => setSelectedHomework(null)}
          />
        )}
      </div>
    </>
  );
};

export default ParentHomework;
