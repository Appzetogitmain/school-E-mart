import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, ShoppingCart, 
  Sparkles, ShieldCheck, ChevronRight,
  Info, AlertCircle, Package, Truck,
  Plus, X, Loader2
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import AuthPrompt from '../../components/AuthPrompt';
import * as catalogApi from '../../../services/catalogApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapProductForDetailView } from '../../../utils/mappers/productMapper';

const KitDetailsPage = () => {
  const { kitId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const isGuest = !localStorage.getItem('childInfo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentKitData, setCurrentKitData] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadKit = async () => {
      setLoading(true);
      setError('');
      try {
        const product = await catalogApi.getProduct(kitId);
        if (cancelled) return;
        const mapped = mapProductForDetailView(product);
        const kitData = {
          id: mapped.id,
          name: mapped.name,
          description: mapped.description || '',
          image: mapped.image,
          items: (mapped.bundleItems || []).map((item, index) => ({
            id: item.id || `item-${index}`,
            name: item.name,
            price: item.pricePaise ? Math.round(item.pricePaise / 100) : item.price || 0,
            originalPrice: item.originalPrice,
            quantity: 1,
            type: item.category || 'Item',
            image: item.image || mapped.image,
          })),
          addons: [],
        };
        setCurrentKitData(kitData);
        setSelectedItemIds(kitData.items.map((item) => item.id));
      } catch (err) {
        if (!cancelled) {
          setCurrentKitData(null);
          setError(getErrorMessage(err, 'Kit not found'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadKit();
    return () => {
      cancelled = true;
    };
  }, [kitId]);

  const toggleItem = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleAddOn = (addon) => {
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    addToCart(addon);
    setCurrentKitData(prev => ({
      ...prev,
      items: [...prev.items, addon],
      addons: prev.addons.filter(a => a.id !== addon.id)
    }));
    setSelectedItemIds(prev => [...prev, addon.id]);
  };

  const handleRemoveItem = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItemIds(prev => prev.filter(id => id !== item.id));
    setCurrentKitData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== item.id),
      addons: [item, ...prev.addons]
    }));
  };

  const { currentTotal, isFullKit } = useMemo(() => {
    if (!currentKitData) return { currentTotal: 0, isFullKit: false };
    const selectedItems = currentKitData.items.filter(item => selectedItemIds.includes(item.id));
    const current = selectedItems.reduce((sum, item) => sum + item.price, 0);
    return {
      currentTotal: current,
      isFullKit: selectedItemIds.length === currentKitData.items.length
    };
  }, [selectedItemIds, currentKitData]);

  const handleAddToCart = () => {
    if (!currentKitData) return;
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    navigate('/user/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center font-outfit">
        <Loader2 size={32} className="animate-spin text-primary mb-3" />
        <p className="text-sm text-gray-400">Loading kit details…</p>
      </div>
    );
  }

  if (!currentKitData || error) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center px-6 font-outfit text-center">
        <Package size={48} className="text-gray-200 mb-4" />
        <h2 className="text-lg font-black text-deep-purple mb-2">Kit not found</h2>
        <p className="text-sm text-gray-400 mb-6">{error || 'This kit is unavailable or does not exist.'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative">
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-deep-purple p-1 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-deep-purple tracking-tight">Kit Details</h1>
      </div>

      <div className="pt-20">
        <div className="relative h-72 w-full overflow-hidden">
          <img 
            src={currentKitData.image} 
            alt={currentKitData.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8F7FF] via-transparent to-transparent"></div>
        </div>

        <div className="px-6 -mt-12 relative z-10">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h2 className="text-2xl font-black text-deep-purple mb-2 leading-tight">{currentKitData.name}</h2>
            <p className="text-gray-400 text-xs font-medium leading-relaxed mb-6">
              {currentKitData.description}
            </p>
            <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10">
              <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-1">Selected Total</p>
              <span className="text-2xl font-black text-primary">₹{currentTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-deep-purple">What&apos;s Included</h3>
          <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-wider">
            {selectedItemIds.length} / {currentKitData.items.length} Items
          </span>
        </div>

        <div className="space-y-4">
          {currentKitData.items.map((item) => (
            <div 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`group flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                selectedItemIds.includes(item.id) 
                  ? 'bg-white border-primary shadow-lg shadow-primary/5' 
                  : 'bg-gray-50/50 border-gray-100 opacity-60'
              }`}
            >
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate text-deep-purple">{item.name}</h4>
                <span className="text-xs font-black text-deep-purple">₹{item.price.toLocaleString()}</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedItemIds.includes(item.id) ? 'border-primary bg-primary text-white' : 'border-gray-200'
              }`}>
                {selectedItemIds.includes(item.id) && <Check size={12} strokeWidth={4} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-[60]">
        <button 
          onClick={handleAddToCart}
          disabled={selectedItemIds.length === 0}
          className={`w-full py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl active:scale-[0.98] ${
            selectedItemIds.length > 0 
              ? 'bg-primary text-white shadow-primary/30' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          <ShoppingCart size={20} />
          <span className="text-base font-black">
            {isFullKit ? `Add Full Kit – ₹${currentTotal.toLocaleString()}` : `Add Selected (${selectedItemIds.length}) – ₹${currentTotal.toLocaleString()}`}
          </span>
        </button>
      </div>

      <AuthPrompt 
        isOpen={isAuthPromptOpen} 
        onClose={() => setIsAuthPromptOpen(false)} 
        title="Login Required" 
        message="Login to add school kits to your cart."
      />
    </div>
  );
};

export default KitDetailsPage;
