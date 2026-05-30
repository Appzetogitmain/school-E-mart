import React from 'react';

const VendorSpotlights = ({ bannerImage = "/assets/category_banner2.png" }) => {
  return (
    <div className="mt-8 px-6">
      <h2 className="text-lg font-black text-deep-purple mb-4 -ml-1">
        Vendor Spotlights
      </h2>
      <div className="rounded-[2.2rem] h-44 overflow-hidden relative mb-4 shadow-xl shadow-gray-200/40 border border-gray-100 group">
        <img 
          src={bannerImage} 
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" 
          alt="Vendor Spotlight Promo" 
        />
        {/* Subtle glass overlay reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </div>
  );
};

export default VendorSpotlights;
