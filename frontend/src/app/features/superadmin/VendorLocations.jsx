import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, MapPin, Phone, Mail, ChevronRight, MapPinOff,
  Info, Loader2, Store, Crosshair, AlertCircle,
} from 'lucide-react';
import { listVendors } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapAdminVendorForList } from '../../../utils/mappers/adminVendorMapper';
import { vendorHasLocation } from '../../../utils/vendorLocation';
import VendorLocationMap from '../../components/VendorLocationMap';

const STATUS_OPTIONS = ['All', 'Approved', 'Pending', 'Under Review', 'Suspended', 'Rejected'];

const STATUS_STYLES = {
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Suspended: 'bg-rose-50 text-rose-700 border-rose-100',
  Rejected: 'bg-gray-100 text-gray-600 border-gray-200',
  'Under Review': 'bg-blue-50 text-blue-700 border-blue-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
};

const statusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.Pending;

// The list, the map and the counters all need the same reduced shape, and the
// map keys markers by `id`.
const toLocationVendor = (vendor) => ({
  id: vendor.mongoId,
  storeName: vendor.storeName || vendor.name || 'Vendor',
  ownerName: vendor.name || '',
  addressLine: vendor.addressLine || '',
  city: vendor.city || '',
  phone: vendor.phone || '',
  email: vendor.email || '',
  status: vendor.status,
  latitude: Number(vendor.latitude),
  longitude: Number(vendor.longitude),
  serviceRadiusKm: vendor.serviceRadiusKm || 0,
  hasLocation: vendorHasLocation(vendor),
});

const StatCard = ({ icon, tone, label, value }) => (
  <div className="bg-white rounded-2xl border border-gray-200/70 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${tone}`}>{icon}</div>
    <div>
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{label}</span>
      <span className="text-2xl font-black text-gray-900">{value}</span>
    </div>
  </div>
);

