import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Minus, Plus, ShieldCheck, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import AuthPrompt from './AuthPrompt';

const ProductCard = ({ product, showBuyNow = true }) => {
  const { addToCart, updateQuantity, getProductQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [showToast, setShowToast] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const isWishlisted = isInWishlist(product.id);
  const quantity = getProductQuantity(product.id);

  const isGuest = !localStorage.getItem('childInfo');

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    addToCart(product);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    toggleWishlist(product);
  };

  const handleUpdate = (e, delta) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, delta);
  };

  const price = typeof product.price === 'string' 
    ? product.price 
    : `₹${product.price}`;
    
  const originalPrice = product.originalPrice 
    ? (typeof product.originalPrice === 'string' ? product.originalPrice : `₹${product.originalPrice}`)
    : null;

  const calculateDiscount = () => {
    const p = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
    const op = typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice.replace(/[^\d.]/g, '')) : product.originalPrice;
    if (!p || !op || op <= p) return null;
    return Math.round(((op - p) / op) * 100);
  };

  const discount = calculateDiscount();

  return (
    <div className="relative group/card">
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-[100] w-max animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300">
          <div className="bg-deep-purple text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/10">
            <ShieldCheck size={12} className="text-green-400" />
            <span className="text-[10px] font-bold">Added to cart</span>
          </div>
        </div>
      )}
      
      <Link 
        to={`/user/product/${product.id}`}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden group active:scale-[0.98] transition-all cursor-pointer h-full"
      >
        {/* Image & Actions */}
        <div className="relative aspect-square bg-gray-50/50 p-4">
          <div className="absolute top-3 left-3 bg-[#ef4444] text-white text-[9px] font-black px-2 py-1 rounded-lg z-10 shadow-sm">
            {discount ? `${discount}% OFF` : 'SALE'}
          </div>
          <button 
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center transition-all z-20 shadow-sm active:scale-75 ${isWishlisted ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
          >
            <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
          <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Details */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
              {product.category || product.type || 'Essential'}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <Star size={8} fill="#ffc107" className="text-yellow-400" />
              <span className="text-[9px] font-bold text-gray-400">{product.rating || '4.5'}</span>
            </div>
          </div>
          <h3 className="text-[12px] font-bold text-deep-purple leading-snug line-clamp-2 h-8 mb-2">
            {product.name}
          </h3>

          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-base font-black text-black">{price}</span>
              {originalPrice && (
                <span className="text-[10px] text-gray-300 line-through font-medium">{originalPrice}</span>
              )}
            </div>

            {showBuyNow && (
              <div className="mt-auto">
                {quantity === 0 ? (
                  <button 
                    onClick={handleAdd}
                    className="w-full py-2.5 bg-golden-yellow text-deep-purple rounded-2xl text-[11px] font-black shadow-lg shadow-yellow-100 active:scale-95 transition-all flex items-center justify-center gap-2 relative z-20 hover:bg-yellow-400"
                  >
                    <ShoppingCart size={14} /> Add to Cart
                  </button>
                ) : (
                  <div 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="w-full py-1.5 bg-primary/10 rounded-2xl flex items-center justify-between px-2 border border-primary/20 animate-in fade-in zoom-in duration-300 active:scale-95 transition-all relative z-20"
                  >
                    <button 
                      onClick={(e) => handleUpdate(e, -1)}
                      className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-[13px] font-black text-primary w-8 text-center">{quantity}</span>
                    <button 
                      onClick={(e) => handleUpdate(e, 1)}
                      className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

      <AuthPrompt 
        isOpen={isAuthPromptOpen} 
        onClose={() => setIsAuthPromptOpen(false)} 
        title="Join the Club!"
        message="Login to save items, build your cart, and enjoy a personalized shopping experience."
      />
    </div>
  );
};

export default ProductCard;
