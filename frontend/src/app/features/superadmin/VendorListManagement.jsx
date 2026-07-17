import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Edit, Trash2, X, Download, Plus, Store, Eye, FileText, ExternalLink,
  Check, AlertCircle, RefreshCw, Loader2, BadgeCheck, MapPin, Percent, ShieldCheck,
} from 'lucide-react';
import {
  listVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapAdminVendorForList } from '../../../utils/mappers/adminVendorMapper';

// Tab values are the backend's computed status, so 'rejected' and 'suspended' stay
// distinguishable even though both are stored as approvalStatus 'suspended'.
const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Rejected', value: 'rejected' },
];

const KYC_LABELS = {
  pan: 'PAN Card',
  gst: 'GST Certificate',
  cheque: 'Cancelled Cheque',
  shop_licence: 'Shop Licence',
  other: 'Other Document',
};

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_STYLES = {
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  'Under Review': 'bg-sky-50 text-sky-700 border-sky-100',
  Suspended: 'bg-orange-50 text-orange-700 border-orange-100',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

// Every address field is required on the vendor record, so the form asks for all
// of them rather than letting the API fall back to placeholder values.
const EMPTY_CREATE = {
  name: '',
  storeName: '',
  email: '',
  phone: '',
  password: '',
  commissionPercent: '10',
  serviceRadiusKm: '10',
  line1: '',
  line2: '',
  city: '',
  state: '',
  country: 'India',
  pinCode: '',
  latitude: '',
  longitude: '',
  autoApprove: true,
};

const initials = (value = '') =>
  value.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

// Which tab each edit field lives on, so a validation failure can reveal it.
const EDIT_FIELD_TAB = {
  name: 'General', storeName: 'General', email: 'General', phone: 'General',
  commissionPercent: 'General', serviceRadiusKm: 'General',
  pinCode: 'Address',
  panCard: 'Tax & Bank', gstin: 'Tax & Bank', ifsc: 'Tax & Bank', accountNumber: 'Tax & Bank',
};

/**
 * Mirrors the API's rules so the admin gets a pointed message instead of an opaque
 * 400. Native `required` cannot be used here: the form is tabbed, and the browser
 * silently refuses to submit when an invalid control is on a hidden tab.
 * Returns [field, message] or null.
 */
const validateEditForm = (f) => {
  if (f.name.trim().length < 2) return ['name', 'Owner name must be at least 2 characters.'];
  if (f.storeName.trim().length < 2) return ['storeName', 'Store name must be at least 2 characters.'];
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return ['email', 'Enter a valid email address.'];
  if (!/^[6-9]\d{9}$/.test(f.phone.trim())) return ['phone', 'Phone must be a 10-digit Indian mobile starting with 6-9.'];

  const commission = parseFloat(f.commissionPercent);
  if (Number.isNaN(commission) || commission < 0 || commission > 100) {
    return ['commissionPercent', 'Commission must be between 0 and 100.'];
  }
  const radius = parseFloat(f.serviceRadiusKm);
  if (Number.isNaN(radius) || radius < 0 || radius > 500) {
    return ['serviceRadiusKm', 'Service radius must be between 0 and 500 km.'];
  }

  if (f.pinCode.trim() && !/^\d{6}$/.test(f.pinCode.trim())) return ['pinCode', 'PIN code must be exactly 6 digits.'];
  if (f.panCard.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(f.panCard.trim().toUpperCase())) {
    return ['panCard', 'PAN must be 5 letters, 4 digits, then 1 letter.'];
  }
  if (f.gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/.test(f.gstin.trim().toUpperCase())) {
    return ['gstin', 'GSTIN must be a valid 15-character GST number.'];
  }
  if (f.ifsc.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc.trim().toUpperCase())) {
    return ['ifsc', 'IFSC must be 4 letters, a 0, then 6 characters.'];
  }
  if (f.accountNumber.trim() && !/^\d{8,20}$/.test(f.accountNumber.trim())) {
    return ['accountNumber', 'Account number must be 8-20 digits.'];
  }
  return null;
};

