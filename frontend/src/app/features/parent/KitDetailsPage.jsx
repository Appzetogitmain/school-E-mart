import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Check, ShoppingCart, 
  Sparkles, ShieldCheck, ChevronRight,
  Info, AlertCircle, Package, Truck,
  Plus, X
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import AuthPrompt from '../../components/AuthPrompt';

const KitDetailsPage = () => {
  const { kitId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const isGuest = !localStorage.getItem('childInfo');

  // Initial Kit Data
  const [currentKitData, setCurrentKitData] = useState({
    id: kitId || 1,
    name: "Complete Class 2 Kit",
    description: "Everything your child needs for Class 2 - includes full uniform set, all textbooks, notebooks, and essential stationery curated for St. Xavier's High School.",
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=600&h=800&fit=crop",
    items: [
      { id: 'u1', name: "School Blazer (Navy Blue)", price: 1450, originalPrice: 1850, quantity: 1, type: "Uniform", image: "https://images.unsplash.com/photo-1594932224491-ef2443e73bb5?q=80&w=200&h=200&fit=crop" },
      { id: 'u2', name: "White Polo Shirts (Set of 2)", price: 850, originalPrice: 1100, quantity: 1, type: "Uniform", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=200&h=200&fit=crop" },
      { id: 'u3', name: "Grey Trousers", price: 650, originalPrice: 850, quantity: 1, type: "Uniform", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=200&h=200&fit=crop" },
      { id: 'b1', name: "Oxford English Textbooks (P1-P4)", price: 980, originalPrice: 1200, quantity: 1, type: "Books", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&h=200&fit=crop" },
      { id: 'b2', name: "Mathematics Practice Set", price: 420, originalPrice: 550, quantity: 1, type: "Books", image: "https://images.unsplash.com/photo-1543004629-ff569587207d?q=80&w=200&h=200&fit=crop" },
      { id: 's1', name: "Premium Stationery Box", price: 350, originalPrice: 450, quantity: 1, type: "Stationery", image: "https://images.unsplash.com/photo-1634045550273-db9897ca800c?q=80&w=200&h=200&fit=crop" }
    ],
    addons: [
      { id: 'a1', name: "Waterproof School Bag", price: 1250, type: "Bag", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=200&h=200&fit=crop" },
      { id: 'a2', name: "Insulated Lunch Box", price: 450, type: "Lunchbox", image: "https://images.unsplash.com/photo-1595940003001-f76709848f07?q=80&w=200&h=200&fit=crop" }
    ]
  });

  const [selectedItemIds, setSelectedItemIds] = useState(currentKitData.items.map(i => i.id));

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

    // Add to cart immediately
    addToCart(addon);

    // Move from addons to items
    setCurrentKitData(prev => ({
      ...prev,
      items: [...prev.items, addon],
      addons: prev.addons.filter(a => a.id !== addon.id)
    }));

    // Auto-select in the list
    setSelectedItemIds(prev => [...prev, addon.id]);
  };

  const handleRemoveItem = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove from selection
    setSelectedItemIds(prev => prev.filter(id => id !== item.id));

    // Move from items back to addons
    setCurrentKitData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== item.id),
      addons: [item, ...prev.addons]
    }));
  };

  const { currentTotal, originalTotal, savings, isFullKit } = useMemo(() => {
    const selectedItems = currentKitData.items.filter(item => selectedItemIds.includes(item.id));
    const current = selectedItems.reduce((sum, item) => sum + item.price, 0);
    const original = selectedItems.reduce((sum, item) => sum + (item.originalPrice || item.price), 0);
    return {
      currentTotal: current,
      originalTotal: original,
      savings: original - current,
      isFullKit: selectedItemIds.length === currentKitData.items.length
    };
  }, [selectedItemIds, currentKitData.items]);

  const handleAddToCart = () => {
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    
    const selectedItems = currentKitData.items.filter(item => selectedItemIds.includes(item.id));
    // Items added via handleAddOn are already in cart, but we ensure all selected items are there
    selectedItems.forEach(item => {
      // In a real app we'd check if item is already in cart, 
      // but here we just navigate to cart as per the core logic
    });
    navigate('/user/cart');
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-deep-purple p-1 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-deep-purple tracking-tight">Kit Details</h1>
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
          <div className="absolute top-4 left-6 px-3 py-1.5 bg-golden-yellow text-deep-purple rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
            <Sparkles size={12} /> School Recommended
          </div>
        </div>

        <div className="px-6 -mt-12 relative z-10">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h2 className="text-2xl font-black text-deep-purple mb-2 leading-tight">{currentKitData.name}</h2>
            <p className="text-gray-400 text-xs font-medium leading-relaxed mb-6">
              {currentKitData.description}
            </p>

            {/* Price Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 rounded-3xl p-4 border border-primary/10">
                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-1">Kit Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-primary">₹{currentTotal.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-golden-yellow/10 rounded-3xl p-4 border border-golden-yellow/20">
                <p className="text-[10px] font-bold text-golden-yellow uppercase tracking-wider mb-1">You Save</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-golden-yellow">₹{savings.toLocaleString()}</span>
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
            <span className="text-[10px] font-bold text-gray-500">Verified Quality</span>
          </div>
          <div className="w-px h-4 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-primary" />
            <span className="text-[10px] font-bold text-gray-500">Fast Delivery</span>
          </div>
          <div className="w-px h-4 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <Package size={14} className="text-accent-orange" />
            <span className="text-[10px] font-bold text-gray-500">Full Set</span>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div className="px-6 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-deep-purple">What's Included</h3>
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
                  <span className="text-xs font-black text-deep-purple ml-auto">₹{item.price}</span>
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
                {currentKitData.items.length > 1 && (
                  <button 
                    onClick={(e) => handleRemoveItem(e, item)}
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-75"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="mt-12 mb-10">
        <div className="px-6 flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-deep-purple tracking-tight">You may also need</h3>
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
                <span className="text-xs font-black text-deep-purple">₹{addon.price}</span>
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
            {isFullKit ? `Buy Full Kit – ₹${currentTotal.toLocaleString()}` : `Buy Selected (${selectedItemIds.length}) – ₹${currentTotal.toLocaleString()}`}
          </span>
        </button>
      </div>

      <AuthPrompt 
        isOpen={isAuthPromptOpen} 
        onClose={() => setIsAuthPromptOpen(false)} 
        title="Ready to checkout?"
        message="Login to add this school kit to your cart and get everything delivered in one go!"
      />
    </div>
  );
};

export default KitDetailsPage;
