import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  ShoppingBag,
  BookOpen,
  Shirt,
  PenTool,
  Trophy,
  Star,
  Info,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import ProductCard from '../../components/ui/ProductCard';
import { ROUTES } from '../../constants/routes';
import { useCategoryTree } from '../../hooks/useCategoryTree';
import { useProducts } from '../../hooks/useProducts';
import { findHeaderCategory } from '../../utils/mappers/categoryMapper';
import { classIdToGradeQuery, sortKeyFromLabel } from '../../utils/mappers/productMapper';

const MOCK_GRADE_DATA = {
  nursery: { name: 'Nursery', focus: 'Early Learning & Comfort', age: '3-4 Years' },
  lkg: { name: 'LKG', focus: 'Foundation & Creativity', age: '4-5 Years' },
  ukg: { name: 'UKG', focus: 'Primary Readiness', age: '5-6 Years' },
  '1': { name: 'Class 1', focus: 'Core Subjects', age: '6-7 Years' },
  '2': { name: 'Class 2', focus: 'Language & Logic', age: '7-8 Years' },
  '3': { name: 'Class 3', focus: 'Exploratory Learning', age: '8-9 Years' },
  '4': { name: 'Class 4', focus: 'Intermediate Concepts', age: '9-10 Years' },
  '5': { name: 'Class 5', focus: 'Primary Graduation', age: '10-11 Years' },
  '6': { name: 'Class 6', focus: 'Secondary Foundation', age: '11-12 Years' },
  '7': { name: 'Class 7', focus: 'Analytical Skills', age: '12-13 Years' },
  '8': { name: 'Class 8', focus: 'Advanced Core', age: '13-14 Years' },
  '9': { name: 'Class 9', focus: 'Secondary Excellence', age: '14-15 Years' },
  '10': { name: 'Class 10', focus: 'Board Preparation', age: '15-16 Years' },
  '11': { name: 'Class 11', focus: 'Stream Specialization', age: '16-17 Years' },
  '12': { name: 'Class 12', focus: 'Higher Ed Transition', age: '17-18 Years' },
};

const CATEGORY_HEADER_MAP = {
  all: null,
  books: 'books',
  uniform: 'uniforms',
  stationery: 'stationery',
  sports: 'sports',
};

const GradeProductsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const classId = searchParams.get('class') || '1';
  const gradeInfo = MOCK_GRADE_DATA[classId] || MOCK_GRADE_DATA['1'];

  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const { tree } = useCategoryTree();

  const categories = [
    { id: 'all', name: 'All Essentials', icon: ShoppingBag },
    { id: 'books', name: 'Books & Guides', icon: BookOpen },
    { id: 'uniform', name: 'Uniforms', icon: Shirt },
    { id: 'stationery', name: 'Stationery', icon: PenTool },
    { id: 'sports', name: 'Sports & PE', icon: Trophy },
  ];

  const selectedHeader = useMemo(() => {
    const slug = CATEGORY_HEADER_MAP[activeCategory];
    return slug ? findHeaderCategory(tree, slug) : null;
  }, [tree, activeCategory]);

  const productQuery = useMemo(() => {
    const query = {
      limit: 24,
      sort: sortKeyFromLabel(sortBy),
      grade: classIdToGradeQuery(classId),
    };
    if (selectedHeader?.id) query.headerId = selectedHeader.id;
    return query;
  }, [classId, sortBy, selectedHeader]);

  const { products, loading } = useProducts(productQuery, { mapperKey: 'grade' });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [classId]);

  return (
    <div className="w-full bg-[#fcfcfd] min-h-screen">
      <section className="pt-32 pb-16 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-orange/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest mb-6 border border-white/10">
                <Sparkles size={14} className="text-accent-gold" />
                Tailored for {gradeInfo.name}
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Everything Your Child Needs for <span className="text-accent-orange">{gradeInfo.name}</span>
              </h1>
              <p className="text-white/70 text-lg mb-8 max-w-xl font-normal">
                Curated essentials focusing on <span className="text-white font-medium">{gradeInfo.focus}</span>.
                Everything from verified books to high-quality uniforms.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                  School Verified
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                  Age Group: {gradeInfo.age}
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm bg-white rounded-[3rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-500">
              <div className="absolute -top-4 -right-4 bg-accent-orange text-deep-purple font-black px-6 py-2 rounded-full text-sm shadow-xl z-20">
                SAVE 15%
              </div>
              <div className="mb-6 rounded-[2rem] overflow-hidden bg-gray-50 h-48 relative group">
                <img
                  src={products[0]?.image || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=300'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="Essential Kit"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <p className="text-white font-bold">The Ultimate {gradeInfo.name} Bundle</p>
                </div>
              </div>
              <h3 className="text-xl font-bold text-deep-purple mb-4">Complete Essentials Kit</h3>
              <ul className="space-y-3 mb-6">
                {['All Textbooks', 'Basic Stationery', 'School Diary'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-text-secondary font-normal">
                    <div className="w-5 h-5 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                      <Star size={10} fill="currentColor" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-deep-purple transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-3 active:scale-95">
                View Full Kit <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-20 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white shadow-lg shadow-purple-100'
                    : 'bg-gray-50 text-text-secondary hover:bg-gray-100'
                }`}
              >
                <cat.icon size={16} />
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={`Search ${gradeInfo.name} items...`}
                className="w-full bg-gray-50 border border-gray-100 rounded-full py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
              />
            </div>
            <div className="relative group">
              <select
                className="appearance-none bg-gray-50 border border-gray-100 rounded-full py-2.5 pl-5 pr-10 text-xs font-bold text-text-primary cursor-pointer focus:outline-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <p className="text-center text-gray-400 py-20">Loading products...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quickComm={true}
                  compact={false}
                />
              ))}
            </div>
          )}

          <div className="mt-20 text-center">
            <button className="px-10 py-4 border-2 border-gray-100 text-deep-purple rounded-2xl font-bold hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95">
              Explore More {gradeInfo.name} Products
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-soft-lavender/30 px-4">
        <div className="max-w-5xl mx-auto bg-white rounded-[3rem] p-10 md:p-16 border border-purple-100/30 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center shrink-0">
              <Info size={40} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-deep-purple mb-4">Shopping for {gradeInfo.name}?</h2>
              <p className="text-text-secondary leading-relaxed font-normal mb-6">
                At this stage, students typically need more focus on {gradeInfo.focus.toLowerCase()}. We recommend checking with your specific school for the updated 2026 textbook editions and specific uniform requirements.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Verified Quality', 'Fast Shipping', 'School Approved'].map((item, i) => (
                  <div key={i} className="px-4 py-2 bg-gray-50 rounded-full text-[11px] font-bold text-primary uppercase tracking-widest border border-gray-100">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
        </div>
      </section>

      <section className="py-20 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-deep-purple mb-10">Shopping for another child?</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.keys(MOCK_GRADE_DATA).map((id) => (
              <button
                key={id}
                onClick={() => navigate(`${ROUTES.SHOP_BY_GRADE}?class=${id}`)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold border transition-all ${
                  classId === id
                    ? 'bg-primary border-primary text-white shadow-lg'
                    : 'bg-white border-gray-100 text-text-primary hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                {id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GradeProductsPage;
