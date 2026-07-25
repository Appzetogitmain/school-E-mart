import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Bell, Package, Search, Filter, Menu, Hash, GraduationCap } from 'lucide-react';
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
  const isGuest = !childInfo || childInfo.name === "Guest" || !localStorage.getItem('childInfo');

  const getInitials = (name) => {
    if (isGuest) return "G";
    if (!name || name === "Guest") return "S";
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

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

      {/* Top Row: Brand Profile, Child Info, and Settings */}
      <div className="flex items-center justify-between relative z-10">
        {/* Left Side: Avatar & Child Metadata Block */}
        <div className="flex items-center gap-3.5">
          {/* Stylized Rounded-Square Student Profile Avatar Button */}
          <button 
            onClick={() => navigate('/user/profile')}
            className="w-16 h-16 rounded-2xl bg-white p-1 border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center overflow-hidden hover:bg-white/95 active:scale-95 transition-all outline-none relative group animate-shine shrink-0"
            aria-label="Open profile menu"
          >
            {/* Inner premium golden-white gradient ring overlay */}
            <div className="absolute inset-[2px] rounded-[14px] bg-gradient-to-tr from-[#FFC933]/15 to-transparent pointer-events-none z-20"></div>
            {childInfo?.schoolLogo || childInfo?.photo ? (
              <img 
                src={childInfo.schoolLogo || childInfo.photo} 
                alt={childInfo?.school || "School Logo"} 
                className="w-full h-full object-cover rounded-xl relative z-10" 
              />
            ) : (
              <img 
                src="/assets/school_logo.webp" 
                alt="School Logo" 
                className="w-full h-full object-contain relative z-10" 
              />
            )}
          </button>

          {/* Child Metadata Text */}
          <div className="flex flex-col gap-1.5 text-white">
            <h1 className="text-[19px] font-black tracking-tight leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
              {isGuest ? "Guest" : childInfo.name}
            </h1>
            
            {isGuest ? (
              <p className="text-[12px] font-bold text-white/80 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)] mt-0.5">
                Welcome to School E-Mart
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[12px] leading-none mt-0.5">
                  {/* Class glass badge */}
                  <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/10 font-bold text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                    {childInfo.grade === "Select Grade" ? "Class & Section" : childInfo.grade}
                  </span>
                  {/* Roll No glass badge */}
                  <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/5 font-semibold text-white/80 flex items-center gap-1">
                    <Hash size={10} className="text-white/60" />
                    {!childInfo.rollNo ? "Roll Number" : childInfo.rollNo}
                  </span>
                </div>
                
                <p className="text-[11px] font-bold text-white/70 flex items-center gap-1.5 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)] mt-1">
                  <GraduationCap size={14} className="text-[#FFC933] shrink-0" />
                  <span className="truncate max-w-[150px]">{childInfo.school}</span>
                </p>
              </>
            )}
          </div>
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
