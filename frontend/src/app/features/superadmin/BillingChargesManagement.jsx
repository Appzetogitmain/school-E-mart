import React, { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee, Save, RefreshCw, CheckCircle,
  Percent, Store, School as SchoolIcon, Loader2, AlertCircle,
} from 'lucide-react';
import {
  getBillingConfig, updateBillingConfig,
} from '../../../services/adminApi';
import { getCategoryTree, updateCategory } from '../../../services/catalogApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

// BillingConfig stores money in paise; the UI edits rupees.
const paiseToRupees = (paise) => (Number(paise) || 0) / 100;
const rupeesToPaise = (rupees) => Math.round((Number(rupees) || 0) * 100);
const toNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const BillingChargesManagement = () => {
  // --- charges (rupees in state, converted to paise on save) ---
  const [platformFee, setPlatformFee] = useState(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  // --- per-category commission ---
  const [categories, setCategories] = useState([]); // flattened: { id, name, header, adminPercent, schoolPercent }
  const [savingCommissions, setSavingCommissions] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const flash = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [config, tree] = await Promise.all([getBillingConfig(), getCategoryTree()]);
      if (config) {
        setPlatformFee(paiseToRupees(config.platformFeePaise));
        setFreeDeliveryThreshold(paiseToRupees(config.freeDeliveryThresholdPaise));
        setDeliveryCharge(paiseToRupees(config.fixedDeliveryChargePaise));
      }
      // Flatten header -> categories into an editable list.
      const flat = [];
      (tree || []).forEach((header) => {
        (header.categories || []).forEach((category) => {
          flat.push({
            id: category._id,
            name: category.name,
            header: header.name,
            adminPercent: toNum(category.commission?.adminPercent),
            schoolPercent: toNum(category.commission?.schoolPercent),
          });
        });
      });
      setCategories(flat);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to load billing settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveCharges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setLoadError('');
    try {
      // Only the fields this simplified page controls. pricingMode stays 'fixed'
      // so checkout always applies the flat delivery charge below.
      await updateBillingConfig({
        platformFeePaise: rupeesToPaise(platformFee),
        freeDeliveryThresholdPaise: rupeesToPaise(freeDeliveryThreshold),
        pricingMode: 'fixed',
        fixedDeliveryChargePaise: rupeesToPaise(deliveryCharge),
      });
      flash('Delivery & platform charges saved.');
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to save billing settings'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateCategoryField = (id, field, value) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveCommissions = async () => {
    setSavingCommissions(true);
    setLoadError('');
    try {
      // Persist each category's split. Kept sequential so a single bad row
      // surfaces its own error rather than a vague batch failure.
      for (const category of categories) {
        await updateCategory(category.id, {
          commission: {
            adminPercent: toNum(category.adminPercent),
            schoolPercent: toNum(category.schoolPercent),
          },
        });
      }
      flash('Category commissions saved.');
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to save category commissions'));
    } finally {
      setSavingCommissions(false);
    }
  };

  const inputRing = 'focus-within:ring-2 focus-within:ring-indigo-500/25';

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800 relative">

      {showToast && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-[#0B1528] text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/10 animate-slide-in select-none">
          <div className="bg-emerald-500 p-1.5 rounded-full text-white">
            <CheckCircle size={16} className="stroke-[3]" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-black uppercase tracking-wider text-emerald-400">Saved!</span>
            <span className="block text-[10px] text-gray-300 font-bold mt-0.5">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Billing & Charges</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              LIVE PRICING
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Control delivery fees, platform charges, and the per-category profit split.</p>
        </div>
      </div>

      {loadError && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle size={14} />
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex items-center justify-center text-gray-400">
          <Loader2 size={22} className="animate-spin mr-2" />
          <span className="text-sm font-bold">Loading billing settings…</span>
        </div>
      ) : (
        <>
          {/* ============ CHARGES ============ */}
          <form onSubmit={handleSaveCharges} className="space-y-6 text-left">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all shadow-xs disabled:opacity-70"
              >
                {isSaving ? (
                  <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Save size={14} className="stroke-[2.5]" /> Save Charges</>
                )}
              </button>
            </div>

            {/* General charges */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                <IndianRupee size={16} className="text-indigo-600 stroke-[2.5]" />
                <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">General Charges</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">Platform / Handling Fee (₹)</label>
                  <div className={`relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 ${inputRing} transition-all`}>
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold select-none text-xs">₹</span>
                    <input type="number" min="0" step="0.01" required value={platformFee}
                      onChange={(e) => setPlatformFee(Number(e.target.value))}
                      className="w-full bg-white pl-8 pr-4 py-2.5 focus:outline-none font-bold text-xs" />
                  </div>
                  <span className="block text-[8px] text-gray-400 font-medium">Added to every order as a platform fee.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">Delivery Charge (₹)</label>
                  <div className={`relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 ${inputRing} transition-all`}>
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold select-none text-xs">₹</span>
                    <input type="number" min="0" step="0.01" required value={deliveryCharge}
                      onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                      className="w-full bg-white pl-8 pr-4 py-2.5 focus:outline-none font-bold text-xs" />
                  </div>
                  <span className="block text-[8px] text-gray-400 font-medium">Flat fee charged unless the order clears the free-delivery threshold.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">Free Delivery Threshold (₹)</label>
                  <div className={`relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 ${inputRing} transition-all`}>
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold select-none text-xs">₹</span>
                    <input type="number" min="0" step="0.01" required value={freeDeliveryThreshold}
                      onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                      className="w-full bg-white pl-8 pr-4 py-2.5 focus:outline-none font-bold text-xs" />
                  </div>
                  <span className="block text-[8px] text-gray-400 font-medium">Orders at or above this subtotal ship free (0 = never).</span>
                </div>
              </div>
            </div>

          </form>

          {/* ============ CATEGORY COMMISSION ============ */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 select-none">
              <div>
                <div className="flex items-center gap-2">
                  <Percent size={16} className="text-indigo-600 stroke-[2.5]" />
                  <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">Category Commission & Profit Split</h3>
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-1">
                  Per category: the platform keeps Admin %, the school earns School %, and the vendor is paid the rest.
                </p>
              </div>
              <button type="button" onClick={handleSaveCommissions} disabled={savingCommissions}
                className="flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all shadow-xs disabled:opacity-70 self-start sm:self-auto">
                {savingCommissions ? (
                  <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Save size={14} className="stroke-[2.5]" /> Save Commissions</>
                )}
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="py-10 text-center text-xs font-black text-gray-400">
                No categories yet. Create categories under Category Management first.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[560px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 w-32">
                        <span className="flex items-center gap-1"><IndianRupee size={11} /> Admin %</span>
                      </th>
                      <th className="px-4 py-3 w-32">
                        <span className="flex items-center gap-1"><SchoolIcon size={11} /> School %</span>
                      </th>
                      <th className="px-4 py-3 w-32">
                        <span className="flex items-center gap-1"><Store size={11} /> Vendor gets</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {categories.map((category) => {
                      const admin = toNum(category.adminPercent);
                      const school = toNum(category.schoolPercent);
                      const vendor = 100 - admin - school;
                      const invalid = vendor < 0;
                      return (
                        <tr key={category.id} className="hover:bg-gray-50/40">
                          <td className="px-4 py-3">
                            <span className="font-black text-gray-900 block">{category.name}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{category.header}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${inputRing}`}>
                              <input type="number" min="0" max="100" step="0.5" value={category.adminPercent}
                                onChange={(e) => updateCategoryField(category.id, 'adminPercent', Number(e.target.value))}
                                className="w-full bg-white pl-3 pr-7 py-2 focus:outline-none font-bold text-xs" />
                              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 font-bold select-none text-[10px]">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${inputRing}`}>
                              <input type="number" min="0" max="100" step="0.5" value={category.schoolPercent}
                                onChange={(e) => updateCategoryField(category.id, 'schoolPercent', Number(e.target.value))}
                                className="w-full bg-white pl-3 pr-7 py-2 focus:outline-none font-bold text-xs" />
                              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 font-bold select-none text-[10px]">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-black ${invalid ? 'text-red-600' : 'text-emerald-600'}`}>
                              {invalid ? 'Over 100%' : `${vendor}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">School E-Mart</span>
        </p>
      </div>
    </div>
  );
};

export default BillingChargesManagement;
