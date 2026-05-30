import React from 'react';
import SectionHeader from '../../components/SectionHeader';
import CategoryStory from '../../components/CategoryStory';

const SchoolCategories = ({ categories }) => {
  return (
    <div className="mt-8">
      <SectionHeader 
        title="School Categories" 
        className="-ml-1" 
      />
      <div className="flex gap-5 overflow-x-auto px-6 pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <CategoryStory
            key={cat.name}
            name={cat.name}
            image={cat.image}
            color="border-purple-100"
            to={`/school/category/${cat.name.toLowerCase().replace(' ', '-')}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SchoolCategories;
