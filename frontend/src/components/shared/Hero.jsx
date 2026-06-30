import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPublicBanners } from '../../services/catalogApi';
import { useCategoryTree } from '../../hooks/useCategoryTree';

const PromoBanner = ({ banner, className = '' }) => {
  const navigate = useNavigate();
  const isTemplate = banner.mode === 'template';

  return (
    <div
      className={`relative w-full h-full overflow-hidden cursor-pointer group bg-white flex items-center justify-center ${className}`}
      onClick={() => banner.link && navigate(banner.link)}
    >
      <img
        src={banner.image}
        alt={banner.title || 'Promotion'}
        className={`${isTemplate ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'} transition-transform duration-1000 group-hover:scale-[1.05]`}
      />
      {isTemplate && banner.title && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center px-12">
          <div className="max-w-md">
            {banner.badge && (
              <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase rounded mb-4">
                {banner.badge}
              </span>
            )}
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">{banner.title}</h2>
            {banner.subtitle && (
              <p className="text-white/90 text-[15px] mb-8 leading-relaxed">{banner.subtitle}</p>
            )}
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
  const [mainBanners, setMainBanners] = useState([]);
  const [sideBanners, setSideBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tree: categoryTree } = useCategoryTree();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await listPublicBanners({ limit: 20, audience: role });
        const mapped = (data || [])
          .filter((b) => b.isActive !== false)
          .map((b) => ({
            id: b._id || b.id,
            mode: b.mode || 'creative',
            image: b.imageUrl || b.image || b.images?.[0]?.url,
            title: b.title,
            subtitle: b.subtitle,
            badge: b.badge,
            ctaText: b.ctaText,
            link: b.targetUrl || b.link,
            placement: b.placement || 'main',
          }))
          .filter((b) => b.image);

        if (!cancelled) {
          setMainBanners(mapped.filter((b) => b.placement !== 'side'));
          setSideBanners(mapped.filter((b) => b.placement === 'side'));
        }
      } catch {
        if (!cancelled) {
          setMainBanners([]);
          setSideBanners([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const categories = categoryTree.map((cat) => ({
    name: cat.name,
    image: cat.image,
    slug: cat.slug,
  }));

  useEffect(() => {
    if (mainBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % mainBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [mainBanners.length]);

  return (
    <section className="py-6 bg-[#fafbff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-10">
          <div className="lg:col-span-8 relative rounded-[2.5rem] overflow-hidden min-h-[460px] shadow-sm bg-white border border-gray-100">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                Loading banners…
              </div>
            ) : mainBanners.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                No promotional banners available
              </div>
            ) : (
              mainBanners.map((banner, idx) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <PromoBanner banner={banner} />
                </div>
              ))
            )}
            {mainBanners.length > 1 && (
              <div className="absolute bottom-8 left-12 z-20 flex gap-2">
                {mainBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setActiveSlide(idx); }}
                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeSlide ? 'w-10 bg-primary' : 'w-2 bg-black/20 hover:bg-black/40'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col gap-5">
            {sideBanners.length === 0 && !loading ? (
              <div className="flex-1 rounded-[2.5rem] overflow-hidden shadow-sm min-h-[220px] bg-white border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
                No side banners
              </div>
            ) : (
              sideBanners.map((banner) => (
                <div key={banner.id} className="flex-1 rounded-[2.5rem] overflow-hidden shadow-sm min-h-[220px] bg-white border border-gray-100">
                  <PromoBanner banner={banner} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
          {categories.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No categories available</p>
          ) : (
            <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-10">
              {categories.map((cat) => (
                <div
                  key={cat.slug || cat.name}
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
          )}
        </div>

      </div>
    </section>
  );
};

export default Hero;