// Declared at module scope: defining it inside the page would recreate the
// component on every render.
const DetailBlock = ({ title, icon, rows }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-400 flex items-center">{icon}</span>
      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</h4>
    </div>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-gray-150 bg-gray-50/40 p-4">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-3 min-w-0">
          <dt className="text-[11px] font-bold text-gray-400 shrink-0">{label}</dt>
          <dd className="text-xs font-black text-gray-800 truncate text-right" title={String(value ?? '')}>
            {value || '—'}
          </dd>
        </div>
      ))}
    </dl>
  </div>
);

const VendorListManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showCount, setShowCount] = useState(10);

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Create modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);

  // Edit modal
  // Read-only detail view (everything the vendor submitted, incl. KYC files)
  const [viewingVendor, setViewingVendor] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General');

  // Fetch every vendor and filter client-side: tab counts must not depend on the
  // active tab, and the server's 'suspended' filter cannot separate rejected from
  // suspended (both are stored the same way).
  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listVendors({ limit: 100 });
      setVendors((data || []).map(mapAdminVendorForList));
    } catch (err) {
      setVendors([]);
      setError(getErrorMessage(err, 'Unable to load vendors'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const runVendorAction = async (vendor, action) => {
    if (!vendor?.mongoId) return;
    const confirmText = {
      reject: `Reject "${vendor.storeName}"? Their login will be disabled.`,
      suspend: `Suspend "${vendor.storeName}"? They will not be able to sign in.`,
    }[action];
    if (confirmText && !confirm(confirmText)) return;

    setActionId(vendor.mongoId);
    try {
      if (action === 'approve') await approveVendor(vendor.mongoId, {});
      if (action === 'reject') await rejectVendor(vendor.mongoId, { reason: 'Rejected by admin' });
      if (action === 'suspend') await suspendVendor(vendor.mongoId, { reason: 'Suspended by admin' });
      if (action === 'reactivate') await reactivateVendor(vendor.mongoId, {});
      await loadVendors();
    } catch (err) {
      alert(getErrorMessage(err, `Unable to ${action} vendor`));
    } finally {
      setActionId(null);
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    const f = createForm;
    if (!f.name.trim() || !f.storeName.trim() || !f.email.trim() || !f.phone.trim() || !f.password) return;

    const payload = {
      name: f.name.trim(),
      storeName: f.storeName.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      password: f.password,
      commissionPercent: parseFloat(f.commissionPercent) || 0,
      serviceRadiusKm: parseFloat(f.serviceRadiusKm) || 0,
      autoApprove: f.autoApprove,
      address: {
        line1: f.line1.trim(),
        city: f.city.trim(),
        state: f.state.trim(),
        country: f.country.trim() || 'India',
        pinCode: f.pinCode.trim(),
      },
    };
    if (f.line2.trim()) payload.address.line2 = f.line2.trim();
    if (f.latitude !== '' && f.longitude !== '') {
      payload.latitude = parseFloat(f.latitude);
      payload.longitude = parseFloat(f.longitude);
    }

    try {
      setSaving(true);
      await createVendor(payload);
      setCreateForm(EMPTY_CREATE);
      setIsAddModalOpen(false);
      await loadVendors();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to create vendor'));
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (v) => {
    setEditingVendor(v);
    setActiveFormTab('General');
    setEditError('');
    setEditForm({
      name: v.name,
      storeName: v.storeName,
      email: v.email,
      phone: v.phone,
      commissionPercent: String(v.commissionPercent),
      serviceRadiusKm: String(v.serviceRadiusKm),
      line1: v.address.line1,
      line2: v.address.line2,
      city: v.address.city,
      state: v.address.state,
      country: v.address.country,
      pinCode: v.address.pinCode,
      latitude: v.latitude === '' ? '' : String(v.latitude),
      longitude: v.longitude === '' ? '' : String(v.longitude),
      panCard: v.panCard,
      gstin: v.gstin,
      accountName: v.bank.accountName,
      bankName: v.bank.bankName,
      branch: v.bank.branch,
      ifsc: v.bank.ifsc,
      accountNumber: '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    if (!editingVendor || !editForm) return;
    const f = editForm;

    const problem = validateEditForm(f);
    if (problem) {
      const [field, message] = problem;
      // Reveal the tab holding the bad value, otherwise the message points at a
      // field the admin cannot see.
      setActiveFormTab(EDIT_FIELD_TAB[field] || 'General');
      setEditError(message);
      return;
    }
    setEditError('');

    const payload = {
      name: f.name.trim(),
      storeName: f.storeName.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      commissionPercent: parseFloat(f.commissionPercent) || 0,
      serviceRadiusKm: parseFloat(f.serviceRadiusKm) || 0,
      address: {
        line1: f.line1.trim(),
        line2: f.line2.trim(),
        city: f.city.trim(),
        state: f.state.trim(),
        country: f.country.trim() || 'India',
        pinCode: f.pinCode.trim(),
      },
      panCard: f.panCard.trim().toUpperCase(),
      gstin: f.gstin.trim().toUpperCase(),
      bank: {
        accountName: f.accountName.trim(),
        bankName: f.bankName.trim(),
        branch: f.branch.trim(),
        ifsc: f.ifsc.trim().toUpperCase(),
      },
    };

    if (f.latitude !== '' && f.longitude !== '') {
      payload.latitude = parseFloat(f.latitude);
      payload.longitude = parseFloat(f.longitude);
    }
    // Only send an account number when one was typed — it is hashed one-way, so an
    // empty field means "leave the stored one alone", not "clear it".
    if (f.accountNumber.trim()) {
      payload.bank.accountNumber = f.accountNumber.trim();
    }
    // Blank address lines would fail the 6-digit pinCode rule, so drop empties.
    Object.keys(payload.address).forEach((k) => {
      if (!payload.address[k]) delete payload.address[k];
    });

    try {
      setSaving(true);
      await updateVendor(editingVendor.mongoId, payload);
      setIsEditModalOpen(false);
      setEditingVendor(null);
      await loadVendors();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to update vendor'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVendor = async (v) => {
    if (!confirm(`Delete "${v.storeName}" (${v.refId})?\n\nThe vendor is removed from listings and their login is disabled.`)) return;
    setActionId(v.mongoId);
    try {
      await deleteVendor(v.mongoId);
      await loadVendors();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to delete vendor'));
    } finally {
      setActionId(null);
    }
  };

  const handleExport = () => {
    const cols = ['Vendor ID', 'Name', 'Store', 'Email', 'Phone', 'Commission %', 'Status', 'City', 'Orders'];
    const rows = visibleVendors.map((v) => [
      v.refId, v.name, v.storeName, v.email, v.phone, v.commissionPercent, v.status, v.city, v.ordersCount,
    ]);
    const escape = (cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
    const csv = [cols, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendors-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const countFor = (value) =>
    value === 'all' ? vendors.length : vendors.filter((v) => v.statusRaw === value).length;

  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.storeName.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.phone.toLowerCase().includes(q) ||
      v.refId.toLowerCase().includes(q);
    const matchesTab = activeTab === 'all' || v.statusRaw === activeTab;
    return matchesSearch && matchesTab;
  });
  const visibleVendors = filteredVendors.slice(0, showCount);

  const field = (form, setForm, key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  const inputCls =
    'w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold';
  const labelCls = 'text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1';

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Vendor Management</h1>
          <p className="text-xs text-gray-400 font-bold mt-1.5">
            Onboard partners, review registrations, and manage commissions.
          </p>
        </div>
        <button
          onClick={() => { setCreateForm(EMPTY_CREATE); setIsAddModalOpen(true); }}
          className="bg-[#0B1528] hover:bg-gray-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-950/10 self-start"
        >
          <Plus size={14} className="stroke-[3]" />
          <span>ADD NEW VENDOR</span>
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {[
          { label: 'Total Vendors', value: countFor('all'), Icon: Store, tone: 'text-gray-700 bg-gray-50 border-gray-100' },
          { label: 'Approved', value: countFor('approved'), Icon: BadgeCheck, tone: 'text-emerald-600 bg-emerald-50/60 border-emerald-100/60' },
          { label: 'Awaiting Approval', value: countFor('pending'), Icon: AlertCircle, tone: 'text-amber-600 bg-amber-50/60 border-amber-100/60' },
          { label: 'Suspended / Rejected', value: countFor('suspended') + countFor('rejected'), Icon: X, tone: 'text-rose-600 bg-rose-50/60 border-rose-100/60' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200/70 p-4 rounded-2xl flex items-center gap-3 hover:shadow-sm transition-all">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${stat.tone}`}>
              <stat.Icon size={20} className="stroke-[2]" />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block truncate">{stat.label}</span>
              <span className="text-2xl font-black text-gray-900 leading-tight mt-0.5 block">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="bg-white rounded-2xl border border-gray-200/75 p-3 flex flex-wrap gap-2 select-none shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === tab.value
                ? 'bg-[#0B1528] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200/60'
            }`}
          >
            {tab.label} ({countFor(tab.value)})
          </button>
        ))}
      </div>

      {/* CONTROLS */}
      <div className="bg-white rounded-2xl border border-gray-200/75 p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none shadow-sm">
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-bold text-gray-400">Show</span>
          <select
            value={showCount}
            onChange={(e) => setShowCount(parseInt(e.target.value, 10))}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-xs font-bold text-gray-400">
            of {filteredVendors.length} entries
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, store, email, phone or vendor ID..."
              className="w-full bg-[#F8F9FB]/60 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-gray-400 font-medium"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={visibleVendors.length === 0}
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-extrabold text-gray-700 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={13} className="stroke-[2.5]" />
            <span>EXPORT</span>
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-xs font-bold text-red-700">{error}</span>
          <button
            onClick={loadVendors}
            className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-[10px] font-black uppercase text-red-700 transition-all hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-[1.25rem] border border-gray-250/60 shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto border border-gray-200/80 rounded-2xl bg-[#FCFDFE]">
          <table className="w-full text-left text-xs font-semibold text-gray-600 border-collapse select-none">
            <thead>
              <tr className="border-b border-gray-250 bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-5">Vendor ID</th>
                <th className="py-4 px-5">Vendor</th>
                <th className="py-4 px-5">Store</th>
                <th className="py-4 px-5">Contact</th>
                <th className="py-4 px-5">Commission</th>
                <th className="py-4 px-5">Location</th>
                <th className="py-4 px-5">Orders</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12">
                    <div className="flex items-center justify-center gap-2 text-xs font-black text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Loading vendors…</span>
                    </div>
                  </td>
                </tr>
              ) : visibleVendors.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-xs font-black text-gray-400">
                    No vendor records found.
                  </td>
                </tr>
              ) : (
                visibleVendors.map((v) => (
                  <tr key={v.mongoId} className="hover:bg-gray-50/50 transition-colors">
                    {/* Human-readable ref, never the database id */}
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-[10px] text-gray-500 bg-gray-50 border border-gray-150 rounded-md px-2 py-1">
                        {v.refId || '—'}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-[9px] font-black text-indigo-600">
                          {initials(v.name)}
                        </div>
                        <div className="leading-tight min-w-0">
                          <span className="font-extrabold text-gray-800 text-xs block truncate max-w-[140px]" title={v.name}>
                            {v.name || '—'}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold block truncate max-w-[140px]" title={v.email}>
                            {v.email || '—'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider border border-indigo-100/50 truncate max-w-[130px]">
                          {v.storeName || '—'}
                        </span>
                        {v.verifiedBadge && <BadgeCheck size={13} className="text-emerald-500 shrink-0" title="Verified" />}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-extrabold text-gray-800 text-xs">{v.phone || '—'}</span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-extrabold text-gray-600 text-xs">{v.commissionLabel}</span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1 text-gray-500">
                        <MapPin size={11} className="shrink-0 text-gray-300" />
                        <span className="font-bold text-[11px] truncate max-w-[110px]" title={v.addressLine}>
                          {v.city || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-extrabold text-gray-700 text-xs">{v.ordersCount}</span>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${STATUS_STYLES[v.status] || STATUS_STYLES.Pending}`}>
                        {v.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right pr-6">
                      <div className="flex items-center gap-1.5 ml-auto justify-end">
                        <button
                          onClick={() => setViewingVendor(v)}
                          title="View full details & KYC"
                          className="w-7 h-7 rounded-xl border border-gray-250/60 text-gray-400 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-center transition-all shrink-0 relative"
                        >
                          <Eye size={12} className="stroke-[2.5]" />
                          {v.kycDocsCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-500 text-white text-[7px] font-black flex items-center justify-center">
                              {v.kycDocsCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(v)}
                          title="Edit vendor"
                          className="w-7 h-7 rounded-xl border border-gray-250/60 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center transition-all shrink-0"
                        >
                          <Edit size={12} className="stroke-[2.5]" />
                        </button>

                        {(v.statusRaw === 'pending' || v.statusRaw === 'under_review') && (
                          <>
                            <button
                              type="button"
                              disabled={actionId === v.mongoId}
                              onClick={() => runVendorAction(v, 'approve')}
                              title="Approve vendor"
                              className="w-7 h-7 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
                            >
                              {actionId === v.mongoId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            </button>
                            <button
                              type="button"
                              disabled={actionId === v.mongoId}
                              onClick={() => runVendorAction(v, 'reject')}
                              title="Reject vendor"
                              className="w-7 h-7 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
                            >
                              <X size={12} />
                            </button>
                          </>
                        )}

                        {v.statusRaw === 'approved' && (
                          <button
                            type="button"
                            disabled={actionId === v.mongoId}
                            onClick={() => runVendorAction(v, 'suspend')}
                            title="Suspend vendor"
                            className="w-7 h-7 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
                          >
                            <AlertCircle size={12} />
                          </button>
                        )}

                        {(v.statusRaw === 'suspended' || v.statusRaw === 'rejected') && (
                          <button
                            type="button"
                            disabled={actionId === v.mongoId}
                            onClick={() => runVendorAction(v, 'reactivate')}
                            title="Reactivate vendor"
                            className="w-7 h-7 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
                          >
                            {actionId === v.mongoId ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteVendor(v)}
                          disabled={actionId === v.mongoId}
                          title="Delete vendor"
                          className="w-7 h-7 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
                        >
                          <Trash2 size={12} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW VENDOR DETAILS — everything the vendor submitted, read-only */}
      {viewingVendor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-slide-up flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#0B1528] truncate">{viewingVendor.storeName}</h3>
                  {viewingVendor.verifiedBadge && <BadgeCheck size={15} className="text-emerald-500 shrink-0" />}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${STATUS_STYLES[viewingVendor.status] || STATUS_STYLES.Pending}`}>
                    {viewingVendor.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5 font-mono">{viewingVendor.refId}</p>
              </div>
              <button type="button" onClick={() => setViewingVendor(null)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-left flex-1 space-y-6">
              <DetailBlock title="Owner & Contact" icon={<Store size={13} />} rows={[
                ['Owner Name', viewingVendor.name],
                ['Email', viewingVendor.email],
                ['Phone', viewingVendor.phone],
                ['Login Status', viewingVendor.userStatus],
                ['Store Slug', viewingVendor.storeSlug || '—'],
                ['Registered', formatDate(viewingVendor.createdAt)],
              ]} />

              <DetailBlock title="Commercials" icon={<Percent size={13} />} rows={[
                ['Commission', viewingVendor.commissionLabel],
                ['Orders', String(viewingVendor.ordersCount)],
                ['Rating', viewingVendor.rating ? viewingVendor.rating.toFixed(1) : '—'],
                ['Categories', String(viewingVendor.categoriesCount)],
              ]} />

              <DetailBlock title="Address & Service Area" icon={<MapPin size={13} />} rows={[
                ['Address', viewingVendor.addressLine],
                ['City', viewingVendor.city],
                ['Delivery Radius', `${viewingVendor.serviceRadiusKm} km`],
                ['Coordinates', viewingVendor.latitude !== '' && viewingVendor.longitude !== ''
                  ? `${viewingVendor.latitude}, ${viewingVendor.longitude}`
                  : '—'],
              ]} />

              <DetailBlock title="Tax" icon={<FileText size={13} />} rows={[
                ['PAN', viewingVendor.panCard || '—'],
                ['GSTIN', viewingVendor.gstin || '—'],
              ]} />

              <DetailBlock title="Bank" icon={<ShieldCheck size={13} />} rows={[
                ['Account Holder', viewingVendor.bank.accountName || '—'],
                ['Bank', viewingVendor.bank.bankName || '—'],
                ['Branch', viewingVendor.bank.branch || '—'],
                ['IFSC', viewingVendor.bank.ifsc || '—'],
                ['Account Number', viewingVendor.hasAccountNumber ? '•••• on file' : 'Not provided'],
              ]} />

              {/* KYC DOCUMENTS */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={13} className="text-gray-400" />
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    KYC Documents ({viewingVendor.kycDocs.length})
                  </h4>
                </div>

                {viewingVendor.kycDocs.length === 0 ? (
                  <p className="text-xs font-semibold text-gray-400 border border-dashed border-gray-200 rounded-xl p-4 text-center">
                    This vendor has not uploaded any documents yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {viewingVendor.kycDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-150 bg-gray-50/50">
                        <FileText size={15} className="text-gray-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-black text-gray-800 block">
                            {KYC_LABELS[doc.type] || doc.type}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {formatBytes(doc.sizeBytes)} · {doc.mime || 'unknown type'} · {formatDate(doc.uploadedAt)}
                          </span>
                        </div>
                        {doc.scanStatus && doc.scanStatus !== 'clean' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase shrink-0">
                            {doc.scanStatus}
                          </span>
                        )}
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-gray-700 hover:bg-gray-50 transition-all"
                          >
                            <ExternalLink size={11} /> View
                          </a>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300 shrink-0">Unavailable</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-150 flex items-center justify-end gap-2.5 bg-white px-6 shrink-0">
              <button type="button" onClick={() => setViewingVendor(null)} className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs px-5 py-2.5 rounded-xl transition-all">
                Close
              </button>
              <button
                type="button"
                onClick={() => { const v = viewingVendor; setViewingVendor(null); openEditModal(v); }}
                className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Edit size={12} /> Edit Vendor
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADD VENDOR MODAL */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#0B1528]">Add New Vendor</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Creates the login and the store profile</p>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-gray-100">
                <X size={18} />
              </button>
            </div>

            <form id="add-vendor-form" onSubmit={handleCreateVendor} className="p-6 space-y-5 overflow-y-auto text-left flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Owner Name *</label>
                  <input type="text" required placeholder="e.g. Ravi Sharma" className={inputCls} {...field(createForm, setCreateForm, 'name')} />
                </div>
                <div>
                  <label className={labelCls}>Store Name *</label>
                  <input type="text" required placeholder="e.g. Sharma Stationers" className={inputCls} {...field(createForm, setCreateForm, 'storeName')} />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input type="email" required placeholder="vendor@example.com" className={inputCls} {...field(createForm, setCreateForm, 'email')} />
                </div>
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input
                    type="tel"
                    required
                    pattern="[6-9]\d{9}"
                    title="10-digit Indian mobile number starting with 6-9"
                    placeholder="10-digit mobile"
                    className={inputCls}
                    {...field(createForm, setCreateForm, 'phone')}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Temporary Password *</label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    pattern="(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                    title="At least 8 characters, including a number and a symbol"
                    placeholder="At least 8 characters, with a number and a symbol"
                    className={inputCls}
                    {...field(createForm, setCreateForm, 'password')}
                  />
                  <span className="text-[10px] text-gray-400 font-semibold mt-1 block">
                    Share this with the vendor so they can sign in and change it.
                  </span>
                </div>
                <div>
                  <label className={labelCls}>Commission %</label>
                  <input type="number" step="0.01" min="0" max="100" className={inputCls} {...field(createForm, setCreateForm, 'commissionPercent')} />
                </div>
                <div>
                  <label className={labelCls}>Service Radius (km)</label>
                  <input type="number" step="0.1" min="0" className={inputCls} {...field(createForm, setCreateForm, 'serviceRadiusKm')} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
                  Address <span className="text-red-500">*</span>
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Street / Line 1 *</label>
                    <input type="text" required placeholder="e.g. 12 M.G. Road" className={inputCls} {...field(createForm, setCreateForm, 'line1')} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Line 2</label>
                    <input type="text" placeholder="Optional" className={inputCls} {...field(createForm, setCreateForm, 'line2')} />
                  </div>
                  <div>
                    <label className={labelCls}>City *</label>
                    <input type="text" required className={inputCls} {...field(createForm, setCreateForm, 'city')} />
                  </div>
                  <div>
                    <label className={labelCls}>State *</label>
                    <input type="text" required className={inputCls} {...field(createForm, setCreateForm, 'state')} />
                  </div>
                  <div>
                    <label className={labelCls}>Country *</label>
                    <input type="text" required className={inputCls} {...field(createForm, setCreateForm, 'country')} />
                  </div>
                  <div>
                    <label className={labelCls}>PIN Code *</label>
                    <input
                      type="text"
                      required
                      pattern="\d{6}"
                      title="Six digits"
                      placeholder="6 digits"
                      className={inputCls}
                      {...field(createForm, setCreateForm, 'pinCode')}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Map Location</span>
                <p className="text-[10px] text-gray-400 font-semibold mb-3">
                  Used for delivery radius. Leave blank to set later — defaults are applied on save.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Latitude</label>
                    <input type="number" step="any" placeholder="e.g. 22.7196" className={inputCls} {...field(createForm, setCreateForm, 'latitude')} />
                  </div>
                  <div>
                    <label className={labelCls}>Longitude</label>
                    <input type="number" step="any" placeholder="e.g. 75.8577" className={inputCls} {...field(createForm, setCreateForm, 'longitude')} />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 select-none cursor-pointer border-t border-gray-100 pt-4">
                <input
                  type="checkbox"
                  checked={createForm.autoApprove}
                  onChange={(e) => setCreateForm({ ...createForm, autoApprove: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span className="text-xs font-black text-gray-700">Approve immediately</span>
                <span className="text-[10px] text-gray-400 font-semibold">— vendor can sign in and sell right away</span>
              </label>
            </form>

            <div className="p-5 border-t border-gray-150 flex items-center justify-end gap-2.5 bg-white px-6 shrink-0">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs px-5 py-2.5 rounded-xl transition-all">
                Cancel
              </button>
              {/* submit (not onClick) so the browser enforces the required fields */}
              <button
                type="submit"
                form="add-vendor-form"
                disabled={saving}
                className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                <span>{saving ? 'Creating…' : 'Create Vendor'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT VENDOR MODAL */}
      {isEditModalOpen && editForm && editingVendor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-slide-up flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#0B1528]">Edit Vendor</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5 font-mono">{editingVendor.refId}</p>
              </div>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pt-4 flex gap-2 border-b border-gray-100 shrink-0">
              {['General', 'Address', 'Tax & Bank'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFormTab(tab)}
                  className={`px-4 py-2 rounded-t-xl text-xs font-black transition-all border-b-2 ${
                    activeFormTab === tab
                      ? 'text-[#0B1528] border-[#0B1528]'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form id="edit-vendor-form" onSubmit={handleUpdateVendor} className="p-6 space-y-4 overflow-y-auto text-left flex-1">
              {editError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-red-700">{editError}</span>
                </div>
              )}

              {activeFormTab === 'General' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Owner Name <span className="text-red-500">*</span></label>
                    <input type="text" className={inputCls} {...field(editForm, setEditForm, 'name')} />
                  </div>
                  <div>
                    <label className={labelCls}>Store Name <span className="text-red-500">*</span></label>
                    <input type="text" className={inputCls} {...field(editForm, setEditForm, 'storeName')} />
                  </div>
                  <div>
                    <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                    <input type="email" className={inputCls} {...field(editForm, setEditForm, 'email')} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                    <input type="tel" className={inputCls} {...field(editForm, setEditForm, 'phone')} />
                  </div>
                  <div>
                    <label className={labelCls}>Commission %</label>
                    <div className="relative">
                      <input type="number" step="0.01" min="0" max="100" className={inputCls} {...field(editForm, setEditForm, 'commissionPercent')} />
                      <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Service Radius (km)</label>
                    <input type="number" step="0.1" min="0" className={inputCls} {...field(editForm, setEditForm, 'serviceRadiusKm')} />
                  </div>
                  <div className="col-span-2 bg-gray-50 border border-gray-150 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Current Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${STATUS_STYLES[editingVendor.status] || STATUS_STYLES.Pending}`}>
                      {editingVendor.status}
                    </span>
                  </div>
                  <p className="col-span-2 text-[10px] text-gray-400 font-semibold">
                    Status is changed with the approve / suspend / reactivate actions in the table, not from this form.
                  </p>
                </div>
              )}

              {activeFormTab === 'Address' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Street / Line 1</label>
                    <input type="text" className={inputCls} {...field(editForm, setEditForm, 'line1')} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Line 2</label>
                    <input type="text" className={inputCls} {...field(editForm, setEditForm, 'line2')} />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input type="text" className={inputCls} {...field(editForm, setEditForm, 'city')} />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <input type="text" className={inputCls} {...field(editForm, setEditForm, 'state')} />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input type="text" className={inputCls} {...field(editForm, setEditForm, 'country')} />
                  </div>
                  <div>
                    <label className={labelCls}>PIN Code</label>
                    <input type="text" placeholder="6 digits" className={inputCls} {...field(editForm, setEditForm, 'pinCode')} />
                  </div>
                  <div>
                    <label className={labelCls}>Latitude</label>
                    <input type="number" step="any" className={inputCls} {...field(editForm, setEditForm, 'latitude')} />
                  </div>
                  <div>
                    <label className={labelCls}>Longitude</label>
                    <input type="number" step="any" className={inputCls} {...field(editForm, setEditForm, 'longitude')} />
                  </div>
                </div>
              )}

              {activeFormTab === 'Tax & Bank' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>PAN</label>
                      <input type="text" placeholder="ABCDE1234F" className={`${inputCls} uppercase`} {...field(editForm, setEditForm, 'panCard')} />
                    </div>
                    <div>
                      <label className={labelCls}>GSTIN</label>
                      <input type="text" placeholder="22ABCDE1234F1Z5" className={`${inputCls} uppercase`} {...field(editForm, setEditForm, 'gstin')} />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Account Holder</label>
                      <input type="text" className={inputCls} {...field(editForm, setEditForm, 'accountName')} />
                    </div>
                    <div>
                      <label className={labelCls}>Bank Name</label>
                      <input type="text" className={inputCls} {...field(editForm, setEditForm, 'bankName')} />
                    </div>
                    <div>
                      <label className={labelCls}>Branch</label>
                      <input type="text" className={inputCls} {...field(editForm, setEditForm, 'branch')} />
                    </div>
                    <div>
                      <label className={labelCls}>IFSC</label>
                      <input type="text" placeholder="HDFC0001234" className={`${inputCls} uppercase`} {...field(editForm, setEditForm, 'ifsc')} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Account Number</label>
                      <input
                        type="text"
                        placeholder={editingVendor.hasAccountNumber ? 'On file — type a new number to replace it' : 'Not set'}
                        className={inputCls}
                        {...field(editForm, setEditForm, 'accountNumber')}
                      />
                      <span className="text-[10px] text-gray-400 font-semibold mt-1 block">
                        Stored as a one-way hash, so it can never be shown again. Leave blank to keep the existing one.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </form>

            <div className="p-5 border-t border-gray-150 flex items-center justify-end gap-2.5 bg-white px-6 shrink-0">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs px-5 py-2.5 rounded-xl transition-all">
                Cancel
              </button>
              <button
                type="submit"
                form="edit-vendor-form"
                disabled={saving}
                className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                <span>{saving ? 'Saving…' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default VendorListManagement;
