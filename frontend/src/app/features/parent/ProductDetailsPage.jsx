import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Star, ShoppingCart,
  Truck, RotateCcw, ShieldCheck,
  Share2
} from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import SectionHeader from '../../components/SectionHeader';
import PolicyFeature from '../../components/PolicyFeature';
import QuantitySelector from '../../components/QuantitySelector';
import { useCart } from '../../context/CartContext';
import AuthPrompt from '../../components/AuthPrompt';
import * as catalogApi from '../../../services/catalogApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapProductForCard, mapProductForDetailView } from '../../../utils/mappers/productMapper';

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateQuantity, getProductQuantity } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const cartQuantity = getProductQuantity(productId);
  const isGuest = !localStorage.getItem('childInfo');

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const [detail, related] = await Promise.all([
          catalogApi.getProduct(productId),
          catalogApi.getRelatedProducts(productId, { limit: 6 }),
        ]);
        if (cancelled) return;
        const mapped = mapProductForDetailView(detail);
        setProduct(mapped);
        setSelectedSize(mapped.sizes?.[0] || 'One Size');
        setSimilarProducts((related || []).map((item) => mapProductForCard(item)));
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load product'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-outfit">
        <p className="text-sm text-gray-400">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 font-outfit">
        <p className="text-sm text-gray-500 mb-4">{error || 'Product not found'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const sizes = product.sizes?.length ? product.sizes : ['One Size'];

  return (
    <div className="min-h-screen bg-white pb-32 font-outfit relative">
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
            <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="relative bg-gray-50 aspect-[3/4] overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${activeImage * 100}%)` }}
        >
          {product.images.map((img, idx) => (
            <img key={idx} src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover shrink-0" />
          ))}
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {product.images.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeImage === idx ? 'w-6 bg-primary' : 'w-1.5 bg-gray-300'}`}
              onClick={() => setActiveImage(idx)}
            />
          ))}
        </div>

        {discount > 0 && (
          <div className="absolute bottom-6 left-6 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
            {discount}% OFF
          </div>
        )}
      </div>

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
          {product.originalPrice > product.price && (
            <span className="text-sm text-gray-300 line-through font-bold">₹{product.originalPrice}</span>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-deep-purple">Select Size</h3>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest">Size Guide</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {sizes.map((size) => (
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

        <div className="mb-8 p-4 bg-gray-50 rounded-3xl flex items-center justify-between">
          <h3 className="text-sm font-bold text-deep-purple">Quantity in Cart</h3>
          <QuantitySelector
            quantity={cartQuantity}
            onIncrease={() => updateQuantity(productId, 1)}
            onDecrease={() => updateQuantity(productId, -1)}
          />
        </div>

        <div className="space-y-4 mb-10">
          <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-deep-purple mb-3">Product Description</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{product.description || 'No description available.'}</p>
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

        <div className="grid grid-cols-3 gap-3 mb-12">
          <PolicyFeature icon={Truck} label="Free Delivery" />
          <PolicyFeature icon={RotateCcw} label="7 Days Return" />
          <PolicyFeature icon={ShieldCheck} label="Quality Assured" />
        </div>

        {similarProducts.length > 0 && (
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
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50 flex gap-4">
        {cartQuantity === 0 ? (
          <button
            onClick={handleAddToCart}
            className="flex-1 py-4 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} /> Add to Cart
          </button>
        ) : (
          <button
            onClick={() => navigate('/user/cart')}
            className="flex-1 py-4 bg-[#34A853] hover:bg-[#2c8e47] text-white rounded-2xl text-xs font-black shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300"
          >
            <ShoppingCart size={18} /> View Cart
          </button>
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
