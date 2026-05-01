import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Filter, SlidersHorizontal, Grid, List, Search } from 'lucide-react';
import ProductCard from '../../components/ui/ProductCard';
import { ROUTES } from '../../constants/routes';

// Extensive dummy data for demonstration
const ALL_PRODUCTS = [
  // Furniture
  {
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=80&w=600',
    category: 'Furniture',
    slug: 'furniture',
    title: 'Modern Ergonomic Classroom Student Desk & Chair Set',
    currentPrice: 4200,
    originalPrice: 5500,
    discount: 24,
    hasBulkQuote: true,
    moq: '50 Sets',
  },
  {
    image: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=600',
    category: 'Furniture',
    slug: 'furniture',
    title: 'Adjustable Height Teacher\'s Table with Storage',
    currentPrice: 8500,
    originalPrice: 11000,
    discount: 22,
    hasBulkQuote: true,
    moq: '10 Units',
  },
  {
    image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&q=80&w=600',
    category: 'Furniture',
    slug: 'furniture',
    title: 'Library Compact Bookshelf - 5 Tier Metal',
    currentPrice: 12500,
    originalPrice: 15000,
    discount: 16,
    hasBulkQuote: true,
    moq: '5 Units',
  },
  // Uniforms
  {
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=600',
    category: 'Uniforms',
    slug: 'uniforms',
    title: 'Formal School Uniform Set - Secondary Level',
    currentPrice: 1850,
    originalPrice: 2500,
    discount: 26,
    hasBulkQuote: false,
  },
  {
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600',
    category: 'Uniforms',
    slug: 'uniforms',
    title: 'Premium Cotton Polo Shirt - House Color Red',
    currentPrice: 450,
    originalPrice: 650,
    discount: 30,
    hasBulkQuote: true,
    moq: '100 Units',
  },
  // STEM Labs
  {
    image: 'https://images.unsplash.com/photo-1530639834082-05bafb81dbad?auto=format&fit=crop&q=80&w=600',
    category: 'STEM Labs',
    slug: 'stem-labs',
    title: 'Institutional Robotics & Coding Lab Setup',
    currentPrice: 125000,
    originalPrice: 150000,
    discount: 16,
    hasBulkQuote: true,
    moq: '1 Lab',
  },
  // Books
  {
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600',
    category: 'Books',
    slug: 'books',
    title: 'Complete Grade 5 Book & Stationery Kit',
    currentPrice: 2450,
    originalPrice: 3200,
    discount: 23,
    hasBulkQuote: false,
  }
];

const CategoryPage = () => {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Filter products by slug
    const filtered = ALL_PRODUCTS.filter(p => p.slug === slug);
    setProducts(filtered);

    // Map slug to readable title
    const titleMap = {
      'furniture': 'School Furniture & Infrastructure',
      'uniforms': 'School Uniforms & Apparel',
      'books': 'Books & Stationery Kits',
      'stem-labs': 'STEM & Robotics Lab Equipment',
      'sports': 'Sports & Fitness Equipment'
    };
    setCategoryName(titleMap[slug] || slug.charAt(0).toUpperCase() + slug.slice(1));
  }, [slug]);

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Header & Breadcrumbs */}
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
                Showing {products.length} premium products for your institution.
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
          {/* 2. Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 space-y-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Filter size={16} /> Filters
                </h3>
                <div className="space-y-6">
                  {/* Price Range */}
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

                  {/* Procurement Type */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-3">Procurement</label>
                    <div className="space-y-2">
                      {['Bulk Orders', 'Retail/Single Unit', 'Request Quote'].map((type) => (
                        <label key={type} className="flex items-center gap-2 group cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20" />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Widget */}
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

          {/* 3. Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
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
                <select className="text-sm font-medium text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer">
                  <option>Newest Arrivals</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Best Discounts</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {products.map((product, index) => (
                  <ProductCard key={index} product={product} role={product.hasBulkQuote ? 'school' : 'parent'} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">We're still updating our catalog for this category. Check back soon!</p>
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
