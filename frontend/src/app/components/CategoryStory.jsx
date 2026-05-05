import React from 'react';
import { Link } from 'react-router-dom';

const CategoryStory = ({ name, image, to, color = "border-primary/20" }) => {
  return (
    <Link 
      to={to} 
      className="flex flex-col items-center gap-2 min-w-[75px] group"
    >
      <div className={`w-[72px] h-[72px] rounded-full p-[3px] border-2 ${color} transition-all group-active:scale-90 shadow-sm`}>
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border border-white">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        </div>
      </div>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">
        {name}
      </span>
    </Link>
  );
};

export default CategoryStory;