const VendorRow = ({ vendor, isSelected, onSelect }) => (
  <div
    onClick={() => vendor.hasLocation && onSelect(vendor.id)}
    className={`p-4 text-left transition-all ${
      vendor.hasLocation ? 'cursor-pointer' : 'cursor-default opacity-70'
    } ${
      isSelected
        ? 'bg-indigo-50/30 border-l-[3.5px] border-indigo-600'
        : 'hover:bg-gray-50 border-l-[3.5px] border-transparent'
    }`}
  >
    <div className="flex items-center justify-between select-none gap-2">
      <span className="font-extrabold text-gray-950 text-xs truncate">{vendor.storeName}</span>
      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-wider shrink-0 ${statusStyle(vendor.status)}`}>
        {vendor.status}
      </span>
    </div>

    {vendor.ownerName && (
      <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wide">{vendor.ownerName}</p>
    )}

    <div className="mt-2.5 space-y-1.5 select-none">
      <div className="flex items-start gap-1.5">
        <MapPin size={11} className="text-gray-400 shrink-0 mt-0.5" />
        <span className="text-[10px] text-gray-500 font-medium leading-normal">
          {vendor.addressLine || vendor.city || '—'}
        </span>
      </div>

      <div className="pl-4 flex flex-col gap-0.5">
        {vendor.hasLocation ? (
          <>
            <span className="text-[9px] text-[#0B1528] font-black block">
              {vendor.latitude.toFixed(5)}, {vendor.longitude.toFixed(5)}
            </span>
            <span className="text-[9px] text-indigo-500 font-bold block">
              Radius: {vendor.serviceRadiusKm} km
            </span>
          </>
        ) : (
          <span className="text-[9px] text-amber-600 font-black flex items-center gap-1">
            <MapPinOff size={10} />
            Location not set
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[9px] text-gray-400 font-bold border-t border-gray-100 mt-2">
        <div className="flex items-center gap-1">
          <Phone size={10} />
          <span>{vendor.phone || '—'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Mail size={10} />
          <span className="truncate max-w-[120px]">{vendor.email || '—'}</span>
        </div>
      </div>
    </div>
  </div>
);

const VendorLocations = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listVendors({ limit: 100 });
      setVendors((data || []).map(mapAdminVendorForList).map(toLocationVendor));
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

  const filteredVendors = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return vendors.filter((v) => {
      if (statusFilter !== 'All' && v.status !== statusFilter) return false;
      if (!term) return true;
      return [v.storeName, v.ownerName, v.addressLine, v.city, v.phone, v.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [vendors, statusFilter, searchQuery]);

  const mappable = useMemo(() => filteredVendors.filter((v) => v.hasLocation), [filteredVendors]);
  const unmapped = useMemo(() => filteredVendors.filter((v) => !v.hasLocation), [filteredVendors]);
  const totalMissing = useMemo(() => vendors.filter((v) => !v.hasLocation).length, [vendors]);

  // Derived during render rather than synced in an effect. A vendor filtered out
  // of view must not keep the map focused somewhere the list no longer shows, and
  // falling back here avoids the extra render an effect-plus-setState would cost.
  const selectedVendor =
    mappable.find((v) => v.id === selectedVendorId) || mappable[0] || null;

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Vendor Locations</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              LIVE MAP
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">
            Vendors that have set a location, plotted with their service radius.
          </p>
        </div>

        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span>Home</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">Vendor Locations</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
        <StatCard
          icon={<Store size={22} />}
          tone="bg-blue-50 border-blue-100 text-blue-600"
          label="Total Vendors"
          value={vendors.length}
        />
        <StatCard
          icon={<Crosshair size={22} />}
          tone="bg-emerald-50 border-emerald-100 text-emerald-600"
          label="On Map"
          value={vendors.length - totalMissing}
        />
        <StatCard
          icon={<MapPinOff size={22} />}
          tone="bg-amber-50 border-amber-100 text-amber-600"
          label="Location Not Set"
          value={totalMissing}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/75 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 select-none shadow-sm text-left">
        <div className="md:col-span-2 space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Search Vendors</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by store, owner, city, phone…"
              className="w-full bg-[#F8F9FB]/60 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Filter by Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none bg-[#F8F9FB]/60 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All Status' : option}
                </option>
              ))}
            </select>
            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white rounded-3xl border border-gray-250/60 shadow-sm overflow-hidden p-6 flex-1 flex flex-col min-h-[520px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 select-none">
              <div className="text-left">
                <h3 className="text-sm font-black text-[#0B1528]">Vendor Locations Map</h3>
                <p className="text-[9px] font-bold text-gray-400">
                  {mappable.length} of {filteredVendors.length} shown · click a pin to focus
                </p>
              </div>
              <MapPin size={16} className="text-indigo-500" />
            </div>

            <div className="border border-gray-200/80 rounded-2xl overflow-hidden relative flex-1 min-h-[380px] bg-[#E8EEF4]">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <Loader2 size={24} className="animate-spin mr-2" />
                  <span className="text-sm font-bold">Loading vendors…</span>
                </div>
              ) : mappable.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <MapPinOff size={28} className="text-gray-400 mb-3" />
                  <p className="text-sm font-black text-gray-500">No vendor locations to show</p>
                  <p className="text-[11px] font-bold text-gray-400 mt-1 max-w-xs">
                    {vendors.length === 0
                      ? 'No vendors matched.'
                      : 'None of the matching vendors have set their coordinates yet.'}
                  </p>
                </div>
              ) : (
                <VendorLocationMap
                  vendors={mappable}
                  selectedId={selectedVendor?.id ?? null}
                  onSelect={setSelectedVendorId}
                  className="absolute inset-0 z-0"
                />
              )}
            </div>

            <div className="border border-gray-200/80 rounded-2xl p-4 bg-gray-50/50 mt-4 text-left shadow-inner">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-gray-400 mt-0.5 shrink-0" />
                {selectedVendor ? (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Selected Vendor</span>
                    <h4 className="text-xs font-black text-[#0B1528]">
                      {selectedVendor.storeName}
                      {selectedVendor.ownerName ? ` — ${selectedVendor.ownerName}` : ''}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-500 leading-normal">
                      {selectedVendor.addressLine || selectedVendor.city || '—'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded">
                        {selectedVendor.latitude.toFixed(5)}, {selectedVendor.longitude.toFixed(5)}
                      </span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded">
                        Service Radius: {selectedVendor.serviceRadiusKm} km
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-gray-400">
                    Select a vendor with a location to see its details.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* On lg the card is absolutely positioned to fill the grid cell (whose
            height the map column drives) instead of growing with the vendor
            count — otherwise a long list stretches the whole page rather than
            scrolling inside its own box. On mobile it keeps a fixed height. */}
        <div className="lg:col-span-4 relative">
          <div className="bg-white rounded-3xl border border-gray-250/60 shadow-sm overflow-hidden flex flex-col h-[620px] lg:h-auto lg:absolute lg:inset-0">
            <div className="p-5 border-b border-gray-150 bg-gray-50/50 select-none shrink-0 text-left">
              <h3 className="text-sm font-black text-[#0B1528]">Vendors ({filteredVendors.length})</h3>
              <p className="text-[9px] font-bold text-gray-400 mt-0.5">Click a mapped vendor to focus it</p>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-[#FCFDFE]">
              {loading ? (
                <div className="py-12 flex items-center justify-center text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  <span className="text-xs font-bold">Loading…</span>
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="py-12 text-center text-xs font-black text-gray-400">No vendors matched.</div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {mappable.map((vendor) => (
                      <VendorRow
                        key={vendor.id}
                        vendor={vendor}
                        isSelected={vendor.id === selectedVendor?.id}
                        onSelect={setSelectedVendorId}
                      />
                    ))}
                  </div>

                  {/* Surfaced rather than hidden: these vendors are invisible on
                      the map, and the admin needs to know who to chase. */}
                  {unmapped.length > 0 && (
                    <div>
                      <div className="px-5 py-2.5 bg-amber-50/60 border-y border-amber-100 flex items-center gap-1.5 sticky top-0">
                        <MapPinOff size={11} className="text-amber-600" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                          Location not set ({unmapped.length})
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {unmapped.map((vendor) => (
                          <VendorRow
                            key={vendor.id}
                            vendor={vendor}
                            isSelected={false}
                            onSelect={setSelectedVendorId}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorLocations;
