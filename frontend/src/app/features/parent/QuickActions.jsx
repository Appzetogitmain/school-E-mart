import React from 'react';
import { UserCheck, BookOpen, FileText, Megaphone, Calendar, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();
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
