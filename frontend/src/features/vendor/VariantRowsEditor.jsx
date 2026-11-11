import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { emptyVariantRow } from '../../utils/variantRows';

const inputClass =
  'w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6]';
const labelClass = 'text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1';

/**
 * The price / MRP / stock rows of a product. One row with no name = a plain product; add more rows
 * (each with a name such as "100ml", "500ml", "Pack of 3") for variants with their own price and stock.
 */
const VariantRowsEditor = ({ rows, onChange }) => {
  const isVariantProduct = rows.length > 1 || Boolean(String(rows[0]?.label || '').trim());

  const update = (index, patch) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const remove = (index) => onChange(rows.filter((_, i) => i !== index));
  const add = () => onChange([...rows, emptyVariantRow()]);

  return (
    <div className="space-y-4" data-testid="variant-editor">
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Selling this in one size only? Leave the name empty and fill the price. If it comes in different sizes or packs
        (for example 100ml, 500ml, 1L), name each one and give it its own price and stock. Customers choose the variant before buying.
      </p>

      {rows.map((row, index) => (
        <div key={row.id || `new-${index}`} data-testid="variant-row" className="p-4 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#5B3FD6] uppercase tracking-wider">
              {isVariantProduct ? `Variant ${index + 1}` : 'Price & stock'}
            </span>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove variant ${index + 1}`}
                data-testid="variant-remove"
                className="text-gray-400 hover:text-red-500 transition-colors inline-flex items-center gap-1 text-[10px] font-bold"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Variant name</label>
              <input
                type="text"
                value={row.label}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder="e.g. 500ml, Size 28"
                data-testid="variant-label"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Selling price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.price}
                onChange={(e) => update(index, { price: e.target.value })}
                placeholder="99"
                data-testid="variant-price"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>MRP (₹) <span className="normal-case font-normal text-gray-400">optional</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.mrp}
                onChange={(e) => update(index, { mrp: e.target.value })}
                placeholder="129"
                data-testid="variant-mrp"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input
                type="number"
                min="0"
                step="1"
                value={row.stock}
                onChange={(e) => update(index, { stock: e.target.value })}
                placeholder="10"
                data-testid="variant-stock"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        data-testid="variant-add"
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[#5B3FD6]/30 text-[#5B3FD6] text-xs font-black inline-flex items-center justify-center gap-2 hover:bg-[#5B3FD6]/5 transition-colors"
      >
        <Plus size={15} /> Add another variant
      </button>
    </div>
  );
};

export default VariantRowsEditor;
