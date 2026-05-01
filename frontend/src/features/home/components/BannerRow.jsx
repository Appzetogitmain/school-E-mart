import React from 'react';
import { Link } from 'react-router-dom';

const PromotionBanner = ({ image, title, subtitle, badge, link }) => {
  const Content = (
    <div className="relative group overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
      <div className="aspect-[16/9] overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );

  if (link) {
    return <Link to={link}>{Content}</Link>;
  }

  return Content;
};

const BannerRow = ({ banners }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {banners.map((banner, index) => (
          <PromotionBanner key={index} {...banner} />
        ))}
      </div>
    </div>
  );
};

export default BannerRow;
