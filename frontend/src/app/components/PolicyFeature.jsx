import React from 'react';

const PolicyFeature = ({ icon: Icon, label, color = "text-primary" }) => {
  return (
    <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-2xl active:scale-95 transition-all">
      <Icon size={20} className={`${color} mb-2`} />
      <span className="text-[8px] font-bold text-deep-purple uppercase tracking-tight leading-none">
        {label}
      </span>
    </div>
  );
};

export default PolicyFeature;
