import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, MessageCircle, Share2, Volume2, VolumeX, 
  Play, Pause, ChevronLeft, ShoppingBag, Send, X, 
  Bookmark, CheckCircle2, Music, Sparkles
} from 'lucide-react';
import { listPublicReels, likeReel, listReelComments, addReelComment } from '../../../services/catalogApi';
import { mapPublicReel } from '../../../utils/mappers/adminReelsMapper';

const SchoolReels = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('All');
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [floatingHearts, setFloatingHearts] = useState([]);
  const heartIdCounter = useRef(0);
  const videoRef = useRef(null);

  const [reelsData, setReelsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await listPublicReels({ limit: 50, targetApp: 'school' });
        if (!cancelled) {
          const mapped = (data || []).map(mapPublicReel);
          setReelsData(mapped);
          
          if (location.state?.initialReelId) {
            const idx = mapped.findIndex(r => r.id === location.state.initialReelId);
            if (idx !== -1) setCurrentReelIndex(idx);
          }
        }
      } catch {
        if (!cancelled) setReelsData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [location.state]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((err) => {
          console.warn("Video playback failed or was blocked:", err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentReelIndex, activeTab]);

  const categories = ['All', 'Kits', 'Uniforms', 'Stationery', 'Activities'];

  const filteredReels = activeTab === 'All' 
    ? reelsData 
    : reelsData.filter(reel => reel.category === activeTab);

  const currentReel = filteredReels[currentReelIndex] || filteredReels[0];

  useEffect(() => {
    let active = true;
    if (showComments && currentReel?.id) {
      listReelComments(currentReel.id)
        .then((res) => {
          if (!active) return;
          setReelsData((prev) =>
            prev.map((r) =>
              r.id === currentReel.id
                ? {
                    ...r,
                    comments: res.data || [],
                    commentsCount: res.commentsCount || res.total || (res.data || []).length,
                  }
                : r
            )
          );
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [showComments, currentReel?.id]);

  const handleLike = async () => {
    if (!currentReel?.id) return;
    const newHeart = {
      id: heartIdCounter.current++,
      left: Math.random() * 40 + 30,
      bottom: 20
    };
    setFloatingHearts(prev => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1000);

    try {
      const res = await likeReel(currentReel.id);
      setReelsData((prev) =>
        prev.map((r) =>
          r.id === currentReel.id
            ? { ...r, isLiked: res.isLiked, likes: res.likesCount }
            : r
        )
      );
    } catch {
      setReelsData((prev) =>
        prev.map((r) =>
          r.id === currentReel.id
            ? {
                ...r,
                isLiked: !r.isLiked,
                likes: r.isLiked ? Math.max(0, (r.likes || 0) - 1) : (r.likes || 0) + 1,
              }
            : r
        )
      );
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const nextReel = () => {
    if (filteredReels.length > 1) {
      setCurrentReelIndex((prev) => (prev + 1) % filteredReels.length);
      setIsPlaying(true);
    }
  };

  const prevReel = () => {
    if (filteredReels.length > 1) {
      setCurrentReelIndex((prev) => (prev - 1 + filteredReels.length) % filteredReels.length);
      setIsPlaying(true);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentReel?.id) return;
    const text = newComment.trim();
    setNewComment('');

    try {
      const res = await addReelComment(currentReel.id, text);
      const posted = res.comment;
      setReelsData((prev) =>
        prev.map((r) => {
          if (r.id !== currentReel.id) return r;
          const updatedComments = [posted, ...(r.comments || [])];
          return {
            ...r,
            comments: updatedComments,
            commentsCount: res.commentsCount || updatedComments.length,
          };
        })
      );
    } catch {
      alert('Failed to post comment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="relative h-full w-full bg-black flex items-center justify-center text-white/70 text-sm font-semibold">
        Loading school reels…
      </div>
    );
  }

  if (!filteredReels.length) {
    return (
      <div className="relative h-full w-full bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <button 
          onClick={() => navigate('/school/admin')}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <Sparkles size={48} className="text-primary mb-4 animate-pulse" />
        <h3 className="text-lg font-black tracking-tight">No School Reels Available</h3>
        <p className="text-xs text-white/60 mt-1 max-w-xs">
          There are no video reels currently published for the school portal.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden select-none font-outfit">
      {/* Video Canvas */}
      <div className="relative h-full w-full flex items-center justify-center">
        <video
          ref={videoRef}
          src={currentReel?.videoUrl}
          poster={currentReel?.thumb}
          loop
          muted={isMuted}
          playsInline
          className="h-full w-full object-cover cursor-pointer"
          onClick={() => setIsPlaying(!isPlaying)}
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {!isPlaying && (
          <div 
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 animate-pulse">
              <Play size={32} fill="white" className="ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Floating Hearts Animation */}
      {floatingHearts.map(heart => (
        <div
          key={heart.id}
          className="absolute z-30 pointer-events-none animate-float-up text-red-500"
          style={{ left: `${heart.left}%`, bottom: `${heart.bottom}%` }}
        >
          <Heart size={36} fill="currentColor" />
        </div>
      ))}

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between">
        <button 
          onClick={() => navigate('/school/admin')}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto max-w-[240px] scrollbar-hide py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat);
                setCurrentReelIndex(0);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                activeTab === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'bg-black/40 text-white/70 border border-white/10 backdrop-blur-md'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Right Action Sidebar */}
      <div className="absolute right-4 bottom-28 z-20 flex flex-col items-center gap-5">
        {/* Like */}
        <button 
          onClick={handleLike}
          className="flex flex-col items-center gap-1 text-white active:scale-75 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center">
            <Heart size={24} className="text-white hover:text-red-500 hover:fill-red-500 transition-colors" />
          </div>
          <span className="text-[10px] font-black tracking-wide">Like</span>
        </button>

        {/* Comment */}
        <button 
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1 text-white active:scale-75 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center">
            <MessageCircle size={24} />
          </div>
          <span className="text-[10px] font-black tracking-wide">
            {currentReel?.comments?.length || 0}
          </span>
        </button>

        {/* Share */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-white active:scale-75 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center">
            <Share2 size={22} />
          </div>
          <span className="text-[10px] font-black tracking-wide">Share</span>
        </button>
      </div>

      {/* Navigation Touch Controls for Next/Prev Reel */}
      <div className="absolute inset-y-24 inset-x-12 z-10 flex flex-col justify-between pointer-events-none">
        <div 
          onClick={prevReel}
          className="h-1/2 w-full pointer-events-auto cursor-pointer"
        />
        <div 
          onClick={nextReel}
          className="h-1/2 w-full pointer-events-auto cursor-pointer"
        />
      </div>

      {/* Bottom Reel Details */}
      <div className="absolute bottom-6 left-4 right-20 z-20 text-left space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center border border-white/20">
            SE
          </div>
          <span className="text-xs font-black text-white drop-shadow">
            School E-Mart Official
          </span>
        </div>

        <div>
          <h3 className="text-sm font-black text-white leading-tight drop-shadow line-clamp-1">
            {currentReel?.title}
          </h3>
          <p className="text-xs text-white/80 font-medium line-clamp-2 mt-1 drop-shadow">
            {currentReel?.description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-white/70 text-[11px] font-bold">
          <Music size={12} className="animate-spin-slow text-primary" />
          <span className="truncate">{currentReel?.music}</span>
        </div>

        {/* Linked Product Banner */}
        {currentReel?.product && (
          <div 
            onClick={() => navigate('/school/categories')}
            className="bg-white/15 backdrop-blur-xl border border-white/20 p-2.5 rounded-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={currentReel.product.image} 
                alt={currentReel.product.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0" 
              />
              <div className="min-w-0">
                <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest block">
                  {currentReel.product.badge}
                </span>
                <h4 className="text-xs font-black text-white truncate leading-tight">
                  {currentReel.product.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-black text-white">{currentReel.product.price}</span>
                  <span className="text-[10px] text-white/60 line-through">{currentReel.product.originalPrice}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0">
              <ShoppingBag size={12} />
              <span>Shop</span>
            </div>
          </div>
        )}
      </div>

      {/* Share Toast Notification */}
      {showShareToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} className="text-emerald-500" />
          Reel link copied to clipboard!
        </div>
      )}

      {/* Comments Drawer */}
      {showComments && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[2.5rem] p-6 max-h-[70vh] flex flex-col text-left">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h4 className="text-base font-black text-gray-900">
                Comments ({currentReel?.comments?.length || 0})
              </h4>
              <button 
                onClick={() => setShowComments(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {(!currentReel?.comments || currentReel.comments.length === 0) ? (
                <div className="text-center py-8 text-xs font-bold text-gray-400">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                currentReel.comments.map((c) => {
                  const userName = typeof c.user === 'object' ? (c.user?.name || 'School E-Mart Member') : (c.user || 'School E-Mart Member');
                  const commentBody = c.body || c.text || '';
                  const initial = (userName[0] || 'S').toUpperCase();
                  const timeText = c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (c.time || 'Just now');
                  return (
                    <div key={c.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-900">{userName}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{timeText}</span>
                        </div>
                        <p className="text-xs font-medium text-gray-600 mt-0.5">{commentBody}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleAddComment} className="pt-3 border-t border-gray-100 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a comment for school..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button 
                type="submit"
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 active:scale-95"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolReels;
