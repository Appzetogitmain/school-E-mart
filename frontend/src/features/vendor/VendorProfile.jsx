import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck, Building, MapPin, Landmark, FileText, Check,
  AlertTriangle, Loader2, Upload, Trash2,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import {
  getVendorProfile,
  updateVendorProfile,
  updateVendorAddress,
  updateVendorTax,
  updateVendorBank,
  uploadVendorDocument,
  addVendorDocument,
} from '../../services/vendorApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import { hasRealLocation } from '../../utils/vendorLocation';

// Signup only collects name/store/email/phone/password, so the API fills the rest
// with these placeholders. Treat them as "not filled in yet" rather than real data.
const PLACEHOLDER_TEXT = 'Pending';
const PLACEHOLDER_PIN = '000000';

const isBlank = (v) => !v || String(v).trim() === '' || v === PLACEHOLDER_TEXT;

// Shared with the admin locations map, so "needs a location" here and "not shown
// on the map" there can never disagree about what counts as a real coordinate.
const isDefaultCoords = (coords = []) =>
  coords.length !== 2 || !hasRealLocation(coords[0], coords[1]);

const KYC_TYPES = [
  { value: 'pan', label: 'PAN Card' },
  { value: 'gst', label: 'GST Certificate' },
  { value: 'cheque', label: 'Cancelled Cheque' },
  { value: 'shop_licence', label: 'Shop Licence' },
  { value: 'other', label: 'Other' },
];

const SECTIONS = [
  { id: 'business', label: 'Business', Icon: Building },
  { id: 'address', label: 'Address', Icon: MapPin },
  { id: 'tax', label: 'Tax', Icon: FileText },
  { id: 'bank', label: 'Bank', Icon: Landmark },
  { id: 'documents', label: 'Documents', Icon: ShieldCheck },
];

const inputCls =
  'w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium';
const labelCls = 'text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5';

// Declared outside the page component: defining it inline would recreate the
// component on every render and remount it.
const SaveButton = ({ section, savingSection, savedSection }) => {
  const isSaving = savingSection === section;
  const isSaved = savedSection === section && !isSaving;
  return (
    <button
      type="submit"
      disabled={isSaving}
      className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isSaving && <Loader2 size={12} className="animate-spin" />}
      {isSaved && <Check size={12} />}
      <span>{isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save'}</span>
    </button>
  );
};

