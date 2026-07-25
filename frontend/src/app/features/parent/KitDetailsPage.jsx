import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, ShoppingCart, 
  ShieldCheck, ChevronRight,
  Info, AlertCircle, Package, Truck,
  Plus, X, Loader2, CheckCircle2
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import AuthPrompt from '../../components/AuthPrompt';
import * as catalogApi from '../../../services/catalogApi';
import { getKit, listKits } from '../../../services/schoolApi';
import { listOrders } from '../../../services/ordersApi';
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
  const [isPurchased, setIsPurchased] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkPurchased = async () => {
      if (isGuest) return;
      try {
        const { data: ordersData } = await listOrders();
        const validOrders = (ordersData || []).filter((o) => {
          const isCancelled = ['cancelled', 'returned'].includes(o.status || o.orderStatus);
          const isPaid = ['paid', 'authorized'].includes(o.paymentStatus) || o.paymentMethod === 'cod';
          return !isCancelled && isPaid;
        });
        const purchased = validOrders.some((o) =>
          (o.items || []).some((item) => String(item.kitId || item.productId) === String(kitId))
        );
        if (!cancelled) setIsPurchased(purchased);
      } catch {
        // order fetch optional
      }
    };

    checkPurchased();
    return () => {
      cancelled = true;
    };
  }, [kitId, isGuest]);

  useEffect(() => {
    let cancelled = false;

    const loadKit = async () => {
      setLoading(true);
      setError('');
      try {
        const childInfo = JSON.parse(localStorage.getItem('childInfo') || '{}');
        const schoolId = childInfo.schoolId;

        let rawKit = null;

        // Step 1: Try school kit API if schoolId exists
        if (schoolId) {
          try {
            rawKit = await getKit(schoolId, kitId);
          } catch {
            rawKit = null;
          }
        }

        // Step 2: Fallback query listKits for matching kit _id
        if (!rawKit && schoolId) {
          try {
            const listRes = await listKits(schoolId);
            const kitsList = listRes.data || listRes || [];
            rawKit = kitsList.find((k) => String(k._id || k.id) === String(kitId));
          } catch {
            rawKit = null;
          }
        }

        if (cancelled) return;

        // Step 3: If School Kit found, map it
        if (rawKit) {
          const kitData = {
            id: rawKit._id || rawKit.id,
            name: rawKit.name,
            description: rawKit.description || 'Official school procurement kit',
            image: rawKit.imageUrl || rawKit.avatar || rawKit.items?.find((i) => i.imageUrl)?.imageUrl || rawKit.items?.[0]?.imageUrl || '',
            price: rawKit.pricePaise ? Math.round(rawKit.pricePaise / 100) : (rawKit.price || 0),
            mrp: rawKit.mrpPaise ? Math.round(rawKit.mrpPaise / 100) : (rawKit.mrp || 0),
            classes: rawKit.classGrade || rawKit.classes || '',
            category: rawKit.category || 'School Kit',
            items: (rawKit.items || []).map((item, index) => {
              const pName = item.name || item.masterProductId?.name || `Item ${index + 1}`;
              const pImg = item.imageUrl || item.masterProductId?.imageUrl || rawKit.imageUrl || '';
              const pPrice = item.pricePaise ? Math.round(item.pricePaise / 100) : (item.price || 0);
              return {
                id: item._id || item.id || item.masterProductId?._id || `item-${index}`,
                name: pName,
                price: pPrice,
                originalPrice: item.mrpPaise ? Math.round(item.mrpPaise / 100) : pPrice,
                quantity: item.quantity || 1,
                type: item.type || item.masterProductId?.category || 'Item',
                image: pImg,
              };
            }),
            addons: [],
          };

          setCurrentKitData(kitData);
          setSelectedItemIds(kitData.items.map((item) => item.id));
          setLoading(false);
          return;
        }

        // Step 4: Fallback to General Marketplace Product
        const product = await catalogApi.getProduct(kitId);
        if (cancelled) return;
        const mapped = mapProductForDetailView(product);
        const kitData = {
          id: mapped.id,
          name: mapped.name,
          description: mapped.description || '',
          image: mapped.image,
          price: mapped.price || 0,
          mrp: mapped.originalPrice || mapped.price || 0,
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
    const current = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return {
      currentTotal: current > 0 ? current : currentKitData.price,
      isFullKit: selectedItemIds.length === currentKitData.items.length
    };
  }, [selectedItemIds, currentKitData]);

  const handleAddToCart = () => {
    if (!currentKitData) return;
    if (isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }

    const kitCartItem = {
      id: currentKitData.id,
      productId: currentKitData.id,
      kitId: currentKitData.id,
      name: currentKitData.name,
      price: currentTotal || currentKitData.price,
      pricePaise: Math.round((currentTotal || currentKitData.price) * 100),
      image: currentKitData.image || currentKitData.items?.find((i) => i.image)?.image || '',
      quantity: 1,
    };

    addToCart(kitCartItem);
    navigate('/user/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center font-outfit">
        <Loader2 size={32} className="animate-spin text-[#3b2d7d] mb-3" />
        <p className="text-sm font-bold text-gray-400">Loading kit details…</p>
      </div>
    );
  }

  if (!currentKitData || error) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center px-6 font-outfit text-center">
        <Package size={48} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-black text-gray-900 mb-2">Kit not found</h2>
        <p className="text-xs text-gray-400 mb-6 font-medium">{error || 'This kit is unavailable or does not exist.'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-[#3b2d7d] text-white rounded-2xl text-xs font-black uppercase tracking-wider">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative">
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-gray-150 z-50 px-6 py-4 flex items-center gap-4 shadow-xs">
        <button onClick={() => navigate(-1)} className="text-gray-800 p-1 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-black text-gray-900 uppercase tracking-wider">Kit Details</h1>
      </div>

      <div className="pt-20">
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
          {currentKitData.image ? (
            <img 
              src={currentKitData.image} 
              alt={currentKitData.name} 
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <Package size={64} className="text-purple-300" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8F7FF] via-transparent to-transparent"></div>
        </div>

        <div className="px-6 -mt-12 relative z-10">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-150">
            <span className="px-2.5 py-0.5 bg-purple-50 text-[#3b2d7d] border border-purple-100 rounded-lg text-[9px] font-black uppercase tracking-wider inline-block mb-2">
              {currentKitData.category}
            </span>
            <h2 className="text-xl font-black text-gray-900 mb-2 leading-tight">{currentKitData.name}</h2>
            <p className="text-gray-400 text-xs font-medium leading-relaxed mb-5">
              {currentKitData.description}
            </p>
            {isPurchased && (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-bold text-xs flex items-center gap-2.5 shadow-2xs">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 stroke-[2.5]" />
                <span>You have already purchased this kit for your child.</span>
              </div>
            )}
            <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100/80 flex items-center justify-between mt-3">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Total Kit Price</p>
                <span className="text-2xl font-black text-[#3b2d7d]">₹{currentTotal.toLocaleString()}</span>
              </div>
              {currentKitData.mrp > currentTotal && (
                <span className="text-xs text-gray-400 font-bold line-through">₹{currentKitData.mrp.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">What&apos;s Included</h3>
          <span className="text-[9px] font-black text-[#3b2d7d] bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {selectedItemIds.length} / {currentKitData.items.length} Items Selected
          </span>
        </div>

        <div className="space-y-3">
          {currentKitData.items.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected ? 'bg-white border-[#3b2d7d] shadow-xs' : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 p-1 shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <Package size={20} className="text-purple-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-gray-900 truncate">{item.name}</h4>
                    <span className="text-[10px] text-gray-400 font-bold">{item.type} • Qty: {item.quantity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'bg-[#3b2d7d] border-[#3b2d7d] text-white shadow-2xs' : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && <Check size={13} className="stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Payable Amount</span>
            <span className="text-xl font-black text-[#3b2d7d]">₹{currentTotal.toLocaleString()}</span>
          </div>

          <button
            type="button"
            disabled={isPurchased}
            onClick={handleAddToCart}
            className={`px-6 py-3.5 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95 ${
              isPurchased
                ? 'bg-emerald-600 text-white opacity-90 cursor-not-allowed shadow-emerald-900/10'
                : 'bg-[#3b2d7d] hover:bg-[#2c2060] text-white shadow-purple-950/15'
            }`}
          >
            {isPurchased ? (
              <>
                <CheckCircle2 size={16} className="stroke-[2.5]" />
                <span>Already Purchased</span>
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                <span>Proceed to Buy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <AuthPrompt isOpen={isAuthPromptOpen} onClose={() => setIsAuthPromptOpen(false)} />
    </div>
  );
};

export default KitDetailsPage;
