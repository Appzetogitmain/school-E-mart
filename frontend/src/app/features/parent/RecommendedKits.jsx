import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { listFeaturedProducts } from '../../../services/catalogApi';
import { mapProductForCard } from '../../../utils/mappers/productMapper';

const RecommendedKits = ({ isGuest, onAuthRequired }) => {
  const navigate = useNavigate();
  const kitsRef = useDraggableScroll();
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await listFeaturedProducts({ limit: 8 });
        if (!cancelled) {
          setKits((data || []).map((p) => mapProductForCard(p)));
        }
      } catch {
        if (!cancelled) setKits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBuyKit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) {
      onAuthRequired();
      return;
    }
    const productId = e.currentTarget.dataset.productid;
    if (productId) navigate(`/user/product/${productId}`);
  };

  if (isGuest) return null;

  if (loading) {
    return (
      <div className="mt-8 px-6">
        <p className="text-sm text-gray-400 text-center py-6">Loading recommendations…</p>
      </div>
    );
  }

  if (!kits.length) return null;

  return (
    <div className="mt-8 select-none text-left">
      <SectionHeader
        title="Recommended Kits"
        onViewAll={() => navigate('/user/products')}
      />
      <div
        ref={kitsRef}
        className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide select-none active:cursor-grabbing"
      >
        {kits.map((kit) => (
          <Link
            key={kit.id}
            to={`/user/product/${kit.id}`}
            className="min-w-[280px] bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-200/40 group active:scale-95 transition-all border border-gray-100 block"
          >
            <div className="h-48 relative">
              <img
                src={kit.image}
                alt={kit.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            <div className="p-5">
              <h3 className="font-bold text-deep-purple text-base mb-1">{kit.name}</h3>
              <p className="text-[10px] text-gray-400 font-medium mb-4">{kit.brand}</p>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-primary font-bold text-lg">{kit.price}</span>
                  {kit.originalPrice && (
                    <span className="text-[10px] text-gray-400 line-through">{kit.originalPrice}</span>
                  )}
                </div>

                <button
                  type="button"
                  data-productid={kit.id}
                  onClick={handleBuyKit}
                  className="px-5 py-2.5 bg-[#ffc107] text-black rounded-xl text-xs font-bold shadow-lg shadow-yellow-100 flex items-center gap-2 active:scale-90 transition-all relative z-10 cursor-pointer"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecommendedKits;
