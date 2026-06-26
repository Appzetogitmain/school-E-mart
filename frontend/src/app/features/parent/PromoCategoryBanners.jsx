import React, { useEffect, useState } from 'react';
import { listBanners } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const PromoCategoryBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await listBanners({ limit: 10, isActive: true });
        if (!cancelled) {
          setBanners(
            (data || [])
              .filter((b) => b.isActive !== false)
              .map((b) => ({
                id: b._id || b.id,
                title: b.title || b.slug || 'Promotion',
                image: b.imageUrl || b.image || b.images?.[0]?.url,
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

  if (loading) {
    return (
      <div className="mt-10 px-6 min-h-[80px] flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading promotions…</p>
      </div>
    );
  }

  if (!banners.length) {
    if (error) return null;
    return null;
  }

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
