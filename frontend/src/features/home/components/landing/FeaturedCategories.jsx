import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../constants/routes';

const FeaturedCategories = () => {
  const navigate = useNavigate();
  
  const categories = [
    { id: 'uniforms', image: '/assets/uniforms.png', name: 'Uniforms', bg: 'bg-[#FFF3F3]' },
    { id: 'books', image: '/assets/books.png', name: 'Books & Stationery', bg: 'bg-[#EBF7FF]' },
    { id: 'sports', image: '/assets/toys_and_sports.png', name: 'Sports Kits', bg: 'bg-[#F3F2FF]' },
    { id: 'stem-labs', image: '/assets/lab_and_science.png', name: 'Project Essentials', bg: 'bg-[#EFFFFD]' },
    { id: 'furniture', image: '/assets/furniture.png', name: 'Furniture & Storage', bg: 'bg-[#FFF9EB]' },
    { id: 'technology', image: '/assets/electronics.png', name: 'School Technology', bg: 'bg-[#F5F3FF]' },
    { id: 'teaching-learning', image: '/assets/teaching_aids.png', name: 'Teaching Aids', bg: 'bg-[#ECFDF5]' },
    { id: 'safety', image: '/assets/safety.png', name: 'School Safety', bg: 'bg-[#FEF2F2]' },
  ];

  const handleCategoryClick = (slug) => {
    navigate(ROUTES.CATEGORY.replace(':slug', slug));
  };

  return (
    <section className="py-12 bg-[#fafbff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-medium text-text-primary mb-2">Featured Categories</h2>
          </div>
          <button 
            onClick={() => navigate(ROUTES.MARKETPLACE)}
            className="flex items-center gap-2 text-primary font-normal hover:gap-3 transition-all"
          >
            View All Categories <ArrowRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((cat, idx) => (
            <div 
              key={idx} 
              onClick={() => handleCategoryClick(cat.id)}
              className="group relative bg-white border border-gray-100 rounded-3xl p-6 hover:border-primary/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className={`w-16 h-16 ${cat.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform p-3`}>
                <img src={cat.image} alt={cat.name} className="w-full h-full object-contain" />
              </div>
              <h4 className="text-[17px] font-medium text-text-primary mb-3 group-hover:text-primary transition-colors">{cat.name}</h4>
              <span className="text-[13px] font-normal text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Browse Products <ArrowRight size={14} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
