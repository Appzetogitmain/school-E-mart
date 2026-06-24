import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import ProductCard from '../../components/ProductCard';
import { useCategoryTree } from '../../../hooks/useCategoryTree';
import { useProducts } from '../../../hooks/useProducts';
import { findHeaderCategory } from '../../../utils/mappers/categoryMapper';

const CategoryPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const { tree: mainCategories, loading: categoriesLoading } = useCategoryTree();
  const uniformsHeader = findHeaderCategory(mainCategories, 'uniforms');
  const stationeryHeader = findHeaderCategory(mainCategories, 'stationery');
  const { products: uniformProducts } = useProducts(
    { headerId: uniformsHeader?.id, limit: 3, sort: 'popular' },
    { enabled: Boolean(uniformsHeader?.id) }
  );
  const { products: stationeryProducts } = useProducts(
    { headerId: stationeryHeader?.id, limit: 3, sort: 'popular' },
    { enabled: Boolean(stationeryHeader?.id) }
  );

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  const shopByGrade = [
    { grade: 'Pre-Primary', range: 'Nursery - UKG', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&h=200&fit=crop' },
    { grade: 'Primary', range: 'Class 1 - 5', image: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=400&h=200&fit=crop' },
    { grade: 'Secondary', range: 'Class 6 - 10', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&h=200&fit=crop' },
  ];

  const renderProductCard = (product) => (
    <ProductCard key={product.id} product={product} />
  );

  return (
    <>
      <AppHeader scrolled={scrolled} />
      <div
        onScroll={handleScroll}
        className="flex flex-col h-full bg-white pb-32 overflow-y-auto font-outfit"
      >
        <div className="h-[140px] shrink-0"></div>
        <div className="px-6 mt-4">
          {categoriesLoading ? (
            <p className="text-center text-sm text-gray-400 py-8">Loading categories...</p>
          ) : (
            <div className="grid grid-cols-3 gap-y-6">
              {mainCategories.map((cat) => (
                <Link
                  key={cat.id || cat.name}
                  to={`/user/category/${cat.slug || cat.name.toLowerCase()}`}
                  className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all"
                >
                  <div className={`w-24 h-24 bg-gradient-to-br ${cat.color} rounded-3xl p-3 border border-white shadow-sm group-hover:shadow-md transition-shadow relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                    <img src={cat.image} alt={cat.name} className="w-16 h-16 object-contain mix-blend-multiply relative z-10 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <span className="mt-3 text-[10px] font-bold text-deep-purple uppercase tracking-wider text-center">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-deep-purple">Shop by Grade</h2>
            <ArrowRight size={18} className="text-primary" />
          </div>

          <div className="space-y-4">
            {shopByGrade.map((item) => (
              <Link
                key={item.grade}
                to={`/user/select-grade?group=${encodeURIComponent(item.grade)}`}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm flex h-24 active:scale-[0.98] transition-all block"
              >
                <div className="w-32 h-full shrink-0">
                  <img src={item.image} alt={item.grade} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-center px-5">
                  <h3 className="text-base font-bold text-deep-purple">{item.grade}</h3>
                  <p className="text-xs text-gray-400 font-medium">{item.range}</p>
                </div>
                <div className="flex items-center pr-6">
                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-primary">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <Link to="/user/category/uniforms" className="mt-12 px-6 block group">
          <h2 className="text-lg font-bold text-deep-purple mb-4 group-hover:text-primary transition-colors">Uniforms Highlight</h2>
          <div className="rounded-2xl h-36 overflow-hidden relative mb-4 shadow-md border border-gray-100 group-active:scale-[0.99] transition-all">
            <img src="/assets/category_banner1.png" className="w-full h-full object-cover" alt="Uniforms" />
          </div>
        </Link>
        <div className="px-6">
          <div className="grid grid-cols-2 gap-3">
            {uniformProducts.map((product) => renderProductCard(product))}
          </div>
        </div>

        <Link to="/user/category/stationery" className="mt-12 px-6 block group">
          <h2 className="text-lg font-bold text-deep-purple mb-4 group-hover:text-primary transition-colors">Stationery Highlight</h2>
          <div className="rounded-2xl h-36 overflow-hidden relative mb-4 shadow-md border border-gray-100 group-active:scale-[0.99] transition-all">
            <img src="/assets/category_banner3.png" className="w-full h-full object-cover" alt="Stationery" />
          </div>
        </Link>
        <div className="px-6 pb-20">
          <div className="grid grid-cols-2 gap-3">
            {stationeryProducts.map((product) => renderProductCard(product))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
