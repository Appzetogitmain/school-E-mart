import React from 'react';

const PromoCategoryBanners = () => {
  const banners = [
    { id: 1, title: "Modern Uniforms", image: "/assets/category_banner1.png" },
    { id: 2, title: "Institutional Quality", image: "/assets/category_banner2.png" },
    { id: 3, title: "Science & Lab Setup", image: "/assets/category_banner3.png" }
  ];

  return (
    <div className="mt-10 relative z-10 min-h-[190px] select-none text-left">
      <div className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x snap-mandatory scrollbar-hide">
        {banners.map((banner) => (
          <div 
            key={banner.id} 
            className="min-w-[300px] h-[180px] rounded-2xl relative overflow-hidden snap-center flex-shrink-0 bg-primary/5 shadow-md border border-gray-100"
          >
            <img 
              src={banner.image} 
              alt={banner.title} 
              className="absolute inset-0 w-full h-full object-cover" 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromoCategoryBanners;
