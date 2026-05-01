import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

/**
 * MOCK CMS DATA
 * Using local assets from /public/assets
 */
const BANNER_INVENTORY = {
  parent: [
    {
      id: 'p_1',
      mode: 'creative',
      image: '/assets/Hero_promo_banner.png',
      link: '#',
    },
    {
      id: 'p_2',
      mode: 'creative',
      image: '/assets/Hero_promo_banner_2.png',
      link: '#',
    }
  ],
  school: [
    {
      id: 's_1',
      mode: 'template',
      image: 'https://images.unsplash.com/photo-1523050335392-9bef867a4975?auto=format&fit=crop&q=80&w=1200',
      title: 'Institutional Bulk Procurement',
      subtitle: 'Get direct factory-to-school pricing on furniture, uniforms, and tech.',
      badge: 'B2B Exclusive',
      ctaText: 'Get Bulk Quote',
      link: '#',
    },
    {
      id: 's_2',
      mode: 'template',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1200',
      title: 'Modern Lab & STEM Setup',
      subtitle: 'Upgrade your school infrastructure with state-of-the-art equipment.',
      badge: 'New Launch',
      ctaText: 'Explore Setup',
      link: '#',
    }
  ],
  side: [
    {
      id: 'side_1',
      mode: 'creative',
      image: '/assets/promo_banner_1.png',
      link: '#',
    },
    {
      id: 'side_2',
      mode: 'creative',
      image: '/assets/promo_banner_2.png',
      link: '#',
    }
  ]
};

const parentCategories = [
  { name: 'Kits', image: '/assets/lab_and_science.png' },
  { name: 'Books', image: '/assets/books.png' },
  { name: 'Uniforms', image: '/assets/uniforms.png' },
  { name: 'Stationery', image: '/assets/stationary.png' },
  { name: 'Bags', image: '/assets/transport.png' },
  { name: 'Sports', image: '/assets/toys_and_sports.png' },
  { name: 'Shoes', image: '/assets/uniforms.png' },
  { name: 'Art', image: '/assets/toys_and_sports.png' },
];

const schoolCategories = [
  { name: 'Furniture', image: '/assets/furniture.png' },
  { name: 'Lab Equip', image: '/assets/lab_and_science.png' },
  { name: 'Bulk Books', image: '/assets/books.png' },
  { name: 'Bulk Uniforms', image: '/assets/uniforms.png' },
  { name: 'IT Tech', image: '/assets/technology.png' },
  { name: 'Sports Infra', image: '/assets/toys_and_sports.png' },
  { name: 'Smart Class', image: '/assets/electronics.png' },
  { name: 'Security', image: '/assets/safety.png' },
];

const PromoBanner = ({ banner, className = '' }) => {
  const navigate = useNavigate();
  const isTemplate = banner.mode === 'template';

  return (
    <div 
      className={`relative w-full h-full overflow-hidden cursor-pointer group bg-white flex items-center justify-center ${className}`}
      onClick={() => navigate(banner.link)}
    >
      <img 
        src={banner.image} 
        alt={banner.title || 'Promotion'} 
        className={`${isTemplate ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'} transition-transform duration-1000 group-hover:scale-[1.05]`}
      />
      {isTemplate && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center px-12">
          <div className="max-w-md">
            {banner.badge && (
              <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase rounded mb-4">
                {banner.badge}
              </span>
            )}
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">{banner.title}</h2>
            <p className="text-white/90 text-[15px] mb-8 leading-relaxed">{banner.subtitle}</p>
            <button className="px-8 py-3 bg-white text-primary rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all shadow-lg active:scale-95">
              {banner.ctaText || 'Shop Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Hero = ({ role = 'parent' }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const currentMainBanners = BANNER_INVENTORY[role] || BANNER_INVENTORY.parent;
  const categories = role === 'school' ? schoolCategories : parentCategories;

  useEffect(() => {
    if (currentMainBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % currentMainBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentMainBanners]);

  return (
    <section className="py-6 bg-[#fafbff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Inventory Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-10">
          <div className="lg:col-span-8 relative rounded-[2.5rem] overflow-hidden min-h-[460px] shadow-sm bg-white border border-gray-100">
            {currentMainBanners.map((banner, idx) => (
              <div 
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <PromoBanner banner={banner} />
              </div>
            ))}
            <div className="absolute bottom-8 left-12 z-20 flex gap-2">
              {currentMainBanners.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveSlide(idx); }}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeSlide ? 'w-10 bg-primary' : 'w-2 bg-black/20 hover:bg-black/40'}`}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-5">
            {BANNER_INVENTORY.side.map((banner) => (
              <div key={banner.id} className="flex-1 rounded-[2.5rem] overflow-hidden shadow-sm min-h-[220px] bg-white border border-gray-100">
                <PromoBanner banner={banner} />
              </div>
            ))}
          </div>
        </div>

        {/* REFINED Category Navigation */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-10">
            {categories.map((cat, idx) => (
              <div 
                key={idx}
                className="flex flex-col items-center gap-4 min-w-[90px] group cursor-pointer"
              >
                <div className="w-16 h-16 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:rotate-6"
                  />
                </div>
                <span className="text-[13px] font-medium text-text-primary tracking-tight transition-colors group-hover:text-primary whitespace-nowrap">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
