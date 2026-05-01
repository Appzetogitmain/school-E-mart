import React, { useState } from 'react';
import { ShoppingCart, ArrowRight, MessageSquareQuote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { ROUTES } from '../../constants/routes';
import LoginPromptModal from '../shared/LoginPromptModal';

const ProductCard = ({ 
  product = {
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=80&w=600',
    category: 'Furniture & Accessories',
    title: 'Modern Ergonomic Classroom Student Desk',
    currentPrice: 4971,
    originalPrice: 5990,
    discount: 17,
    hasBulkQuote: true,
    moq: '10 Units'
  },
  role = 'parent'
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const {
    image,
    category,
    title,
    currentPrice,
    originalPrice,
    discount,
    hasBulkQuote,
    moq
  } = product;

  const formattedPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAction = (actionType) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    // Proceed with action if authenticated
    console.log(`${actionType} for product:`, title);
  };

  return (
    <>
      <div className="group bg-white rounded-xl border border-purple-100/30 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(91,63,214,0.08)] hover:-translate-y-1 flex flex-col h-full overflow-hidden">
        
        {/* 1. Image Area */}
        <div className="relative aspect-[4/3] bg-[#F9FAFB] flex items-center justify-center overflow-hidden">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        {/* 2. Content Area */}
        <div className="p-5 flex flex-col flex-1">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.12em] mb-2">
            {category}
          </p>

          <h3 className="text-text-primary font-medium text-[15px] leading-snug mb-4 line-clamp-2 h-[42px] group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Bulk Pricing Chip (Subtle) */}
          {hasBulkQuote && (
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="bg-soft-lavender text-deep-purple text-[9px] font-bold px-2.5 py-1 rounded-full border border-purple-100/40">
                {role === 'school' ? 'Institutional Pricing' : 'Bulk Pricing Available'}
              </span>
              {role === 'school' && moq && (
                <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2.5 py-1 rounded-full border border-gray-200">
                  MOQ: {moq}
                </span>
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="flex flex-col mb-6">
            <span className="text-[17px] font-medium text-text-primary">
              {formattedPrice(currentPrice)}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-gray-300 line-through">
                {formattedPrice(originalPrice)}
              </span>
              <span className="text-[11px] font-bold text-accent-orange">
                {discount}% OFF
              </span>
            </div>
          </div>

          {/* Hybrid Actions */}
          <div className="mt-auto space-y-4">
            {/* Primary CTA: Add to Cart (Reduced height) */}
            <button 
              onClick={() => handleAction('Add to Cart')}
              className="w-full py-2.5 bg-accent-orange text-deep-purple font-semibold rounded-lg text-[13px] flex items-center justify-center gap-2 hover:bg-accent-gold hover:shadow-[0_8px_20px_-6px_rgba(244,180,0,0.4)] transition-all shadow-sm active:scale-95"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
            
            <div className="flex items-center justify-between px-1">
              {/* Secondary CTA: View Details (Clean text link) */}
              <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-primary transition-all group/link">
                View Details
                <ArrowRight size={12} className="transition-transform group-hover/link:translate-x-1" />
              </button>

              {/* Procurement CTA: Bulk Quote (Outlined pill) */}
              {hasBulkQuote && (
                <button 
                  onClick={() => handleAction('Bulk Quote')}
                  className="flex items-center gap-1.5 px-3 py-1 border border-primary/30 text-primary rounded-full text-[10px] font-bold hover:bg-primary hover:text-white transition-all duration-300 active:scale-95"
                >
                  <MessageSquareQuote size={12} />
                  Bulk Quote
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <LoginPromptModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        message={`Please login to add "${title}" to your cart and access exclusive school pricing.`}
      />
    </>
  );
};

export default ProductCard;
