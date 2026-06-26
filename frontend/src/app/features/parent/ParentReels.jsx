import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, MessageCircle, Share2, Volume2, VolumeX, 
  Play, Pause, ChevronLeft, ShoppingBag, Send, X, 
  Bookmark, CheckCircle2, Music, Sparkles
} from 'lucide-react';

const ParentReels = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [savedReels, setSavedReels] = useState({});
  const [floatingHearts, setFloatingHearts] = useState([]);
  const heartIdCounter = useRef(0);

  // No reels API — empty until backend support exists
  const [reelsData] = useState([]);

  const categories = ['All', 'Kits', 'Uniforms', 'Stationery', 'Activities'];

  const filteredReels = activeTab === 'All' 
    ? reelsData 
    : reelsData.filter(reel => reel.category === activeTab);

  const currentReel = filteredReels[currentReelIndex] || filteredReels[0];

  const handleLike = () => {};

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

  const handleAddComment = (e) => {
    e.preventDefault();
  };

  if (!currentReel) {
    return (
      <div className="relative h-full w-full bg-black flex flex-col font-outfit">
        <div className="px-4 pt-4 pb-2">
          <button 
            onClick={() => navigate('/user/home')}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <Sparkles size={48} className="text-white/20 mb-4" />
          <h2 className="text-white text-lg font-bold mb-2">No reels yet</h2>
          <p className="text-white/60 text-sm">Check back later for school stories and product highlights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black flex flex-col justify-between overflow-hidden font-outfit select-none">
      {/* Background Simulation Player */}
      <div 
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute inset-0 z-0 cursor-pointer"
      >
        <img 
          src={currentReel.thumb} 
          alt={currentReel.title} 
          className="w-full h-full object-cover transition-all duration-700 brightness-[0.7]" 
        />
        
        {/* Pulsing Play Overlay Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white scale-90 animate-ping">
              <Play size={28} fill="white" className="ml-1" />
            </div>
          </div>
        )}

        {/* Dynamic Scanline or Sparkles visual effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* FLOATING HEARTS (For premium like micro-animations) */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute pointer-events-none z-50 text-red-500 animate-float-heart"
          style={{
            left: `${heart.left}%`,
            bottom: `${heart.bottom}%`,
            transform: `scale(${heart.scale})`,
            animationDelay: `${heart.delay}ms`,
            animationDuration: '2s',
            position: 'absolute'
          }}
        >
          <Heart size={32} fill="currentColor" />
        </div>
      ))}

      {/* Header Panel */}
      <div className="relative z-10 w-full px-4 pt-4 pb-2 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/user/home')}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-white font-bold text-base tracking-wide flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
            <Sparkles size={14} className="text-[#FFC933] animate-pulse" />
            Explore Reels
          </span>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex gap-2 overflow-x-auto mt-4 scrollbar-hide py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(cat);
                setCurrentReelIndex(0);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all cursor-pointer border ${
                activeTab === cat 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-white/10 border-white/10 text-gray-200 backdrop-blur-md'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Reel Swiping navigation HUD */}
      {filteredReels.length > 1 && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              prevReel();
            }}
            className="w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/50 active:scale-90 transition-all cursor-pointer"
          >
            ▲
          </button>
          <span className="text-[10px] text-white/80 font-black text-center bg-black/40 px-1 py-0.5 rounded backdrop-blur-[2px]">
            {currentReelIndex + 1}/{filteredReels.length}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              nextReel();
            }}
            className="w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/50 active:scale-90 transition-all cursor-pointer"
          >
            ▼
          </button>
        </div>
      )}

      {/* Right-Side Action Icons Panel */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-10 select-none">
        
        {/* Share Action */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="w-12 h-12 rounded-full bg-black/30 border border-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg active:scale-75 hover:bg-black/50 transition-all cursor-pointer"
          >
            <Share2 size={21} />
          </button>
          <span className="text-[10px] font-bold text-white mt-1 text-shadow-md">Share</span>
        </div>

        {/* Rotating School Vinyl */}
        <div className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden relative mt-2 animate-spin-slow shadow-lg shadow-black/40">
          <img src={currentReel.thumb} alt="music cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-black/40"></div>
          </div>
        </div>

      </div>

      {/* Bottom Panel: Details & Shop Featured Products */}
      <div className="relative z-10 w-full px-4 pb-6 pt-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-4">
        
        {/* Description & Metadata */}
        <div className="flex flex-col gap-2.5 max-w-[80%] select-text">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-extrabold text-xs shadow-md border border-white/10 shrink-0">
              SE
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-white text-sm font-black truncate">School E-Mart Official</span>
                <CheckCircle2 size={13} fill="#5B3FD6" className="text-white shrink-0" />
              </div>
              <span className="text-gray-400 text-[10px] font-medium leading-none">{currentReel.views} views</span>
            </div>
          </div>

          <h3 className="text-white text-base font-extrabold tracking-tight leading-snug">
            {currentReel.title}
          </h3>

          <p className="text-gray-200 text-xs font-semibold leading-relaxed line-clamp-2">
            {currentReel.description}
          </p>

          <div className="flex items-center gap-1.5 text-gray-300 mt-0.5">
            <Music size={12} className="shrink-0" />
            <span className="text-[10px] font-bold tracking-tight truncate w-full max-w-[150px]">
              {currentReel.music}
            </span>
          </div>
        </div>

        {/* Featured Product Capsule: Direct purchase linking! */}
        {currentReel.product && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/user/product/${currentReel.product.id}`);
            }}
            className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 active:scale-[0.98] transition-all hover:bg-white/15 cursor-pointer shadow-xl shadow-black/20"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative bg-white/10 border border-white/10">
                <img src={currentReel.product.image} alt={currentReel.product.name} className="w-full h-full object-cover" />
                <span className="absolute top-0.5 left-0.5 px-1 py-[1px] bg-amber-400 text-black text-[7px] font-black rounded tracking-wide leading-none uppercase">
                  {currentReel.product.badge}
                </span>
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-white text-xs font-black truncate leading-tight">
                  {currentReel.product.name}
                </p>
                <div className="flex items-baseline gap-1.5 mt-1 leading-none">
                  <span className="text-[#FFC933] text-xs font-black">{currentReel.product.price}</span>
                  <span className="text-gray-400 text-[9px] font-bold line-through">{currentReel.product.originalPrice}</span>
                </div>
              </div>
            </div>

            <button 
              className="px-3.5 py-2 bg-gradient-to-r from-[#FFC933] to-[#F4B400] text-black text-[11px] font-extrabold rounded-xl shadow-md flex items-center gap-1.5 active:scale-90 transition-all shrink-0 cursor-pointer"
            >
              <ShoppingBag size={12} strokeWidth={2.5} />
              Shop Now
            </button>
          </div>
        )}

      </div>

      {/* SLEEK GLASSMORPHIC BOTTOM SHEET COMMENTS TRAY */}
      {showComments && (
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-50 transition-opacity duration-300 flex flex-col justify-end"
          onClick={() => setShowComments(false)}
        >
          <div 
            className="bg-[#121214] border-t border-white/10 rounded-t-[2.5rem] h-[65%] w-full flex flex-col relative animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Drag Bar indicator */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3.5 mb-1 shrink-0"></div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0">
              <span className="text-white text-base font-extrabold tracking-wide">
                Comments ({currentReel.comments.length})
              </span>
              <button 
                onClick={() => setShowComments(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Comments List Container */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4.5 scrollbar-hide select-text">
              {currentReel.comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <MessageCircle size={32} className="text-gray-600 animate-bounce" />
                  <p className="text-gray-400 text-sm font-semibold">No comments yet</p>
                  <p className="text-gray-500 text-xs">Be the first to share your thoughts!</p>
                </div>
              ) : (
                currentReel.comments.map((cmt) => (
                  <div key={cmt.id} className="flex gap-3 items-start group">
                    <div className="w-8.5 h-8.5 rounded-full bg-[#5B3FD6]/20 border border-[#5B3FD6]/20 flex items-center justify-center text-white font-black text-xs shrink-0 select-none">
                      {cmt.user.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-gray-200 text-xs font-black truncate">{cmt.user}</span>
                        {cmt.user.includes('You') && (
                          <span className="px-1.5 py-0.5 bg-[#5B3FD6]/25 border border-[#5B3FD6]/35 text-[#a899ff] text-[8px] font-black rounded uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-xs font-medium leading-relaxed mt-1.5 select-text">
                        {cmt.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form Input bar */}
            <form 
              onSubmit={handleAddComment}
              className="p-4 border-t border-white/5 bg-[#18181C] flex items-center gap-3 shrink-0"
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a friendly comment as parent..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-semibold placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/10 transition-all select-text"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  newComment.trim() 
                    ? 'bg-primary text-white active:scale-90 shadow-md shadow-primary/20' 
                    : 'bg-white/5 text-gray-600 border border-white/5'
                }`}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* High-Fidelity Copied Clipboard Toast */}
      {showShareToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-500 border border-green-400/35 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 z-50 animate-toast-fade-in shadow-green-500/20">
          <CheckCircle2 size={14} className="shrink-0" />
          Link successfully copied! Share with friends!
        </div>
      )}
    </div>
  );
};

export default ParentReels;
