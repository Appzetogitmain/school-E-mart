import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, HelpCircle, IndianRupee, ShieldCheck, Building2, Store,
  CheckCircle2, ArrowRight, Sparkles, Percent, Calculator, Info
} from 'lucide-react';

const CommissionCalculationGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-150 animate-scale-in flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-[#0B1528] text-white p-5 sm:p-6 relative flex items-center justify-between shrink-0 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-lg shrink-0">
              <Calculator size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Commission & Earnings Guide
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] uppercase tracking-widest rounded-md font-extrabold border border-emerald-500/30">
                  Official Model
                </span>
              </div>
              <p className="text-xs text-gray-300 font-bold mt-0.5">
                Exact mathematical breakdown of platform cut, school share, and vendor payouts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-left font-outfit text-gray-800">
          {/* Rule 1: Admin Platform Revenue */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-xs sm:text-sm">
              <ShieldCheck size={18} className="text-emerald-700 shrink-0" />
              <span>1. Admin Platform Revenue (Platform Cut)</span>
            </div>
            <p className="text-xs text-emerald-900 font-bold leading-relaxed">
              The platform retains an automatic commission fee snapshot on every ordered line item:
            </p>
            <ul className="text-xs text-emerald-950 font-extrabold space-y-1.5 list-disc pl-5">
              <li><strong>Retail Marketplace Products:</strong> Default <strong>10%</strong> platform commission cut (or custom vendor rate).</li>
              <li><strong>Official School Class Kits:</strong> Default <strong>5%</strong> platform commission cut.</li>
            </ul>
          </div>

          {/* Rule 2: School Commission Share */}
          <div className="bg-purple-50/70 border border-purple-200/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-950 font-black text-xs sm:text-sm">
              <Building2 size={18} className="text-purple-700 shrink-0" />
              <span>2. Partner School Commission Share (Kits & Retail)</span>
            </div>
            <p className="text-xs text-purple-900 font-bold leading-relaxed">
              Partner schools earn passive revenue on <strong>BOTH</strong> official kit sales and general retail product orders:
            </p>
            <ul className="text-xs text-purple-950 font-extrabold space-y-1.5 list-disc pl-5">
              <li><strong>Class Kits:</strong> The authoring school earns its configured Kit Commission % (e.g. 5%).</li>
              <li><strong>Retail Product Sales:</strong> Whenever a student/parent linked to a school buys any retail marketplace product, their linked school automatically earns its configured Retail Commission % (e.g. 2%).</li>
            </ul>
          </div>

          {/* Rule 3: Vendor Payout Calculation */}
          <div className="bg-blue-50/70 border border-blue-200/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-950 font-black text-xs sm:text-sm">
              <Store size={18} className="text-blue-700 shrink-0" />
              <span>3. Vendor Net Payout Formula</span>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl p-3 text-center shadow-2xs">
              <code className="text-xs sm:text-sm font-black text-blue-950">
                Vendor Net Payout = Item Subtotal - Admin Commission - School Share
              </code>
            </div>
            <p className="text-xs text-blue-900 font-bold">
              The merchant receives the remaining balance, ensuring Vendor Share + Admin Cut + School Share = 100%.
            </p>
          </div>

          {/* Calculation Example Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              <span>Numerical Order Calculation Example</span>
            </h4>

            <div className="bg-white border border-gray-150 rounded-xl p-3.5 space-y-2 text-xs font-bold text-gray-700 shadow-2xs">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Order Line Item Subtotal:</span>
                <span className="font-black text-gray-900 text-sm">₹1,000.00</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>- Admin Platform Cut (10%):</span>
                <span className="font-black">₹100.00</span>
              </div>
              <div className="flex justify-between text-purple-800">
                <span>- School Share (5%):</span>
                <span className="font-black">₹50.00</span>
              </div>
              <div className="flex justify-between text-blue-800 border-t border-gray-100 pt-2 text-xs sm:text-sm font-black">
                <span>= Vendor Net Payout:</span>
                <span>₹850.00</span>
              </div>
            </div>
          </div>

          {/* Note on Data Sync */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900 flex items-start gap-2.5">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>100% Synchronized Data:</strong> Financial metrics across both the Wallet Page and Commission & Finance Hub use identical ledger calculation logic with zero ambiguity.
            </div>
          </div>
        </div>

        {/* Modal Bottom Action */}
        <div className="p-4 bg-gray-50 border-t border-gray-150 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[#0B1528] text-white font-black text-xs rounded-2xl hover:bg-black transition-all shadow-md active:scale-98"
          >
            Close Calculation Guide
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CommissionCalculationGuideModal;
