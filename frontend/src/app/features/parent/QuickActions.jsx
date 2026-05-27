import React from 'react';
import { UserCheck, BookOpen, FileText, Megaphone, Calendar, Phone, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();
  const isGuest = !localStorage.getItem('childInfo');
  const actions = [
    {
      id: 'attendance',
      label: 'Attendance',
      icon: <UserCheck size={20} className="text-[#34A853]" />,
      bg: 'bg-[#EBFBF0]',
    },
    {
      id: 'homework',
      label: 'Homework',
      icon: <BookOpen size={20} className="text-[#F2994A]" />,
      bg: 'bg-[#FFF6ED]',
    },
    {
      id: 'diary',
      label: 'Digital Diary',
      icon: <FileText size={20} className="text-[#7F56D9]" />,
      bg: 'bg-[#F9F5FF]',
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: <Megaphone size={20} className="text-[#D93025]" />,
      bg: 'bg-[#FEF3F2]',
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar size={20} className="text-[#1A73E8]" />,
      bg: 'bg-[#E8F0FE]',
    },
    {
      id: 'phonebook',
      label: 'Phonebook',
      icon: <Phone size={20} className="text-[#008080]" />,
      bg: 'bg-[#E6F4F1]',
    }
  ];

  if (isGuest) {
    return (
      <div className="px-6 -mt-10 relative z-10 font-outfit">
        {/* Guest Inline Login Card */}
        <div className="bg-white border border-gray-100/60 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <div className="w-full text-left">
            <h2 className="text-base font-extrabold text-[#3B248C]">My Class</h2>
          </div>
          
          <div className="w-14 h-14 bg-[#5B3FD6]/5 rounded-2xl flex items-center justify-center text-[#5B3FD6] shrink-0 relative border border-[#5B3FD6]/10 mt-2">
            <Lock size={24} />
          </div>
          <div>
            <h3 className="text-xs font-black text-[#3B248C] uppercase tracking-widest mb-1.5">Class Portal Locked</h3>
            <p className="text-[11px] font-semibold text-gray-400 max-w-[240px] mx-auto leading-relaxed">
              Login to view your child's attendance, homework, diary entries, calendar, and contacts.
            </p>
          </div>
          <button
            onClick={() => navigate('/user/login')}
            className="mt-1 px-5 py-3 bg-[#5B3FD6] text-white rounded-xl text-xs font-black shadow-lg shadow-[#5B3FD6]/20 active:scale-95 transition-all w-full max-w-[180px] uppercase tracking-widest"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 mt-6 font-outfit">
      {/* Section Title */}
      <h2 className="text-base font-extrabold text-deep-purple mb-4">My Class</h2>

      {/* Grid Layout */}
      <div className="grid grid-cols-3 gap-3.5">
        {actions.map((action) => (
          <div
            key={action.id}
            onClick={() => {
              if (action.id === 'attendance') {
                navigate('/user/attendance');
              } else if (action.id === 'homework') {
                navigate('/user/homework');
              } else if (action.id === 'diary') {
                navigate('/user/diary');
              } else if (action.id === 'notices') {
                navigate('/user/notices');
              } else if (action.id === 'calendar') {
                navigate('/user/calendar');
              } else if (action.id === 'phonebook') {
                navigate('/user/phonebook');
              }
            }}
            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-gray-200/80 active:scale-[0.97] transition-all duration-300 cursor-pointer"
          >
            {/* Circle Icon Badge */}
            <div className={`w-12 h-12 rounded-full ${action.bg} flex items-center justify-center mb-2.5 shrink-0 shadow-sm`}>
              {action.icon}
            </div>

            {/* Label */}
            <span className="text-[12px] font-black text-gray-700 text-center leading-tight">
              {action.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
