import React, { useState, useEffect } from 'react';
import {
  DollarSign, Save, ShieldCheck, MapPin, AlertCircle, RefreshCw, CheckCircle, Navigation, Info
} from 'lucide-react';
import { getMarketplaceSettings, updateMarketplaceSettings } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const BillingChargesManagement = () => {
  const [platformFee, setPlatformFee] = useState(10);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);
  const [pricingMode, setPricingMode] = useState('fixed'); // 'fixed' or 'distance'

  // Fixed Delivery states
  const [fixedDeliveryCharge, setFixedDeliveryCharge] = useState(12);

  // Distance-based states
  const [baseCharge, setBaseCharge] = useState(0);
  const [baseDistance, setBaseDistance] = useState(0);
  const [extraKmCharge, setExtraKmCharge] = useState(0);
  const [riderCommission, setRiderCommission] = useState(0);

  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getMarketplaceSettings()
      .then((settings) => {
        if (settings?.commissionPercent != null) {
          setPlatformFee(settings.commissionPercent);
        }
      })
      .catch((err) => setLoadError(getErrorMessage(err, 'Unable to load billing settings')));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setLoadError('');
    try {
      await updateMarketplaceSettings({ commissionPercent: Number(platformFee) });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to save billing settings'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800 relative">

      {/* SUCCESS FLOATING TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-[#0B1528] text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/10 animate-slide-in select-none">
          <div className="bg-emerald-500 p-1.5 rounded-full text-white">
            <CheckCircle size={16} className="stroke-[3]" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-black uppercase tracking-wider text-emerald-400">Settings Saved!</span>
            <span className="block text-[10px] text-gray-300 font-bold mt-0.5">Billing configurations have been deployed live to the user storefront.</span>
          </div>
        </div>
      )}

      {/* HEADER SECTION (Matching screenshots) */}
      <form onSubmit={handleSave} className="space-y-6 text-left">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Billing & Charges</h1>
              <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                SYSTEM CONSTANTS
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold mt-1.5">Manage delivery fees, platform charges, and thresholds.</p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all shadow-xs disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} className="stroke-[2.5]" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* BLOCK 1: GENERAL CHARGES CARD (Matching Screenshot 1) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
            <DollarSign size={16} className="text-indigo-600 stroke-[2.5]" />
            <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">General Charges</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Platform / Handling Fee */}
            <div className="space-y-1.5">
              <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">
                Platform/Handling Fee (₹)
              </label>

              <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold select-none text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={platformFee}
                  onChange={(e) => setPlatformFee(Number(e.target.value))}
                  className="w-full bg-white pl-8 pr-4 py-2.5 focus:outline-none font-bold text-xs"
                />
              </div>
              <span className="block text-[8px] text-gray-400 font-medium">Added to every order as handling charge.</span>
            </div>

            {/* Free Delivery Threshold */}
            <div className="space-y-1.5">
              <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">
                Free Delivery Threshold (₹)
              </label>

              <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold select-none text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                  className="w-full bg-white pl-8 pr-4 py-2.5 focus:outline-none font-bold text-xs"
                />
              </div>
              <span className="block text-[8px] text-gray-400 font-medium">Orders above this amount will have free delivery.</span>
            </div>

          </div>

        </div>

        {/* BLOCK 2: DELIVERY CONFIGURATION CARD (Matching Screenshots 1 & 2) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 select-none">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <Navigation size={16} className="text-indigo-600 stroke-[2.5]" />
                <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">Delivery Configuration</h3>
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Choose between fixed or distance-based pricing</p>
            </div>

            {/* Slidable Switch Toggle Selector */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200/50 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPricingMode('fixed')}
                className={`text-[10px] font-black uppercase tracking-wider py-1.5 px-4 rounded-lg transition-all ${pricingMode === 'fixed'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Fixed Price
              </button>

              <button
                type="button"
                onClick={() => setPricingMode('distance')}
                className={`text-[10px] font-black uppercase tracking-wider py-1.5 px-4 rounded-lg transition-all ${pricingMode === 'distance'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Distance Based
              </button>
            </div>
          </div>

          {/* FIXED PRICE LAYOUT SECTION (Screenshot 1) */}
          {pricingMode === 'fixed' ? (
            <div className="space-y-4 max-w-md animate-fade-in">
              <div className="space-y-1.5">
                <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">
                  Fixed Delivery Charge (₹)
                </label>

                <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold select-none text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={fixedDeliveryCharge}
                    onChange={(e) => setFixedDeliveryCharge(Number(e.target.value))}
                    className="w-full bg-white pl-8 pr-4 py-2.5 focus:outline-none font-bold text-xs"
                  />
                </div>
                <span className="block text-[8px] text-gray-400 font-medium">Flat fee charged for all deliveries below threshold.</span>
              </div>
            </div>
          ) : (

            // DISTANCE BASED LAYOUT SECTION (Screenshot 2)
            <div className="space-y-6 animate-fade-in">

              {/* Alert Info Banner */}
              <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3 select-none">
                <Info size={16} className="text-orange-500 mt-0.5 flex-shrink-0 stroke-[2.5]" />
                <p className="text-[10px] text-orange-800 font-bold leading-relaxed">
                  Note: Distance calculation requires Google Maps API Key. Without a key, it may fallback to straight line distance.
                </p>
              </div>

              {/* Four-Column grid of settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Column 1 Item 1: Base Charge */}
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">
                    Base Charge (₹)
                  </label>

                  <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold select-none text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={baseCharge}
                      onChange={(e) => setBaseCharge(Number(e.target.value))}
                      className="w-full bg-white pl-8 pr-4 py-2.5 focus:outline-none font-bold text-xs"
                    />
                  </div>
                  <span className="block text-[8px] text-gray-400 font-medium">Min charge for first X kms.</span>
                </div>

                {/* Column 2 Item 1: Base Distance */}
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">
                    Base Distance (km)
                  </label>

                  <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                    <input
                      type="number"
                      min="0"
                      required
                      value={baseDistance}
                      onChange={(e) => setBaseDistance(Number(e.target.value))}
                      className="w-full bg-white pl-4 pr-12 py-2.5 focus:outline-none font-bold text-xs"
                    />
                    <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 font-bold select-none text-xs">
                      km
                    </span>
                  </div>
                  <span className="block text-[8px] text-gray-400 font-medium">Distance covered in base charge.</span>
                </div>

                {/* Column 1 Item 2: Extra per km Charge */}
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">
                    Extra per km Charge (₹)
                  </label>

                  <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold select-none text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={extraKmCharge}
                      onChange={(e) => setExtraKmCharge(Number(e.target.value))}
                      className="w-full bg-white pl-8 pr-4 py-2.5 focus:outline-none font-bold text-xs"
                    />
                  </div>
                  <span className="block text-[8px] text-gray-400 font-medium">Charged for every km after base distance.</span>
                </div>

                {/* Column 2 Item 2: Delivery Boy Commission */}
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-wide text-[9px] font-black">
                    Delivery Boy Commission (₹/km)
                  </label>

                  <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold select-none text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={riderCommission}
                      onChange={(e) => setRiderCommission(Number(e.target.value))}
                      className="w-full bg-white pl-8 pr-4 py-2.5 focus:outline-none font-bold text-xs"
                    />
                  </div>
                  <span className="block text-[8px] text-gray-400 font-medium">Amount paid to delivery partner per km.</span>
                </div>

              </div>

            </div>
          )}

        </div>

      </form>

      {/* FOOTER COPYRIGHT BAR */}
      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">School E-Mart</span>
        </p>
      </div>

    </div>
  );
};

export default BillingChargesManagement;
