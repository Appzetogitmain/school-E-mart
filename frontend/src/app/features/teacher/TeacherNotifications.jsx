import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, SlidersHorizontal, Megaphone, Calendar, 
  FileText, Palmtree, Users, AlertTriangle, ShieldCheck,
  ChevronRight, Paperclip
} from 'lucide-react';

const TeacherNotifications = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  const [notifications, setNotifications] = useState([]);

  const filters = [
    { name: 'All', icon: <Users size={14} /> },
    { name: 'Notice', icon: <Megaphone size={14} /> },
    { name: 'Event', icon: <Calendar size={14} /> },
    { name: 'Exam', icon: <FileText size={14} /> },
    { name: 'Holiday', icon: <Palmtree size={14} /> },
    { name: 'PTM', icon: <Users size={14} /> },
    { name: 'Urgent', icon: <AlertTriangle size={14} /> }
  ];

  const handleToggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read, isNew: false } : n));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'All') return true;
    return n.type.toLowerCase() === activeFilter.toLowerCase();
  });

  const unreadItems = filteredNotifications.filter(n => !n.read);
  const earlierItems = filteredNotifications.filter(n => n.read);

  // Helper icons and styles mapping
  const getTypeStyling = (type) => {
    switch (type) {
      case 'Urgent':
        return {
          icon: <AlertTriangle size={18} className="text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-l-[4px] border-l-red-500',
          labelColor: 'bg-red-50 text-red-650 border border-red-100',
          badgeText: 'URGENT'
        };
      case 'Notice':
        return {
          icon: <Megaphone size={18} className="text-primary" />,
          bgColor: 'bg-purple-50',
          borderColor: 'border-l-[4px] border-l-primary',
          labelColor: 'bg-purple-50 text-primary border border-purple-100',
          badgeText: 'NOTICE'
        };
      case 'Event':
        return {
          icon: <Calendar size={18} className="text-emerald-500" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-l-[4px] border-l-emerald-500',
          labelColor: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          badgeText: 'EVENT'
        };
      case 'Exam':
        return {
          icon: <FileText size={18} className="text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-l-transparent',
          labelColor: 'bg-blue-50 text-blue-600 border border-blue-100',
          badgeText: 'EXAM NOTICE'
        };
      case 'Holiday':
        return {
          icon: <Palmtree size={18} className="text-amber-500" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-l-transparent',
          labelColor: 'bg-amber-50 text-amber-600 border border-amber-100',
          badgeText: 'HOLIDAY'
        };
      default:
        return {
          icon: <Users size={18} className="text-indigo-500" />,
          bgColor: 'bg-indigo-50',
          borderColor: 'border-l-transparent',
          labelColor: 'bg-indigo-50 text-indigo-650 border border-indigo-100',
          badgeText: 'NOTIFICATION'
        };
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen select-none font-outfit animate-in fade-in duration-300 pb-20">
      
      {/* 1. Header Section */}
      <div className="px-6 pt-7 pb-4 bg-white flex items-center justify-between border-b border-gray-100 relative z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/school/teacher/dashboard')}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex items-center justify-center text-deep-purple mr-1"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-lg font-black text-deep-purple leading-none">School Notifications</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-1">Important updates from school administration</p>
          </div>
        </div>

        <button className="w-10 h-10 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex items-center justify-center text-deep-purple">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* 2. Scrollable Filter Pill Badges */}
      <div className="bg-white py-3 px-6 overflow-x-auto scrollbar-none flex gap-2.5 border-b border-gray-100/50 shrink-0">
        {filters.map(filter => {
          const isActive = filter.name === activeFilter;
          return (
            <button
              key={filter.name}
              onClick={() => setActiveFilter(filter.name)}
              className={`px-4 py-2.5 rounded-full text-xs font-black flex items-center gap-2 shrink-0 border transition-all active:scale-95 ${
                isActive 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-purple-100' 
                  : 'bg-white text-deep-purple border-gray-150 hover:bg-gray-50'
              }`}
            >
              {filter.icon}
              <span>{filter.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Notifications List Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        
        {/* Unread Section */}
        {unreadItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[11px] font-black text-deep-purple uppercase tracking-wider block">Unread</h2>
            <div className="space-y-3">
              {unreadItems.map(item => {
                const style = getTypeStyling(item.type);
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleToggleRead(item.id)}
                    className={`bg-white border border-gray-200 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative cursor-pointer overflow-hidden flex items-start justify-between gap-3 ${style.borderColor}`}
                  >
                    {/* Left Red Indicator Dot for New */}
                    {item.isNew && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full" />
                    )}

                    {/* Icon block */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.bgColor}`}>
                      {style.icon}
                    </div>

                    {/* Info Block */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${style.labelColor}`}>
                          {style.badgeText}
                        </span>
                        {item.isNew && (
                          <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-black text-deep-purple leading-snug">{item.title}</h3>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">{item.description}</p>
                      
                      <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-400 mt-2">
                        <Users size={10} />
                        <span>{item.sender}</span>
                        <span>•</span>
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>{item.time}</span>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-gray-355 self-center shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Earlier Section */}
        {earlierItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[11px] font-black text-deep-purple uppercase tracking-wider block">Earlier</h2>
            <div className="space-y-3">
              {earlierItems.map(item => {
                const style = getTypeStyling(item.type);
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleToggleRead(item.id)}
                    className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative cursor-pointer overflow-hidden flex items-start justify-between gap-3"
                  >
                    {/* Icon block */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.bgColor}`}>
                      {style.icon}
                    </div>

                    {/* Info Block */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${style.labelColor}`}>
                          {style.badgeText}
                        </span>
                        {item.hasAttachment && (
                          <div className="flex items-center gap-1 text-primary text-[9px] font-black">
                            <Paperclip size={12} />
                            <span>{item.attachmentName}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-xs font-black text-deep-purple leading-snug">{item.title}</h3>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">{item.description}</p>
                      
                      <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-400 mt-2">
                        <Users size={10} />
                        <span>{item.sender}</span>
                        <span>•</span>
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>{item.time}</span>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-gray-355 self-center shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4 animate-bounce">
              <Megaphone size={28} />
            </div>
            <h3 className="text-xs font-black text-deep-purple">No notifications yet</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">School notifications API is not connected yet</p>
          </div>
        )}

        {/* 4. Bottom Info Banner Banner */}
        <div className="bg-purple-50/70 border border-purple-100 rounded-3xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="text-[10px] text-deep-purple/80 leading-relaxed font-bold">
              These are important messages from school administration. Please check regularly and stay updated.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TeacherNotifications;
