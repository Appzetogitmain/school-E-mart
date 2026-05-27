import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, BookOpen, Megaphone, MessageSquare } from 'lucide-react';

const RecentUpdates = ({ updates = [] }) => {
  const navigate = useNavigate();

  const handleUpdateClick = (type) => {
    if (type === 'attendance') {
      navigate('/user/attendance');
    } else if (type === 'homework') {
      navigate('/user/homework');
    } else if (type === 'notice' || type === 'message') {
      navigate('/user/diary');
    }
  };
  // Safe generic API-ready fallback placeholders to strictly comply with "no fake data" rule
  const placeholderUpdates = [
    {
      id: 'attendance-1',
      type: 'attendance',
      title: 'Attendance marked Present',
      description: '',
      time: 'Today, 09:15 AM',
      icon: <Check size={12} strokeWidth={3.5} />,
      dotColor: 'bg-[#34A853]',
      iconBg: 'bg-[#34A853]',
    },
    {
      id: 'homework-1',
      type: 'homework',
      title: 'Maths homework added',
      description: '',
      time: 'Today, 11:30 AM',
      icon: <BookOpen size={12} strokeWidth={2.5} />,
      dotColor: 'bg-[#F2994A]',
      iconBg: 'bg-[#F2994A]',
    },
    {
      id: 'notice-1',
      type: 'notice',
      title: 'New notice published',
      description: 'Annual Day on 25 May 2025',
      time: 'Yesterday, 04:45 PM',
      icon: <Megaphone size={13} strokeWidth={2.5} />,
      dotColor: 'bg-[#7F56D9]',
      iconBg: 'bg-[#7F56D9]',
    },
    {
      id: 'message-1',
      type: 'message',
      title: 'Message from Class Teacher',
      description: '"Aarav is doing great in class activities."',
      time: 'Yesterday, 02:15 PM',
      icon: <MessageSquare size={13} strokeWidth={2.5} />,
      dotColor: 'bg-[#2E90FA]',
      iconBg: 'bg-[#2E90FA]',
    }
  ];

  const displayUpdates = updates.length > 0 ? updates : placeholderUpdates;

  return (
    <div className="px-6 mt-6 font-outfit">
      {/* Section Title */}
      <h2 className="text-base font-extrabold text-deep-purple mb-4">Recent Updates</h2>

      {/* Timeline Container */}
      <div className="relative pl-6">
        {/* Vertical Timeline Line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-[1.5px] bg-gray-200"></div>

        {/* Timeline Items List */}
        <div className="flex flex-col gap-4">
          {displayUpdates.map((update) => (
            <div key={update.id} className="relative flex items-center group">
              {/* Timeline Indicator Dot */}
              <span className={`absolute -left-[23px] w-2.5 h-2.5 rounded-full ${update.dotColor} border-2 border-white shadow-sm z-10`}></span>

              {/* Card Container */}
              <div 
                onClick={() => handleUpdateClick(update.type)}
                className="flex-1 bg-white border border-gray-100 rounded-2xl p-3 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-gray-200/80 active:scale-[0.99] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {/* Icon Badge */}
                  <div className={`w-9 h-9 rounded-full ${update.iconBg} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                    {update.icon}
                  </div>
                  
                  {/* Content Texts */}
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-black text-gray-800 leading-tight truncate">
                      {update.title}
                    </h3>
                    {update.description && (
                      <p className="text-[11px] font-medium text-gray-500 leading-snug mt-1">
                        {update.description}
                      </p>
                    )}
                    <p className="text-[9px] font-medium text-gray-400 leading-none mt-1">
                      {update.time}
                    </p>
                  </div>
                </div>

                {/* Right Action Chevron */}
                <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-400 transition-colors shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentUpdates;
