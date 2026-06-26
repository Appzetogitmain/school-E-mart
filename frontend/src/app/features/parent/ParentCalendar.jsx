import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Calendar as CalendarIcon, 
  MapPin, 
  BookOpen, 
  Megaphone, 
  Calendar, 
  Clock, 
  Filter, 
  ArrowRight,
  Sparkles,
  Award,
  Bell,
  Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import LoginRequired from '../../components/LoginRequired';

const ParentCalendar = () => {
  const navigate = useNavigate();

  // Header Scroll and SideMenu States
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Calendar State Engine
  const [currentDate, setCurrentDate] = useState(() => new Date()); // Dynamically uses current local system date on load
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate()); // Automatically select the current day of the active month

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

  // No calendar API — events loaded as empty until backend support exists
  const eventsDatabase = useMemo(() => [], []);

  const categoryStyles = {
    'Academic': { dot: 'bg-[#7F56D9]', label: 'Academic', text: 'text-[#7F56D9]', labelBg: 'bg-[#F9F5FF]' },
    'Event': { dot: 'bg-[#34A853]', label: 'Event', text: 'text-[#34A853]', labelBg: 'bg-[#EBFBF0]' },
    'Holiday': { dot: 'bg-[#F2994A]', label: 'Holiday', text: 'text-[#F2994A]', labelBg: 'bg-[#FFF6ED]' },
    'PTM / Meeting': { dot: 'bg-[#1A73E8]', label: 'PTM / Meeting', text: 'text-[#1A73E8]', labelBg: 'bg-[#E8F0FE]' },
    'Exam': { dot: 'bg-[#E04F5F]', label: 'Exam', text: 'text-[#E04F5F]', labelBg: 'bg-[#FFF0F2]' }
  };

  // Helper values for generating dynamic calendars
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Month navigation logic
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    setSelectedDay(1);
  };

  // Calendar dates generation logic
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of active month
    const firstDayIndex = new Date(year, month, 1).getDay();

    // Total days in active month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Total days in previous month
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Fill previous month grey days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year
      });
    }

    // Fill active month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        month,
        year
      });
    }

    // Fill next month grey days (pad grid to multiples of 7)
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const nextDaysCount = totalSlots - days.length;
    for (let i = 1; i <= nextDaysCount; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year
      });
    }

    return days;
  }, [currentDate]);

  // Dynamic filter for active day's events
  const selectedDayEvents = useMemo(() => {
    const activeMonth = currentDate.getMonth();
    const activeYear = currentDate.getFullYear();

    return eventsDatabase.filter(e => e.day === selectedDay && e.month === activeMonth && e.year === activeYear);
  }, [selectedDay, currentDate, eventsDatabase]);

  // Highlights to display in upcoming highlights block
  const highlightEvents = useMemo(() => {
    return eventsDatabase.filter(e => e.isHighlight);
  }, [eventsDatabase]);

  // Formats active title text
  const formattedSelectedDate = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${selectedDay} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [selectedDay, currentDate]);

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
            title="Calendar Protected"
            message="Please login to view school events, examination schedules, gazetted holidays and parent teacher meetings."
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Side drawer navigation panel */}
      
      {/* Global Header component */}
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

        {/* 1. Curved Calendar Card */}
        <div className="px-6 mt-4 relative z-20">
          <div className="bg-white border border-gray-100/50 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            
            {/* Top Control Header */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button 
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all text-gray-500"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="text-sm font-extrabold text-gray-800 min-w-[100px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              
              <button 
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all text-gray-500"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekdays Labels Row */}
            <div className="grid grid-cols-7 gap-y-2 mb-2 text-center">
              {weekdays.map((day) => (
                <span key={day} className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {day}
                </span>
              ))}
            </div>

            {/* Monthly Days Grid */}
            <div className="grid grid-cols-7 gap-y-3.5 text-center mt-2.5">
              {calendarDays.map((date, idx) => {
                const isSelected = date.isCurrentMonth && date.day === selectedDay;
                
                // Fetch all events for this day to draw dots
                const dayEvts = eventsDatabase.filter(
                  e => e.day === date.day && 
                  e.month === date.month && 
                  e.year === date.year
                );

                return (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (date.isCurrentMonth) {
                        setSelectedDay(date.day);
                      }
                    }}
                    className={`flex flex-col items-center justify-center relative py-1 cursor-pointer select-none`}
                  >
                    {/* Circle highlight container */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isSelected 
                        ? 'bg-[#6A47DE] text-white shadow-md shadow-[#6A47DE]/20 scale-105' 
                        : date.isCurrentMonth 
                          ? 'text-gray-700 hover:bg-[#6A47DE]/5' 
                          : 'text-gray-300'
                    }`}>
                      {date.day}
                    </div>

                    {/* Event indicators dots row */}
                    {date.isCurrentMonth && dayEvts.length > 0 && (
                      <div className="flex justify-center gap-0.5 mt-0.5 absolute bottom-[-4px]">
                        {dayEvts.slice(0, 3).map((evt) => (
                          <span 
                            key={evt.id} 
                            className={`w-1 h-1 rounded-full ${evt.dotColor}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Color Legend Section Bar */}
        <div className="px-6 mt-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-wrap items-center justify-center gap-x-4.5 gap-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            {Object.entries(categoryStyles).map(([catName, styles]) => (
              <div key={catName} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                <span className="text-[10px] font-black text-gray-500">{styles.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Selected Day Events Feed */}
        <div className="mt-6 px-6 flex flex-col gap-4">
          <h2 className="text-sm font-extrabold text-gray-800 tracking-tight">
            Events on {formattedSelectedDate}
          </h2>

          {selectedDayEvents.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm py-12">
              <CalendarIcon size={36} className="text-gray-300 mb-2" />
              <h4 className="text-xs font-extrabold text-gray-700">No Events Scheduled</h4>
              <p className="text-[9.5px] font-bold text-gray-400 mt-1 max-w-[200px] leading-normal">
                There are no exams, holidays, PTMs, or events marked on this day. Select another date to view school activities.
              </p>
            </div>
          ) : (
            selectedDayEvents.map((evt) => (
              <div 
                key={evt.id}
                onClick={() => alert(`Details for event: ${evt.title}`)}
                className="bg-white border border-gray-100 rounded-3xl p-4 flex gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-gray-200/50 transition-all duration-300 cursor-pointer relative"
              >
                {/* Round Badge Icon */}
                <div className={`w-12 h-12 rounded-2xl ${evt.bgColor} ${evt.iconColor} flex items-center justify-center shrink-0 border border-black/[0.01] shadow-sm`}>
                  {evt.icon}
                </div>

                {/* Details info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2 text-gray-400">
                    <span className="text-[10px] font-bold flex items-center gap-1">
                      <Clock size={11} className="text-gray-300" />
                      {evt.time}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-tight ${categoryStyles[evt.category].labelBg} ${categoryStyles[evt.category].text}`}>
                      {evt.category}
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-gray-800 tracking-tight leading-snug mt-1.5">
                    {evt.title}
                  </h3>

                  <p className="text-[10.5px] font-bold text-gray-400 leading-snug mt-1">
                    {evt.content}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center gap-1.5 text-[9.5px] font-black text-gray-400">
                    <MapPin size={11} className="text-gray-300" />
                    <span>{evt.location}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 4. Action Banner link */}
        <div className="px-6 mt-4">
          <button 
            onClick={() => alert('View Full Academic Year Planner')}
            className="w-full bg-[#F6F2FF] border border-[#E9E0FF] text-[#6A47DE] rounded-2xl py-3.5 px-5 flex items-center justify-between text-xs font-black hover:bg-[#EFEBFF] active:scale-95 transition-all shadow-sm shadow-[#6A47DE]/5"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon size={14} className="text-[#6A47DE]" />
              <span>View Full Schedule</span>
            </div>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 5. Upcoming Highlights Slider */}
        <div className="mt-8">
          <div className="px-6 flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-gray-800 tracking-tight">
              Upcoming Highlights
            </h2>
            <button 
              onClick={() => alert('View All Highlights')}
              className="text-xs font-bold text-[#6A47DE] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="px-6 overflow-x-auto scrollbar-none pb-4">
            {highlightEvents.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-8 text-center">
                <Sparkles size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">No upcoming highlights</p>
                <p className="text-[10px] text-gray-400 mt-1">School events will appear here when available.</p>
              </div>
            ) : (
            <div className="flex items-center gap-4 min-w-max">
              {highlightEvents.map((evt) => (
                <div 
                  key={evt.id}
                  onClick={() => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    setCurrentDate(new Date(evt.year, evt.month, 1));
                    setSelectedDay(evt.day);
                  }}
                  className="bg-white border border-gray-100 rounded-3xl p-4 flex gap-4 w-[250px] shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-gray-200/50 transition-all duration-300 cursor-pointer"
                >
                  {/* Highlight Day Accent Block */}
                  <div className={`w-12 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm border border-black/[0.01] ${
                    evt.category === 'Holiday' ? 'bg-[#FFF6ED] text-[#F2994A]' :
                    evt.category === 'PTM / Meeting' ? 'bg-[#E8F0FE] text-[#1A73E8]' :
                    evt.category === 'Event' ? 'bg-[#EBFBF0] text-[#34A853]' :
                    'bg-[#F4EBFF] text-[#7F56D9]'
                  }`}>
                    <span className="text-[14px] font-black leading-none">{evt.day}</span>
                    <span className="text-[8px] uppercase tracking-wider font-extrabold mt-1">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][evt.month]}
                    </span>
                  </div>

                  {/* Highlights Description */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-xs font-black text-gray-800 truncate leading-snug">
                      {evt.title}
                    </h4>
                    <p className="text-[9.5px] font-bold text-gray-400 mt-0.5 truncate">
                      {evt.content}
                    </p>
                    <span className="text-[9px] font-extrabold text-[#6A47DE] mt-1.5 flex items-center gap-1">
                      <Clock size={10} className="text-[#6A47DE]/60 shrink-0" />
                      <span className="truncate">{evt.time}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ParentCalendar;
