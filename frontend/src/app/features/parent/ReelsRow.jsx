import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Video } from 'lucide-react';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { listPublicReels } from '../../../services/catalogApi';
import { mapPublicReel } from '../../../utils/mappers/adminReelsMapper';

const ReelsRow = ({ targetApp = 'parent', title = 'Watch & Explore' }) => {
  const navigate = useNavigate();
  const reelsRef = useDraggableScroll();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  const reelsRoute = targetApp === 'school' ? '/school/reels' : '/user/reels';

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await listPublicReels({ limit: 8, targetApp });
        if (!cancelled) {
          setReels((data || []).map(mapPublicReel));
        }
      } catch {
        if (!cancelled) setReels([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [targetApp]);

  if (loading) {
    return (
      <div className="px-6 pb-8 select-none text-left">
        <div className="text-sm text-gray-400 font-semibold py-8">Loading reels…</div>
      </div>
    );
  }

  if (!reels.length) {
    return (
      <div className="px-6 pb-8 select-none text-left">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-deep-purple">{title}</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
          <Video size={32} className="text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No reels available yet</p>
          <p className="text-xs text-gray-400 mt-1">Check back soon for product videos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-8 select-none text-left">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-deep-purple">{title}</h2>
        </div>
        <button
          onClick={() => navigate(reelsRoute)}
          className="text-primary text-xs font-bold cursor-pointer active:scale-95 transition-transform"
        >
          Watch All
        </button>
      </div>

      <div
        ref={reelsRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide active:cursor-grabbing"
      >
        {reels.map((reel) => (
          <div
            key={reel.id}
            onClick={() => navigate(reelsRoute, { state: { initialReelId: reel.id } })}
            className="min-w-[160px] h-[280px] rounded-[2rem] overflow-hidden relative group active:scale-95 transition-all shadow-lg border border-white/20 cursor-pointer"
          >
            <img
              src={reel.thumb}
              alt={reel.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                <Play size={16} fill="currentColor" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReelsRow;
