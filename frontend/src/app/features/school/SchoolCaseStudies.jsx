import React from 'react';

const SchoolCaseStudies = ({ reelsRef }) => {
  const caseStudies = [
    { 
      id: 1, 
      title: "Modernizing Classrooms", 
      badge: "School Spotlight", 
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=300&h=533&fit=crop" 
    },
    { 
      id: 2, 
      title: "Smart Inventory Management", 
      badge: "Expert Insights", 
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300&h=533&fit=crop" 
    }
  ];

  return (
    <div className="px-6 pb-8 mt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-deep-purple -ml-1">
          Case Studies
        </h2>
        <button 
          type="button"
          className="text-primary text-xs font-black hover:underline"
        >
          Read All
        </button>
      </div>

      <div 
        ref={reelsRef} 
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide select-none active:cursor-grabbing"
      >
        {caseStudies.map((item) => (
          <div 
            key={item.id} 
            className="min-w-[160px] h-[280px] rounded-[2rem] overflow-hidden relative group active:scale-95 transition-all shadow-xl shadow-gray-200/20 border border-gray-100"
          >
            {/* Image */}
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />

            {/* Bottom Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-4">
              <span className="text-[#ffc107] text-[8px] font-black uppercase tracking-wider mb-1">
                {item.badge}
              </span>
              <h4 className="text-white text-xs font-black leading-snug">
                {item.title}
              </h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchoolCaseStudies;
