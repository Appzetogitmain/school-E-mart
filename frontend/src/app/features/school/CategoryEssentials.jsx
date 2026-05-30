import React from 'react';
import SectionHeader from '../../components/SectionHeader';
import ProductCard from '../../components/ProductCard';

const CategoryEssentials = ({ title, products, onViewAll }) => {
  return (
    <div className="mt-10 pb-6">
      <SectionHeader
        title={title}
        onViewAll={onViewAll}
        className="-ml-1"
      />
      <div className="grid grid-cols-2 gap-4 px-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryEssentials;
