import React from 'react';
import { Minus, Plus } from 'lucide-react';

const QuantitySelector = ({ quantity, onIncrease, onDecrease, className = "" }) => {
  return (
    <div className={`flex items-center gap-4 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 ${className}`}>
      <button 
        onClick={onDecrease}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary active:scale-90 transition-all"
      >
        <Minus size={16} />
      </button>
      <span className="text-sm font-black text-deep-purple w-4 text-center">
        {quantity}
      </span>
      <button 
        onClick={onIncrease}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary active:scale-90 transition-all"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default QuantitySelector;
