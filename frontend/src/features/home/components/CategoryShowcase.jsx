import React from 'react';
import ProductCard from '../../../components/ui/ProductCard';

const CategoryShowcase = ({ title, subtitle, products }) => {
  return (
    <div className="py-12 bg-gray-50 mb-16 last:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-medium text-text-primary tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-text-secondary mt-2 text-md font-medium">{subtitle}</p>
            )}
          </div>
          <button className="px-7 py-2.5 border-2 border-primary text-primary font-medium rounded-full hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95">
            View All {title}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryShowcase;
