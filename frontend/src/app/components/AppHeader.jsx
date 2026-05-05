import React, { useState } from 'react';
import { ChevronDown, Bell, User, Package, Search, Filter, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AppHeader = ({ showSearch = true, scrolled = false, onMenuClick, childInfo: propChildInfo }) => {
  const navigate = useNavigate();
  const [internalChildInfo, setInternalChildInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : {
      name: "Priya Damodaran",
      school: "St. Xavier's High School",
      grade: "Class 2"
    };
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('childInfo');
      if (saved) setInternalChildInfo(JSON.parse(saved));
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const childInfo = propChildInfo || internalChildInfo;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] px-6 pt-6 rounded-b-[2rem] shadow-xl border-b border-white/10 transition-all duration-300 ease-in-out ${scrolled ? 'pb-2' : 'pb-3'}`}>
      {/* Premium Gradient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl overflow-hidden"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full -ml-16 -mb-16 blur-2xl overflow-hidden"></div>

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

      {/* Brand Header: Logo and Actions */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="w-8 h-8 -ml-2 flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <Menu size={20} />
          </button>
          <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-black/20 border border-white/20">
            <img
              src="/assets/logo.jpeg"
              alt="School E-Mart"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="w-full h-full bg-yellow-400 flex items-center justify-center text-deep-purple font-black text-xs">SE</div>';
              }}
            />
          </div>
          <span className="text-[16px] font-medium text-white tracking-tight">SCHOOL E-MART</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white relative active:scale-90 transition-all border border-white/10">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full border border-deep-purple"></span>
          </button>
        </div>
      </div>

      {/* Profile & School Section: FULLY Persistent */}
      <div className={`flex flex-col gap-4 relative z-10 transition-all duration-300 ${scrolled ? 'mb-2' : 'mb-5'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/90">
            <Package size={14} className="text-primary" />
            <span className="text-[12px] font-medium truncate max-w-[200px]">{childInfo.school}</span>
          </div>

          <button
            onClick={() => navigate('/user/my-school')}
            className="bg-black border border-[#ffc107] text-[#ffc107] text-[10px] font-bold px-4 py-1.5 rounded-full animate-shine shadow-lg shadow-black/20 active:scale-95 transition-all"
          >
            MY SCHOOL
          </button>
        </div>

        {showSearch && (
          <div className={`relative group transition-all duration-300 ease-in-out ${scrolled ? 'opacity-0 h-0 overflow-hidden pointer-events-none mt-[-16px]' : 'opacity-100 h-[44px] mt-0'}`}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search by category..."
              className="w-full pl-11 pr-11 py-2.5 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none font-medium"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
              <Filter size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppHeader;
