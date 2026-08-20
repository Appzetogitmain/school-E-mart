import React, { useEffect, useState, useRef } from 'react';
import { listPublicBanners } from '../../../services/catalogApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { toAbsoluteUrl } from '../../../utils/url';

const PromoCategoryBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await listPublicBanners({ limit: 10, audience: 'parent' });
        if (!cancelled) {
          setBanners(
            (data || [])
              .filter((b) => b.isActive !== false)
              .map((b) => ({
                id: b._id || b.id,
                title: b.title || b.slug || 'Promotion',
                image: toAbsoluteUrl(b.imageUrl || b.image || b.images?.[0]?.url),
                targetUrl: b.targetUrl || b.link,
              }))
              .filter((b) => b.image)
          );
        }
      } catch (err) {
        if (!cancelled) {
          setBanners([]);
          setError(getErrorMessage(err, 'Unable to load banners'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const newIndex = Math.round(scrollLeft / clientWidth);
      setActiveIndex(newIndex);
    }
  };

  if (loading || !banners.length) {
    return null;
  }

  return (
    <div className="mt-6 px-5 sm:px-6 relative z-10 select-none text-left w-full font-outfit">
      <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden rounded-[1.75rem] shadow-md border border-gray-150 bg-gray-900">
        {/* Banner Slider Container - Fixed Frame Size */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth"
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              onClick={() => {
                if (banner.targetUrl) {
                  window.location.href = banner.targetUrl;
                }
              }}
              className="w-full h-full shrink-0 snap-center relative flex items-center justify-center cursor-pointer group bg-gray-900 overflow-hidden"
            >
              {/* Fixed Size Banner Image */}
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover sm:object-contain block mx-auto transition-transform duration-500 group-hover:scale-[1.01]"
              />
            </div>
          ))}
        </div>

        {/* Dots Indicator (if multiple banners) */}
        {banners.length > 1 && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
            {banners.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                  activeIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoCategoryBanners;
