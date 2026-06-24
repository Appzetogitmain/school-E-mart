import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, ShoppingBag, Star, Filter, Sparkles } from 'lucide-react';
import SchoolHeader from '../../components/SchoolHeader';
import { useCategoryTree } from '../../../hooks/useCategoryTree';
import { useProducts } from '../../../hooks/useProducts';
import {
  buildProductQueryForSubcategory,
  getSubcategoryOptions,
  resolveTaxonomyFromParam,
} from '../../../utils/mappers/categoryMapper';

const SchoolSubcategoryPage = () => {
  const { categoryName } = useParams();
  const [activeSub, setActiveSub] = useState('All');
  const schoolInfo = { name: 'Adarsh Public School', code: 'APS-1024' };
  const { tree, loading: treeLoading } = useCategoryTree();

  const taxonomy = useMemo(() => resolveTaxonomyFromParam(tree, categoryName), [tree, categoryName]);
  const subcategories = useMemo(() => getSubcategoryOptions(taxonomy), [taxonomy]);
  const productQuery = useMemo(
    () => buildProductQueryForSubcategory(taxonomy, activeSub, subcategories),
    [taxonomy, activeSub, subcategories]
  );
  const { products, loading: productsLoading } = useProducts(productQuery, {
    mapperKey: 'subcategory',
  });

  const renderProductCard = (product) => (
    <div key={product.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col overflow-hidden group active:scale-[0.98] transition-all">
      <div className="relative aspect-square bg-gray-50 p-4">
        <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black text-white uppercase tracking-wider z-10 shadow-lg">
          Bulk Deal
        </div>
        <button className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors z-10 bg-white/80 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center">
          <Star size={16} />
        </button>
        <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-deep-purple leading-tight line-clamp-2 h-10 mb-2">
          {product.name}
        </h3>
        <p className="text-[10px] text-gray-400 font-medium mb-4">Institutional Quality Guaranteed</p>
        <div className="flex flex-col mb-4">
          <span className="text-primary font-black text-lg leading-none">{product.price}</span>
          <span className="text-[9px] text-gray-400 mt-1">per batch order</span>
        </div>
        <button className="w-full py-3 bg-[#ffc107] text-black rounded-2xl text-[11px] font-black shadow-lg shadow-yellow-100 active:scale-95 transition-all flex items-center justify-center gap-2">
          <ShoppingBag size={14} />
          ORDER BULK
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white font-outfit">
      <SchoolHeader showSearch={true} childInfo={schoolInfo} />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-24 bg-gray-50/50 border-r border-gray-100 overflow-y-auto scrollbar-hide pt-52 pb-32">
          <div className="flex flex-col items-center gap-6">
            {(treeLoading ? [{ id: 'all', name: 'All', image: '/assets/uniforms.png' }] : subcategories).map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSub(sub.name)}
                className="flex flex-col items-center gap-2 group w-full px-2"
              >
                <div className={`w-16 h-16 rounded-[1.8rem] border-2 p-1 transition-all duration-300 relative ${activeSub === sub.name ? 'border-primary bg-white shadow-xl scale-105' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                  <img src={sub.image} alt={sub.name} className="w-full h-full object-cover rounded-[1.5rem] mix-blend-multiply" />
                  {activeSub === sub.name && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-l-full"></div>
                  )}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter text-center leading-tight transition-colors ${activeSub === sub.name ? 'text-primary' : 'text-gray-400'}`}>
                  {sub.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white pt-48 pb-32 px-6">
          <div className="bg-gradient-to-br from-[#ffc107] to-[#ffb300] rounded-[2.5rem] p-8 mb-8 relative overflow-hidden group shadow-xl shadow-yellow-100/50">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <div className="relative z-10 max-w-[85%]">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-deep-purple" />
                <span className="text-[10px] font-black uppercase tracking-widest text-deep-purple/60">Launch Offer</span>
              </div>
              <h2 className="text-deep-purple text-xl font-black leading-tight mb-4">Special Rates for {taxonomy.title}</h2>
              <button className="bg-deep-purple text-white text-[10px] font-black px-6 py-3 rounded-2xl shadow-lg active:scale-95 transition-all">
                REQUEST QUOTE
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[11px] font-black text-deep-purple uppercase tracking-[0.2em]">Bulk Products</h2>
            <button className="flex items-center gap-2 text-primary text-[10px] font-black bg-primary/10 px-4 py-2 rounded-full active:scale-95 transition-all">
              <Filter size={14} />
              FILTER
            </button>
          </div>

          {productsLoading ? (
            <p className="text-center text-sm text-gray-400 py-10">Loading products...</p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {products.map((product) => renderProductCard(product))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolSubcategoryPage;
