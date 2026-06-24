import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, ShoppingBag,
  Trash2, Building2
} from 'lucide-react';
import SchoolHeader from '../../components/SchoolHeader';
import { useWishlist } from '../../context/WishlistContext';

const SchoolWishlistPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [schoolInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : { role: 'school' };
  });

  const {
    wishlistItems,
    loading,
    removeFromWishlist,
    totalWishlistItems,
  } = useWishlist();

  const handleRemove = async (id) => {
    await removeFromWishlist(id);
  };

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  return (
    <>
      <SchoolHeader scrolled={scrolled} childInfo={schoolInfo} />
      <div onScroll={handleScroll} className="flex flex-col h-full bg-[#f8f5f2] pb-32 font-outfit overflow-y-auto">
        <div className="h-[185px] shrink-0"></div>

        <div className="px-6 mt-6">
          <div className="mb-6">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Procurement Planning</p>
            <h2 className="text-2xl font-black text-deep-purple tracking-tight">
              Institutional Wishlist ({totalWishlistItems})
            </h2>
          </div>

          {loading ? (
            <p className="text-center text-sm text-gray-400 py-16">Loading wishlist...</p>
          ) : wishlistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-6">
                <Heart size={40} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-black text-deep-purple mb-2">Wishlist is empty</h3>
              <p className="text-gray-400 text-sm max-w-[200px]">Save items you plan to procure for your school later.</p>
              <button onClick={() => navigate('/school/admin')} className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl text-xs font-bold shadow-lg">Start Browsing</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {wishlistItems.map((item) => (
                <div key={item.id} className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 flex flex-col relative group active:scale-95 transition-all">
                  <button onClick={() => handleRemove(item.id)} className="absolute top-3 right-3 p-1.5 bg-gray-50 rounded-full text-gray-300 hover:text-red-500 transition-colors z-10">
                    <Trash2 size={14} />
                  </button>
                  <div className="aspect-square bg-gray-50 rounded-2xl mb-3 overflow-hidden flex items-center justify-center p-4">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <h3 className="text-[11px] font-bold text-deep-purple line-clamp-2 h-7 mb-2 leading-tight">{item.name}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm font-black text-deep-purple">{item.price}</span>
                    <button
                      onClick={() => navigate(`/user/product/${item.id}`)}
                      className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
                    >
                      <ShoppingBag size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SchoolWishlistPage;
