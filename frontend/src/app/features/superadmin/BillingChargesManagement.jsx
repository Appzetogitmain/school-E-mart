import React, { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee, Save, RefreshCw, CheckCircle,
  Percent, Store, School as SchoolIcon, Loader2, AlertCircle,
} from 'lucide-react';
import {
  getBillingConfig, updateBillingConfig,
  getMarketplaceSettings, updateMarketplaceSettings,
  listSchools, updateSchoolCommission,
} from '../../../services/adminApi';
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
  const [schoolFreeDays, setSchoolFreeDays] = useState(7);
  const [schoolDeliveryCharge, setSchoolDeliveryCharge] = useState(49);

  // --- platform commission rates (marketplace settings) ---
  const [marketplace, setMarketplace] = useState({}); // full section, preserved on save
  const [platformRetailPercent, setPlatformRetailPercent] = useState(0);
  const [platformKitPercent, setPlatformKitPercent] = useState(0);
  const [savingRates, setSavingRates] = useState(false);

  // --- per-school commission ---
  const [schools, setSchools] = useState([]); // { id, name, kitPercent, retailPercent }
  const [savingSchoolId, setSavingSchoolId] = useState(null);

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
      const [config, mk, schoolsRes] = await Promise.all([
        getBillingConfig(),
        getMarketplaceSettings(),
        listSchools({ limit: 100, status: 'all' }).catch(() => ({ data: [] })),
      ]);
      if (config) {
        setPlatformFee(paiseToRupees(config.platformFeePaise));
        setFreeDeliveryThreshold(paiseToRupees(config.freeDeliveryThresholdPaise));
        setDeliveryCharge(paiseToRupees(config.fixedDeliveryChargePaise));
        setSchoolFreeDays(config.schoolDeliveryFreeDays ?? 7);
        setSchoolDeliveryCharge(paiseToRupees(config.schoolDeliveryChargePaise ?? 4900));
      }
      if (mk) {
        setMarketplace(mk);
        setPlatformRetailPercent(toNum(mk.platformRetailPercent ?? mk.commissionPercent ?? 10));
        setPlatformKitPercent(toNum(mk.platformKitPercent ?? 5));
      }
      setSchools(
        (schoolsRes.data || []).map((s) => ({
          id: s._id?.toString?.() || s.id,
          name: s.name,
          kitPercent: toNum(s.commission?.kitPercent),
          retailPercent: toNum(s.commission?.retailPercent),
        }))
      );
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
      await updateBillingConfig({
        platformFeePaise: rupeesToPaise(platformFee),
        freeDeliveryThresholdPaise: rupeesToPaise(freeDeliveryThreshold),
        fixedDeliveryChargePaise: rupeesToPaise(deliveryCharge),
        schoolDeliveryFreeDays: Number(schoolFreeDays) || 7,
        schoolDeliveryChargePaise: rupeesToPaise(schoolDeliveryCharge),
      });
      flash('Delivery & platform charges saved.');
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to save billing settings'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRates = async () => {
    setSavingRates(true);
    setLoadError('');
    try {
      // The settings section is replaced wholesale on save, so send the full
      // marketplace object with only the two rates overridden.
      await updateMarketplaceSettings({
        ...marketplace,
        platformRetailPercent: toNum(platformRetailPercent),
        platformKitPercent: toNum(platformKitPercent),
      });
      flash('Platform commission rates saved.');
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to save commission rates'));
    } finally {
      setSavingRates(false);
    }
  };

  const updateSchoolField = (id, field, value) => {
    setSchools((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSaveSchoolCommission = async (school) => {
    setSavingSchoolId(school.id);
    setLoadError('');
    try {
      await updateSchoolCommission(school.id, {
        kitPercent: toNum(school.kitPercent),
        retailPercent: toNum(school.retailPercent),
      });
      flash(`Commission saved for ${school.name}.`);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to save school commission'));
    } finally {
      setSavingSchoolId(null);
    }
  };

  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const selectedSchoolRow = schools.find((s) => s.id === selectedSchoolId) || null;

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
          <p className="text-xs text-gray-400 font-bold mt-1.5">Control delivery fees, platform charges, and the platform commission rates.</p>
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

            {/* School Address Delivery Policy */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                <SchoolIcon size={16} className="text-indigo-600 stroke-[2.5]" />
                <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">School Address Delivery Policy</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">Free Delivery Period for School Address (Days)</label>
                  <div className={`relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 ${inputRing} transition-all`}>
                    <input type="number" min="0" required value={schoolFreeDays}
                      onChange={(e) => setSchoolFreeDays(Number(e.target.value))}
                      className="w-full bg-white px-4 py-2.5 focus:outline-none font-bold text-xs" />
                    <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 font-bold select-none text-xs">Days</span>
                  </div>
                  <span className="block text-[8px] text-gray-400 font-medium">School address delivery is free for orders placed within this many days of kit creation (e.g. 7 days).</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">School Delivery Fee After Window (₹)</label>
                  <div className={`relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 ${inputRing} transition-all`}>
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold select-none text-xs">₹</span>
                    <input type="number" min="0" step="0.01" required value={schoolDeliveryCharge}
                      onChange={(e) => setSchoolDeliveryCharge(Number(e.target.value))}
                      className="w-full bg-white pl-8 pr-4 py-2.5 focus:outline-none font-bold text-xs" />
                  </div>
                  <span className="block text-[8px] text-gray-400 font-medium">Applied to school address orders after the free delivery window has passed.</span>
                </div>
              </div>
            </div>

          </form>

          {/* ============ PLATFORM COMMISSION RATES ============ */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 select-none">
              <div>
                <div className="flex items-center gap-2">
                  <Percent size={16} className="text-indigo-600 stroke-[2.5]" />
                  <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">Platform Commission Rates</h3>
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-1">
                  The platform's cut. Schools set their own % on top (kits &amp; linked-user retail); the vendor is paid the rest.
                </p>
              </div>
              <button type="button" onClick={handleSaveRates} disabled={savingRates}
                className="flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all shadow-xs disabled:opacity-70 self-start sm:self-auto">
                {savingRates ? (
                  <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Save size={14} className="stroke-[2.5]" /> Save Rates</>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-gray-500 uppercase tracking-wide text-[9px] font-black">
                  <Store size={11} /> Platform Retail Commission %
                </label>
                <div className={`relative rounded-xl overflow-hidden border border-gray-200 ${inputRing} transition-all`}>
                  <input type="number" min="0" max="100" step="0.5" value={platformRetailPercent}
                    onChange={(e) => setPlatformRetailPercent(Number(e.target.value))}
                    className="w-full bg-white pl-4 pr-8 py-2.5 focus:outline-none font-bold text-xs" />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 font-bold select-none text-xs">%</span>
                </div>
                <span className="block text-[8px] text-gray-400 font-medium">Taken on every retail product sale (and bulk school purchases).</span>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-gray-500 uppercase tracking-wide text-[9px] font-black">
                  <SchoolIcon size={11} /> Platform Kit Commission %
                </label>
                <div className={`relative rounded-xl overflow-hidden border border-gray-200 ${inputRing} transition-all`}>
                  <input type="number" min="0" max="100" step="0.5" value={platformKitPercent}
                    onChange={(e) => setPlatformKitPercent(Number(e.target.value))}
                    className="w-full bg-white pl-4 pr-8 py-2.5 focus:outline-none font-bold text-xs" />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 font-bold select-none text-xs">%</span>
                </div>
                <span className="block text-[8px] text-gray-400 font-medium">Taken on every kit sale. The kit's school earns its own % on top.</span>
              </div>
            </div>
          </div>

          {/* ============ PER-SCHOOL COMMISSION ============ */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5 text-left">
            <div>
              <div className="flex items-center gap-2">
                <SchoolIcon size={16} className="text-indigo-600 stroke-[2.5]" />
                <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">Per-School Commission</h3>
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-1">
                Select a school and set what it earns — Kit % on its kits, Retail % when its linked users buy retail. Only you set this.
              </p>
            </div>

            {schools.length === 0 ? (
              <div className="py-10 text-center text-xs font-black text-gray-400">
                No schools yet. Add schools under School Management first.
              </div>
            ) : (
              <>
                {/* School selector */}
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">Select School</label>
                  <div className={`relative rounded-xl overflow-hidden border border-gray-200 ${inputRing}`}>
                    <select
                      value={selectedSchoolId}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      className="w-full bg-white pl-4 pr-8 py-2.5 focus:outline-none font-bold text-xs appearance-none cursor-pointer"
                    >
                      <option value="">Choose a school…</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected school's commission editor */}
                {selectedSchoolRow && (
                  <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <SchoolIcon size={14} className="text-indigo-600" />
                      <span className="text-xs font-black text-[#0B1528]">{selectedSchoolRow.name}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-gray-500 uppercase tracking-wide text-[9px] font-black"><Store size={11} /> Kit Commission %</label>
                        <div className={`relative rounded-xl overflow-hidden border border-gray-200 bg-white ${inputRing}`}>
                          <input type="number" min="0" max="100" step="0.5" value={selectedSchoolRow.kitPercent}
                            onChange={(e) => updateSchoolField(selectedSchoolRow.id, 'kitPercent', Number(e.target.value))}
                            className="w-full pl-4 pr-8 py-2.5 focus:outline-none font-bold text-xs" />
                          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 font-bold select-none text-xs">%</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-gray-500 uppercase tracking-wide text-[9px] font-black"><Percent size={11} /> Retail Commission %</label>
                        <div className={`relative rounded-xl overflow-hidden border border-gray-200 bg-white ${inputRing}`}>
                          <input type="number" min="0" max="100" step="0.5" value={selectedSchoolRow.retailPercent}
                            onChange={(e) => updateSchoolField(selectedSchoolRow.id, 'retailPercent', Number(e.target.value))}
                            className="w-full pl-4 pr-8 py-2.5 focus:outline-none font-bold text-xs" />
                          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 font-bold select-none text-xs">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => handleSaveSchoolCommission(selectedSchoolRow)} disabled={savingSchoolId === selectedSchoolRow.id}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider disabled:opacity-60">
                        {savingSchoolId === selectedSchoolRow.id ? (<><RefreshCw size={14} className="animate-spin" /> Saving…</>) : (<><Save size={14} /> Save Commission</>)}
                      </button>
                    </div>
                  </div>
                )}
              </>
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
