import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, ShoppingCart, 
  ShieldCheck, Package, Truck,
  Plus, Building2, Loader2, AlertCircle
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import AuthPrompt from '../../components/AuthPrompt';
import { getKit } from '../../../services/schoolApi';
import { useSchoolId } from '../../../utils/schoolContext';
import { getErrorMessage } from '../../../utils/apiHelpers';

const SchoolKitDetailsPage = () => {
  const { kitId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const schoolId = useSchoolId();
  
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const isGuest = !localStorage.getItem('childInfo');
  const [loading, setLoading] = useState(true);
  const [currentKitData, setCurrentKitData] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchKitDetails = async () => {
      if (!schoolId || !kitId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const kitData = await getKit(schoolId, kitId);
        if (cancelled) return;

        // Map the backend Kit schema to what the UI expects
        const mappedItems = (kitData.items || []).map((item) => {
          const prod = item.productId || {};
          const imageObj = prod.images?.[0] || {};
          const imageUrl = imageObj.storageKey || imageObj.url || '';
          const imagePath = imageUrl ? imageUrl : `https://ui-avatars.com/api/?background=3b2d7d&color=fff&bold=true&name=${encodeURIComponent(prod.name || 'Component')}`;
          return {
            id: prod._id || item._id,
            name: prod.name || 'Bulk Component',
            image: imagePath,
            type: prod.publishStatus || 'Active',
            price: (prod.pricePaise || 0) / 100,
            qty: item.qty || 1,
          };
        });

        const mappedAddons = (kitData.addOns || []).map((item) => {
          const prod = item.productId || {};
          const imageObj = prod.images?.[0] || {};
          const imageUrl = imageObj.storageKey || imageObj.url || '';
          const imagePath = imageUrl ? imageUrl : `https://ui-avatars.com/api/?background=3b2d7d&color=fff&bold=true&name=${encodeURIComponent(prod.name || 'Add-on')}`;
          return {
            id: prod._id || item._id,
            name: prod.name || 'Add-on Item',
            image: imagePath,
            type: prod.publishStatus || 'Active',
            price: (prod.pricePaise || 0) / 100,
            qty: item.qty || 1,
          };
        });

        const kitImageUrl = kitData.imageId?.storageKey || kitData.imageUrl || `https://ui-avatars.com/api/?background=3b2d7d&color=fff&bold=true&name=${encodeURIComponent(kitData.name || 'Kit')}`;

        setCurrentKitData({
          id: kitData._id,
          name: kitData.name,
          description: kitData.description || '',
          image: kitImageUrl,
          items: mappedItems,
          addons: mappedAddons,
          price: (kitData.pricePaise || 0) / 100,
        });
        setSelectedItemIds(mappedItems.map((item) => item.id));
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load kit details'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchKitDetails();
    return () => {
      cancelled = true;
    };
  }, [schoolId, kitId]);

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

  const handleAddToCart = async () => {
    if (!currentKitData) return;
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    const selectedItems = currentKitData.items.filter(item => selectedItemIds.includes(item.id));
    
    // Add all selected items to cart
    for (const item of selectedItems) {
      await addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        type: item.type,
      });
    }
    
    navigate('/school/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center font-outfit">
        <Loader2 size={32} className="animate-spin text-primary mb-3" />
        <p className="text-sm text-gray-400">Loading kit details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center px-6 font-outfit text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-lg font-black text-deep-purple mb-2">Error</h2>
        <p className="text-sm text-gray-400 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold">
          Go Back
        </button>
      </div>
    );
  }

  if (!currentKitData) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center px-6 font-outfit text-center">
        <Package size={48} className="text-gray-200 mb-4" />
        <h2 className="text-lg font-black text-deep-purple mb-2">Kit not found</h2>
        <p className="text-sm text-gray-400 mb-6">School kit details are not available yet.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-deep-purple p-1 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-deep-purple tracking-tight">Bulk Kit Details</h1>
      </div>

      {/* Hero Section */}
      <div className="pt-20">
        <div className="relative h-72 w-full overflow-hidden">
          <img 
            src={currentKitData.image} 
            alt={currentKitData.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8F7FF] via-transparent to-transparent"></div>
          <div className="absolute top-4 left-6 px-3 py-1.5 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
            <Building2 size={12} /> Institutional Rate
          </div>
        </div>

        <div className="px-6 -mt-12 relative z-10">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
               <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-wider">Bulk Package</span>
            </div>
            <h2 className="text-2xl font-black text-deep-purple mb-2 leading-tight">{currentKitData.name}</h2>
            <p className="text-gray-400 text-xs font-medium leading-relaxed mb-6">
              {currentKitData.description}
            </p>

            {/* Price Cards */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-1">Institutional Price</p>
                  <span className="text-2xl font-black text-primary">₹{currentTotal.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Avg. per Unit</p>
                  <span className="text-sm font-bold text-deep-purple">₹{Math.round(currentTotal/6).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Badges */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between bg-white/50 backdrop-blur-md rounded-2xl p-3 border border-white">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[10px] font-bold text-gray-500">Quality Verified</span>
          </div>
          <div className="w-px h-4 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-primary" />
            <span className="text-[10px] font-bold text-gray-500">Bulk Delivery</span>
          </div>
          <div className="w-px h-4 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <Package size={14} className="text-accent-orange" />
            <span className="text-[10px] font-bold text-gray-500">Full Supply</span>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div className="px-6 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-deep-purple">Bulk Components</h3>
          <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-wider">
            {selectedItemIds.length} / {currentKitData.items.length} Categories
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
                {selectedItemIds.includes(item.id) && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold truncate transition-colors ${
                  selectedItemIds.includes(item.id) ? 'text-deep-purple' : 'text-gray-400'
                }`}>
                  {item.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    selectedItemIds.includes(item.id) ? 'bg-primary/5 text-primary' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-xs font-black text-deep-purple ml-auto">₹{item.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedItemIds.includes(item.id) 
                    ? 'border-primary bg-primary text-white' 
                    : 'border-gray-200'
                }`}>
                  {selectedItemIds.includes(item.id) && <Check size={12} strokeWidth={4} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="mt-12 mb-10">
        <div className="px-6 flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-deep-purple tracking-tight">Institutional Add-ons</h3>
          <button className="text-primary text-[10px] font-black uppercase tracking-widest">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide">
          {currentKitData.addons.map((addon) => (
            <div key={addon.id} className="min-w-[160px] bg-white rounded-3xl p-4 border border-gray-100 shadow-sm active:scale-95 transition-all">
              <div className="aspect-square rounded-2xl bg-gray-50 mb-3 overflow-hidden">
                <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-[11px] font-bold text-deep-purple leading-tight line-clamp-2 h-7 mb-2">
                {addon.name}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-deep-purple">₹{addon.price.toLocaleString()}</span>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddOn(addon);
                  }}
                  className="w-7 h-7 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom CTA */}
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
            {isFullKit ? `Order Bulk Kit – ₹${currentTotal.toLocaleString()}` : `Order Selected (${selectedItemIds.length}) – ₹${currentTotal.toLocaleString()}`}
          </span>
        </button>
      </div>

      <AuthPrompt 
        isOpen={isAuthPromptOpen} 
        onClose={() => setIsAuthPromptOpen(false)} 
        title="Institutional Login Required" 
        message="Login as a School Administrator to place bulk institutional orders."
      />
    </div>
  );
};

export default SchoolKitDetailsPage;
