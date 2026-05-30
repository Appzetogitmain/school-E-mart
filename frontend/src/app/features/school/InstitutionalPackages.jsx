import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader';

const InstitutionalPackages = ({ packages, kitsRef, onBuyClick }) => {
  const navigate = useNavigate();

  return (
    <div className="mt-8">
      <SectionHeader
        title="Institutional Packages"
        onViewAll={() => navigate('/school/products')}
        className="-ml-1"
      />
      <div 
        ref={kitsRef} 
        className="flex gap-5 overflow-x-auto px-6 pb-6 scrollbar-hide select-none active:cursor-grabbing"
      >
        {packages.map((kit) => (
          <Link
            key={kit.id}
            to={`/school/kit/${kit.id}`}
            className="min-w-[280px] bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-200/40 group active:scale-95 transition-all border border-gray-100 block"
          >
            {/* Image & Badge Block */}
            <div className="h-48 relative overflow-hidden">
              <img 
                src={kit.image} 
                alt={kit.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute top-4 left-4 bg-primary text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md">
                {kit.badge}
              </div>
            </div>

            {/* Content Details Block */}
            <div className="p-5 space-y-1.5">
              <h3 className="font-black text-deep-purple text-base tracking-tight leading-snug">
                {kit.name}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-3">
                Optimized for institutional bulk supply
              </p>
              
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col">
                  <span className="text-primary font-black text-lg leading-none">{kit.price}</span>
                  <span className="text-[9px] text-gray-450 font-bold mt-1">per unit avg.</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => onBuyClick(e)}
                  className="px-5 py-2.5 bg-amber-400 text-deep-purple hover:bg-amber-500 rounded-2xl text-xs font-black shadow-lg shadow-amber-100 flex items-center gap-2 active:scale-90 transition-all relative z-10"
                >
                  Order Bulk
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default InstitutionalPackages;
