import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ArrowLeft, ShoppingCart, Sparkles } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import ProductCard from '../../components/ProductCard';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlistItems, totalWishlistItems } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center px-6 text-center font-outfit">
        <div className="w-64 h-64 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-primary/5 animate-in zoom-in duration-700">
          <div className="relative">
            <Heart size={80} className="text-primary/10" />
            <Sparkles size={24} className="text-golden-yellow absolute -top-2 -right-2 animate-bounce" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-deep-purple mb-2">Your wishlist is empty</h2>
        <p className="text-gray-400 text-sm font-medium mb-10 max-w-[240px]">
          Save items you love to buy them later. Start exploring our school collection!
        </p>
        <Link 
          to="/user/home"
          className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-deep-purple p-1 active:scale-90 transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-black text-deep-purple tracking-tight">Wishlist ({totalWishlistItems})</h1>
        </div>
        <Link to="/user/cart" className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary active:scale-90 transition-all relative">
          <ShoppingCart size={20} />
        </Link>
      </div>

      <div className="pt-24 px-6">
        <div className="grid grid-cols-2 gap-4">
          {wishlistItems.map((product) => (
            <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
