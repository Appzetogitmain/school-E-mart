import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Star, ShoppingCart, 
  ChevronRight, Truck, RotateCcw, ShieldCheck,
  Minus, Plus, Share2, Info
} from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import SectionHeader from '../../components/SectionHeader';
import PolicyFeature from '../../components/PolicyFeature';
import QuantitySelector from '../../components/QuantitySelector';
import { useCart } from '../../context/CartContext';

import AuthPrompt from '../../components/AuthPrompt';

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateQuantity, getProductQuantity } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('28');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const cartQuantity = getProductQuantity(productId);

  const isGuest = !localStorage.getItem('childInfo');

  const product = {
    id: productId,
    name: "Premium Cotton School Shirt - White",
    brand: "School E-Mart Essentials",
    price: 599,
    originalPrice: 799,
    category: "Uniforms",
    rating: 4.8,
    reviews: 124,
    description: "High-quality, breathable cotton shirt designed for all-day school comfort. Features reinforced stitching and easy-iron fabric.",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600&h=800&fit=crop"
    ],
    sizes: ['24', '26', '28', '30', '32', '34'],
    specs: [
      { label: "Material", value: "100% Organic Cotton" },
      { label: "Fit", value: "Regular Fit" },
      { label: "Wash Care", value: "Machine Wash Cold" },
      { label: "Sleeve", value: "Half Sleeve" }
    ]
  };

  const similarProducts = [
    { id: 2, name: "Daily Cotton Trousers", price: 850, image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=200&h=200&fit=crop" },
    { id: 3, name: "School Tie - Navy Blue", price: 150, image: "https://images.unsplash.com/photo-1598033129183-c4f50c717658?q=80&w=200&h=200&fit=crop" },
    { id: 4, name: "Cotton School Socks (Pack of 3)", price: 299, image: "https://images.unsplash.com/photo-1582966298430-6174c22ad257?q=80&w=200&h=200&fit=crop" }
  ];

  const [showToast, setShowToast] = useState(false);

  const handleAddToCart = () => {
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    addToCart(product);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleBuyNow = () => {
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    navigate('/user/checkout');
  };

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div className="min-h-screen bg-white pb-32 font-outfit relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] animate-in fade-in slide-in-from-top duration-300">
          <div className="bg-deep-purple text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-md">
            <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight">Added to Cart!</p>
              <p className="text-[10px] text-white/60 font-medium">{product.name} (Size: {selectedSize})</p>
            </div>
            <button 
              onClick={() => navigate('/user/cart')}
              className="text-[10px] font-black text-primary bg-white px-3 py-2 rounded-xl shadow-sm whitespace-nowrap"
            >
              VIEW CART
            </button>
          </div>
        </div>
      )}

      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 pt-8 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-deep-purple pointer-events-auto active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 pointer-events-auto">
          <button className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-deep-purple active:scale-90 transition-all">
            <Share2 size={18} />
          </button>
          <button 
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center active:scale-90 transition-all ${isWishlisted ? 'text-red-500' : 'text-deep-purple'}`}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Image Carousel Section */}
      <div className="relative bg-gray-50 aspect-[3/4] overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${activeImage * 100}%)` }}
        >
          {product.images.map((img, idx) => (
            <img key={idx} src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover shrink-0" />
          ))}
        </div>
        
        {/* Pagination Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {product.images.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeImage === idx ? 'w-6 bg-primary' : 'w-1.5 bg-gray-300'}`}
              onClick={() => setActiveImage(idx)}
            />
          ))}
        </div>

        {/* Sale Badge */}
        <div className="absolute bottom-6 left-6 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
          {discount}% OFF
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 pt-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg">
            {product.category}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <Star size={12} fill="#ffc107" className="text-yellow-400" />
            <span className="text-xs font-bold text-gray-400">{product.rating} ({product.reviews} reviews)</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-deep-purple leading-tight mb-2">{product.name}</h1>
        <p className="text-gray-400 text-xs font-medium mb-4">{product.brand}</p>

        <div className="flex items-baseline gap-3 mb-8">
          <span className="text-3xl font-black text-black">₹{product.price}</span>
          <span className="text-sm text-gray-300 line-through font-bold">₹{product.originalPrice}</span>
        </div>

        {/* Size Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-deep-purple">Select Size</h3>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest">Size Guide</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold transition-all border-2
                  ${selectedSize === size 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}
                `}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="mb-8 p-4 bg-gray-50 rounded-3xl flex items-center justify-between">
          <h3 className="text-sm font-bold text-deep-purple">Quantity in Cart</h3>
          <QuantitySelector 
            quantity={cartQuantity} 
            onIncrease={() => updateQuantity(productId, 1)} 
            onDecrease={() => updateQuantity(productId, -1)} 
          />
        </div>

        {/* Description Accordion */}
        <div className="space-y-4 mb-10">
          <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-deep-purple mb-3">Product Description</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{product.description}</p>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-deep-purple mb-4">Specifications</h3>
            <div className="grid grid-cols-2 gap-y-4">
              {product.specs.map((spec, idx) => (
                <div key={idx}>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{spec.label}</p>
                  <p className="text-xs font-bold text-deep-purple">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Size Chart (Inline Image) */}
        <div className="mb-12">
          <h3 className="text-sm font-bold text-deep-purple mb-4 px-2">Size Chart</h3>
          <div className="rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bbbda5366391?q=80&w=600&h=400&fit=crop" 
              alt="Size Chart" 
              className="w-full h-auto" 
            />
          </div>
        </div>

        {/* Policy Section */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          <PolicyFeature icon={Truck} label="Free Delivery" />
          <PolicyFeature icon={RotateCcw} label="7 Days Return" />
          <PolicyFeature icon={ShieldCheck} label="Quality Assured" />
        </div>

        {/* Similar Products */}
        <div className="mb-10">
          <SectionHeader 
            title="Similar Products" 
            onViewAll={() => {}} 
            className="px-2"
          />
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {similarProducts.map((p) => (
              <div key={p.id} className="min-w-[160px] shrink-0">
                <ProductCard product={p} showBuyNow={false} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50 flex gap-4">
        {cartQuantity === 0 ? (
          <button 
            onClick={handleAddToCart}
            className="flex-1 py-4 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} /> Add to Cart
          </button>
        ) : (
          <div className="flex-1">
            <QuantitySelector 
              className="h-full py-3"
              quantity={cartQuantity} 
              onIncrease={() => updateQuantity(productId, 1)} 
              onDecrease={() => updateQuantity(productId, -1)} 
            />
          </div>
        )}
        <button 
          onClick={handleBuyNow}
          className="flex-[1.5] py-4 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          Buy Now
        </button>
      </div>
      <AuthPrompt 
        isOpen={isAuthPromptOpen} 
        onClose={() => setIsAuthPromptOpen(false)} 
        title="Add to Your Collection"
        message="Login to add items to your cart and enjoy a seamless checkout experience."
      />
    </div>
  );
};

export default ProductDetailsPage;
