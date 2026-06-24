import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Filter, SlidersHorizontal, Grid, List, Search } from 'lucide-react';
import ProductCard from '../../components/ui/ProductCard';
import { ROUTES } from '../../constants/routes';
import { useCategoryTree } from '../../hooks/useCategoryTree';
import { useProducts } from '../../hooks/useProducts';
import { resolveTaxonomyFromParam } from '../../utils/mappers/categoryMapper';
import { sortKeyFromLabel } from '../../utils/mappers/productMapper';

const CategoryPage = () => {
  const { slug } = useParams();
  const [sortBy, setSortBy] = useState('newest');
  const { tree } = useCategoryTree();

  const taxonomy = useMemo(() => resolveTaxonomyFromParam(tree, slug), [tree, slug]);

  const productQuery = useMemo(() => {
    const query = { limit: 50, sort: sortKeyFromLabel(sortBy) };
    if (taxonomy.type === 'header') query.headerId = taxonomy.header?.id;
    else if (taxonomy.type === 'category') query.categoryId = taxonomy.category?.id;
    return query;
  }, [taxonomy, sortBy]);

  const { products, loading, pagination } = useProducts(productQuery, {
    mapperKey: 'marketing',
    categoryName: taxonomy.title,
  });

  const categoryName = taxonomy.title || slug?.charAt(0).toUpperCase() + slug?.slice(1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to={ROUTES.MARKETPLACE} className="hover:text-primary transition-colors">Marketplace</Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">{categoryName}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{categoryName}</h1>
              <p className="text-gray-500 mt-2 text-lg">
                Showing {pagination?.total ?? products.length} premium products for your institution.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search in category..."
                  className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 space-y-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Filter size={16} /> Filters
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-3">Price Range</label>
                    <div className="space-y-2">
                      {['Under ₹1,000', '₹1,000 - ₹5,000', '₹5,000 - ₹20,000', 'Over ₹20,000'].map((range) => (
                        <label key={range} className="flex items-center gap-2 group cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20" />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{range}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                <h4 className="font-bold text-primary mb-2">Need a Bulk Quote?</h4>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Planning to furnish an entire wing? Get custom institutional pricing.
                </p>
                <button className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-deep-purple transition-all">
                  Contact Expert
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-gray-600 border border-gray-200 rounded-lg">
                  <SlidersHorizontal size={20} />
                </button>
                <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                  <button className="p-1.5 bg-white text-primary shadow-sm rounded-md"><Grid size={18} /></button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600"><List size={18} /></button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  className="text-sm font-medium text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                  <option value="Best Discounts">Best Discounts</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p className="text-center text-gray-400 py-20">Loading products...</p>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} role={product.hasBulkQuote ? 'school' : 'parent'} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">We&apos;re still updating our catalog for this category. Check back soon!</p>
                <Link to={ROUTES.MARKETPLACE} className="inline-block mt-6 px-8 py-3 bg-primary text-white font-bold rounded-full hover:bg-deep-purple transition-all shadow-lg shadow-primary/20">
                  Back to Home
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
