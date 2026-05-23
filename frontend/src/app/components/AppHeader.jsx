import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Bell, User, Package, Search, Filter, Menu, Hash, GraduationCap } from 'lucide-react';
import AuthPrompt from './AuthPrompt';

const AppHeader = ({ showSearch = true, scrolled = false, onMenuClick, childInfo: propChildInfo, transparentAtTop = false }) => {
  const navigate = useNavigate();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [internalChildInfo, setInternalChildInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : null;
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('childInfo');
      setInternalChildInfo(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const childInfo = propChildInfo || internalChildInfo;
  const isGuest = !childInfo;

  const handleMySchoolClick = () => {
    if (isGuest) {
      setIsAuthPromptOpen(true);
    } else {
      navigate('/user/my-school');
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-6 pt-8 pb-9 transition-all duration-300 ease-in-out border-b border-white/10 ${
      transparentAtTop 
        ? scrolled 
          ? "bg-gradient-to-b from-[#3B248C] to-[#5B3FD6] shadow-xl" 
          : "bg-transparent border-b-transparent shadow-none"
        : "bg-gradient-to-b from-[#3B248C] to-[#5B3FD6] shadow-xl"
    }`}>
      {/* Soft Premium Warm Accent Glows */}
      {(!transparentAtTop || scrolled) && (
        <>
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFC933]/15 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none"></div>
        </>
      )}

      <style>
        {`
          @keyframes shine {
            0% { left: -100%; }
            20% { left: 100%; }
            100% { left: 100%; }
          }
          .animate-shine {
            position: relative;
            overflow: hidden;
          }
          .animate-shine::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(
              to right,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
            transform: skewX(-25deg);
            animation: shine 3s infinite;
          }
        `}
      </style>

      {/* Top Row: Brand Profile, Child Info, and Notifications */}
      <div className="flex items-center justify-between relative z-10">
        {/* Left Side: Avatar Button and Child Details */}
        <div className="flex items-center gap-4">
          {/* Stylized Rounded-Square Student Profile Avatar Button: clicking opens side menu */}
          <button 
            onClick={onMenuClick}
            className="w-13 h-13 rounded-2xl bg-white/10 border border-white/25 shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center overflow-hidden backdrop-blur-lg hover:bg-white/15 active:scale-95 transition-all outline-none relative group animate-shine shrink-0"
            aria-label="Open profile menu"
          >
            {/* Inner premium golden-white gradient ring overlay */}
            <div className="absolute inset-[2px] rounded-[14px] bg-gradient-to-tr from-[#FFC933]/20 to-white/10 pointer-events-none"></div>
            <User className="w-6 h-6 text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
          </button>

          {/* Child Metadata Text */}
          <div className="flex flex-col gap-2 text-white">
            <h1 className="text-[19px] font-black tracking-tight leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
              {!childInfo || childInfo.name === "Guest" ? "Student Name" : childInfo.name}
            </h1>
            
            <div className="flex items-center gap-2 text-[12px] leading-none">
              {/* Class glass badge */}
              <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/10 font-bold text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                {!childInfo || childInfo.grade === "Select Grade" ? "Class & Section" : childInfo.grade}
              </span>
              {/* Roll No glass badge */}
              <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/5 font-semibold text-white/80 flex items-center gap-1">
                <Hash size={10} className="text-white/60" />
                {!childInfo || !childInfo.rollNo ? "Roll Number" : childInfo.rollNo}
              </span>
            </div>
            
            <p className="text-[11px] font-bold text-white/70 flex items-center gap-1.5 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)] mt-0.5">
              <GraduationCap size={14} className="text-[#FFC933] shrink-0" />
              <span className="truncate max-w-[150px]">{!childInfo || childInfo.school === "Explore Schools" ? "School Name" : childInfo.school}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Notification Icon with Unread Badge */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate("/user/notifications")}
            className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-lg flex items-center justify-center text-white relative active:scale-90 hover:bg-white/15 transition-all border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] shrink-0"
            aria-label="View notifications"
          >
            <Bell size={19} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
            {/* Premium Glowing Dot with Pulsing Ring */}
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B30] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF3B30] border border-white/25"></span>
            </span>
          </button>
        </div>
      </div>

      <AuthPrompt 
        isOpen={isAuthPromptOpen} 
        onClose={() => setIsAuthPromptOpen(false)} 
        title="View Your School Store"
        message="Login to see products specially curated for your child's school and class."
      />
    </div>
  );
};

export default AppHeader;
