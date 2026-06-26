import React, { useEffect, useState } from 'react';
import ProductCard from '../../components/ui/ProductCard';
import { listFeaturedProducts } from '../../services/catalogApi';
import { mapProductForMarketingCard } from '../../utils/mappers/productMapper';

const ProductShowcase = ({ role = 'parent' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await listFeaturedProducts({ limit: 8 });
        if (!cancelled) {
          setProducts((data || []).map((p) => mapProductForMarketingCard(p)));
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setError('Unable to load featured products');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  return (
    <div className="py-12 bg-white min-h-[600px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-medium text-text-primary tracking-tight">
              {role === 'school' ? 'Institutional Grade Supplies' : 'Featured Student Essentials'}
            </h2>
            <p className="text-text-secondary mt-2 text-lg font-normal">
              {role === 'school'
                ? 'High-quality equipment and furniture for modern educational infrastructure.'
                : 'Premium quality kits, uniforms and stationery for your child’s academic journey.'}
            </p>
          </div>
          <button className="px-7 py-2.5 border-2 border-primary text-primary font-medium rounded-full hover:bg-primary hover:text-white transition-all shadow-sm">
            View All {role === 'school' ? 'Bulk Catalog' : 'Student Supplies'}
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-16">Loading products…</p>
        ) : error ? (
          <p className="text-center text-gray-400 py-16">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No featured products available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} role={role} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductShowcase;
