import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';

const RecommendedKits = ({ isGuest, onAuthRequired }) => {
  const navigate = useNavigate();
  const kitsRef = useDraggableScroll();

  const kits = [
    {
      id: 1,
      name: "Complete Class 2 Kit",
      price: "₹4,299",
      originalPrice: "₹5,499",
      image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=300&h=400&fit=crop",
      badge: "School Recommended"
    },
    {
      id: 2,
      name: "Winter Uniform Bundle",
      price: "₹1,850",
      originalPrice: "₹2,450",
      image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=300&h=400&fit=crop",
      badge: "Winter Essential"
    }
  ];

  const handleBuyKit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) {
      onAuthRequired();
      return;
    }
    // Perform standard add to cart / buy checkout logic
    navigate(`/user/kit/${e.currentTarget.dataset.kitid}`);
  };

  if (isGuest) return null;

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
            to={`/user/kit/${kit.id}`}
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
              <p className="text-[10px] text-gray-400 font-medium mb-4">Everything your child needs for Class 2</p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-primary font-bold text-lg">{kit.price}</span>
                </div>
                
                <button
                  type="button"
                  data-kitid={kit.id}
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