const VendorProfile = () => {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingSection, setSavingSection] = useState('');
  const [savedSection, setSavedSection] = useState('');
  const [activeSection, setActiveSection] = useState('business');

  const [business, setBusiness] = useState(null);
  const [address, setAddress] = useState(null);
  const [tax, setTax] = useState(null);
  const [bank, setBank] = useState(null);

  const [docType, setDocType] = useState('pan');
  const [docFile, setDocFile] = useState(null);
  const fileInputRef = React.useRef(null);

  const hydrate = useCallback((p) => {
    setProfile(p);
    setBusiness({
      name: p.user?.name || '',
      storeName: p.storeName || '',
      email: p.user?.email || '',
      phone: p.user?.phone || '',
      serviceRadiusKm: String(p.serviceRadiusKm ?? ''),
    });
    setAddress({
      line1: isBlank(p.address?.line1) ? '' : p.address.line1,
      line2: p.address?.line2 || '',
      city: isBlank(p.address?.city) ? '' : p.address.city,
      state: isBlank(p.address?.state) ? '' : p.address.state,
      country: p.address?.country || 'India',
      pinCode: p.address?.pinCode === PLACEHOLDER_PIN ? '' : p.address?.pinCode || '',
      latitude: isDefaultCoords(p.location?.coordinates) ? '' : String(p.location.coordinates[1]),
      longitude: isDefaultCoords(p.location?.coordinates) ? '' : String(p.location.coordinates[0]),
    });
    setTax({ panCard: p.panCard || '', gstin: p.gstin || '' });
    setBank({
      accountName: p.bank?.accountName || '',
      bankName: p.bank?.bankName || '',
      branch: p.bank?.branch || '',
      ifsc: p.bank?.ifsc || '',
      accountNumber: '',
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const p = await getVendorProfile();
      if (p) hydrate(p);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load profile'));
    } finally {
      setLoading(false);
    }
  }, [hydrate]);

  useEffect(() => {
    load();
  }, [load]);

  const afterSave = (updated, section) => {
    hydrate(updated);
    setSavedSection(section);
    setTimeout(() => setSavedSection(''), 2500);
    if (section === 'business' && user) {
      setUser({
        ...user,
        name: updated.user?.name || user.name,
        school: updated.storeName || user.school,
        phone: updated.user?.phone || user.phone,
        email: updated.user?.email || user.email,
      });
    }
  };

  const save = async (section, fn) => {
    setSavingSection(section);
    setError('');
    try {
      const updated = await fn();
      afterSave(updated, section);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save changes'));
    } finally {
      setSavingSection('');
    }
  };

  const saveBusiness = (e) => {
    e.preventDefault();
    save('business', () =>
      updateVendorProfile({
        name: business.name.trim(),
        storeName: business.storeName.trim(),
        email: business.email.trim(),
        phone: business.phone.trim(),
        ...(business.serviceRadiusKm !== ''
          ? { serviceRadiusKm: parseFloat(business.serviceRadiusKm) || 0 }
          : {}),
      })
    );
  };

  const saveAddress = (e) => {
    e.preventDefault();
    // Send only filled fields: the API merges, so blanks would fail validation
    // rather than clear anything useful.
    const payload = {};
    ['line1', 'line2', 'city', 'state', 'country', 'pinCode'].forEach((k) => {
      if (address[k].trim()) payload[k] = address[k].trim();
    });
    if (address.latitude !== '' && address.longitude !== '') {
      payload.latitude = parseFloat(address.latitude);
      payload.longitude = parseFloat(address.longitude);
    }
    save('address', () => updateVendorAddress(payload));
  };

  const saveTax = (e) => {
    e.preventDefault();
    save('tax', () =>
      updateVendorTax({
        panCard: tax.panCard.trim().toUpperCase(),
        gstin: tax.gstin.trim().toUpperCase(),
      })
    );
  };

  const saveBank = (e) => {
    e.preventDefault();
    const payload = {};
    ['accountName', 'bankName', 'branch'].forEach((k) => {
      if (bank[k].trim()) payload[k] = bank[k].trim();
    });
    if (bank.ifsc.trim()) payload.ifsc = bank.ifsc.trim().toUpperCase();
    // Blank means "keep the stored one" — it is hashed and cannot be read back.
    if (bank.accountNumber.trim()) payload.accountNumber = bank.accountNumber.trim();
    save('bank', () => updateVendorBank(payload));
  };

  const saveDocument = async (e) => {
    e.preventDefault();
    if (!docFile) return;
    setSavingSection('documents');
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      const attachment = await uploadVendorDocument(formData);
      const attachmentId = attachment?._id || attachment?.id;
      if (!attachmentId) throw new Error('Upload did not return an attachment');
      const updated = await addVendorDocument({ type: docType, attachmentId });
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      afterSave(updated, 'documents');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to upload document'));
    } finally {
      setSavingSection('');
    }
  };

  // What still needs filling in. Bank details genuinely block payouts, so they
  // are listed as required rather than optional.
  const checklist = profile
    ? [
        { label: 'Street address', done: !isBlank(profile.address?.line1), section: 'address' },
        { label: 'City', done: !isBlank(profile.address?.city), section: 'address' },
        { label: 'State', done: !isBlank(profile.address?.state), section: 'address' },
        { label: 'PIN code', done: !!profile.address?.pinCode && profile.address.pinCode !== PLACEHOLDER_PIN, section: 'address' },
        { label: 'Map location', done: !isDefaultCoords(profile.location?.coordinates), section: 'address' },
        { label: 'PAN card', done: !!profile.panCard, section: 'tax' },
        { label: 'Bank account (needed for payouts)', done: !!profile.bank?.accountNumberMasked && !!profile.bank?.ifsc, section: 'bank' },
        { label: 'KYC document', done: (profile.kycDocs?.length || 0) > 0, section: 'documents' },
      ]
    : [];
  const missing = checklist.filter((c) => !c.done);
  const pct = checklist.length ? Math.round(((checklist.length - missing.length) / checklist.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm font-black text-gray-400">
        <Loader2 size={18} className="animate-spin" />
        <span>Loading your profile…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-4">
          <span className="text-sm font-bold text-red-700">{error || 'Profile unavailable'}</span>
          <button onClick={load} className="rounded-lg border border-red-300 px-3 py-1.5 text-[11px] font-black uppercase text-red-700 hover:bg-red-100">
            Retry
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 font-sans antialiased text-gray-800 pb-10">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Store Profile</h1>
          <p className="text-xs text-gray-400 font-bold mt-1.5">
            Complete the details we could not collect at signup.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Account</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
            profile.status === 'approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : profile.status === 'rejected' || profile.status === 'suspended'
              ? 'bg-rose-50 text-rose-700 border-rose-100'
              : 'bg-amber-50 text-amber-700 border-amber-100'
          }`}>
            {profile.status}
          </span>
        </div>
      </div>

      {/* COMPLETION BANNER */}
      {missing.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-black text-amber-900">
                Your profile is {pct}% complete
              </h2>
              <p className="text-xs font-semibold text-amber-700/80 mt-0.5">
                Signup only asked for the basics. Add the rest so your store can trade and get paid.
              </p>

              <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {missing.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setActiveSection(m.section)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[10px] font-black text-amber-800 hover:bg-amber-100 transition-all"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {missing.length === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center gap-3">
          <Check size={18} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-black text-emerald-900">Your profile is complete.</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-xs font-bold text-red-700">{error}</span>
        </div>
      )}

      {/* SECTION NAV */}
      <div className="bg-white rounded-2xl border border-gray-200/75 p-3 flex flex-wrap gap-2 shadow-sm">
        {SECTIONS.map((s) => {
          const incomplete = checklist.some((c) => c.section === s.id && !c.done);
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeSection === s.id
                  ? 'bg-[#0B1528] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200/60'
              }`}
            >
              <s.Icon size={13} />
              <span>{s.label}</span>
              {incomplete && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Incomplete" />}
            </button>
          );
        })}
      </div>

      {/* PANELS */}
      <div className="bg-white rounded-[1.25rem] border border-gray-200 shadow-sm p-6">

        {activeSection === 'business' && (
          <form onSubmit={saveBusiness} className="space-y-5">
            <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">Business & Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Owner Name</label>
                <input type="text" className={inputCls} value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Store Name</label>
                <input type="text" className={inputCls} value={business.storeName} onChange={(e) => setBusiness({ ...business, storeName: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" pattern="[6-9]\d{9}" title="10-digit Indian mobile starting with 6-9" className={inputCls} value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Delivery Radius (km)</label>
                <input type="number" step="0.1" min="0" max="500" className={inputCls} value={business.serviceRadiusKm} onChange={(e) => setBusiness({ ...business, serviceRadiusKm: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100"><SaveButton section="business" savingSection={savingSection} savedSection={savedSection} /></div>
          </form>
        )}

        {activeSection === 'address' && (
          <form onSubmit={saveAddress} className="space-y-5">
            <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">Store Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Street / Line 1 {isBlank(profile.address?.line1) && <span className="text-amber-500">• needed</span>}</label>
                <input type="text" placeholder="e.g. 12 M.G. Road" className={inputCls} value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Line 2</label>
                <input type="text" placeholder="Optional" className={inputCls} value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>City {isBlank(profile.address?.city) && <span className="text-amber-500">• needed</span>}</label>
                <input type="text" className={inputCls} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>State {isBlank(profile.address?.state) && <span className="text-amber-500">• needed</span>}</label>
                <input type="text" className={inputCls} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input type="text" className={inputCls} value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>
                  PIN Code {(!profile.address?.pinCode || profile.address.pinCode === PLACEHOLDER_PIN) && <span className="text-amber-500">• needed</span>}
                </label>
                <input type="text" pattern="\d{6}" title="Six digits" placeholder="6 digits" className={inputCls} value={address.pinCode} onChange={(e) => setAddress({ ...address, pinCode: e.target.value })} />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <span className={labelCls}>
                Map Location {isDefaultCoords(profile.location?.coordinates) && <span className="text-amber-500">• needed</span>}
              </span>
              <p className="text-[11px] text-gray-400 font-semibold mb-3">
                Used to match your store to nearby customers within your delivery radius.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Latitude</label>
                  <input type="number" step="any" min="-90" max="90" placeholder="e.g. 22.7196" className={inputCls} value={address.latitude} onChange={(e) => setAddress({ ...address, latitude: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Longitude</label>
                  <input type="number" step="any" min="-180" max="180" placeholder="e.g. 75.8577" className={inputCls} value={address.longitude} onChange={(e) => setAddress({ ...address, longitude: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100"><SaveButton section="address" savingSection={savingSection} savedSection={savedSection} /></div>
          </form>
        )}

        {activeSection === 'tax' && (
          <form onSubmit={saveTax} className="space-y-5">
            <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">Tax Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>PAN {!profile.panCard && <span className="text-amber-500">• needed</span>}</label>
                <input type="text" placeholder="ABCDE1234F" className={`${inputCls} uppercase`} value={tax.panCard} onChange={(e) => setTax({ ...tax, panCard: e.target.value })} />
                <span className="text-[10px] text-gray-400 font-semibold mt-1 block">Five letters, four digits, one letter.</span>
              </div>
              <div>
                <label className={labelCls}>GSTIN</label>
                <input type="text" placeholder="22ABCDE1234F1Z5" className={`${inputCls} uppercase`} value={tax.gstin} onChange={(e) => setTax({ ...tax, gstin: e.target.value })} />
                <span className="text-[10px] text-gray-400 font-semibold mt-1 block">Optional — leave blank if not GST registered.</span>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100"><SaveButton section="tax" savingSection={savingSection} savedSection={savedSection} /></div>
          </form>
        )}

        {activeSection === 'bank' && (
          <form onSubmit={saveBank} className="space-y-5">
            <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">Bank Account</h2>
            <p className="text-xs font-semibold text-gray-500 -mt-2">
              Required before you can request a payout.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Account Holder Name</label>
                <input type="text" className={inputCls} value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Bank Name</label>
                <input type="text" className={inputCls} value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Branch</label>
                <input type="text" className={inputCls} value={bank.branch} onChange={(e) => setBank({ ...bank, branch: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>IFSC {!profile.bank?.ifsc && <span className="text-amber-500">• needed</span>}</label>
                <input type="text" placeholder="HDFC0001234" className={`${inputCls} uppercase`} value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Account Number {!profile.bank?.accountNumberMasked && <span className="text-amber-500">• needed</span>}
                </label>
                <input
                  type="text"
                  placeholder={profile.bank?.accountNumberMasked ? 'Saved — type a new number to replace it' : '8–20 digits'}
                  className={inputCls}
                  value={bank.accountNumber}
                  onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                />
                <span className="text-[10px] text-gray-400 font-semibold mt-1 block">
                  {profile.bank?.accountNumberMasked
                    ? 'An account number is on file. It is stored securely and cannot be displayed again — leave blank to keep it.'
                    : 'Stored securely and never shown again once saved.'}
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100"><SaveButton section="bank" savingSection={savingSection} savedSection={savedSection} /></div>
          </form>
        )}

        {activeSection === 'documents' && (
          <div className="space-y-5">
            <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">KYC Documents</h2>

            {profile.kycDocs?.length > 0 ? (
              <div className="space-y-2">
                {profile.kycDocs.map((doc, i) => (
                  <div key={doc._id || i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-150 bg-gray-50/50">
                    <FileText size={15} className="text-gray-400 shrink-0" />
                    <span className="text-xs font-black text-gray-700 flex-1">
                      {KYC_TYPES.find((t) => t.value === doc.type)?.label || doc.type}
                    </span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase">Uploaded</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-gray-400">No documents uploaded yet.</p>
            )}

            <form onSubmit={saveDocument} className="border-t border-gray-100 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Document Type</label>
                  <select className={inputCls} value={docType} onChange={(e) => setDocType(e.target.value)}>
                    {KYC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-500 flex items-center justify-center gap-2 transition-all"
                  >
                    <Upload size={13} />
                    <span className="truncate">{docFile ? docFile.name : 'Choose image or PDF (max 5MB)'}</span>
                  </button>
                </div>
              </div>

              {docFile && (
                <button
                  type="button"
                  onClick={() => { setDocFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-[10px] text-red-500 font-black hover:underline flex items-center gap-1"
                >
                  <Trash2 size={11} /> Remove selected file
                </button>
              )}

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={!docFile || savingSection === 'documents'}
                  className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingSection === 'documents' && <Loader2 size={12} className="animate-spin" />}
                  <span>{savingSection === 'documents' ? 'Uploading…' : 'Upload Document'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default VendorProfile;
