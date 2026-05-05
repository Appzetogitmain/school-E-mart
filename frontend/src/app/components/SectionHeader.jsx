import React from 'react';
import { ArrowRight } from 'lucide-react';

const SectionHeader = ({ title, subtitle, onViewAll, viewAllLabel = "View All", className = "" }) => {
  return (
    <div className={`px-6 flex items-center justify-between mb-4 ${className}`}>
      <div>
        <h2 className="text-lg font-bold text-deep-purple">{title}</h2>
        {subtitle && <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>}
      </div>
      {onViewAll && (
        <button 
          onClick={onViewAll}
          className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all"
        >
          {viewAllLabel} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
