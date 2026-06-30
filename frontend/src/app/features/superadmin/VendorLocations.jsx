import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, MapPin, Phone, Mail, ChevronRight, Map, 
  Layers, Compass, Info, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { listVendors } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const mapVendorLocation = (vendor) => ({
  id: vendor._id || vendor.id,
  storeName: vendor.storeName || vendor.businessName || vendor.name || 'Vendor',
  ownerName: vendor.ownerName || vendor.contactName || '—',
  address: vendor.address?.line1 || vendor.address || vendor.businessAddress || '—',
  city: vendor.address?.city || vendor.city || '—',
  latitude: vendor.address?.latitude || vendor.latitude || '',
  longitude: vendor.address?.longitude || vendor.longitude || '',
  phone: vendor.phone || vendor.mobile || '—',
  email: vendor.email || '—',
  status: vendor.status || vendor.approvalStatus || 'Pending',
  serviceRadius: vendor.serviceRadius || '—',
  mapOffset: { x: 0, y: 0 },
});

const FALLBACK_VENDOR = {
  id: null,
  storeName: 'No vendor selected',
  ownerName: '—',
  address: '—',
  city: '—',
  latitude: '—',
  longitude: '—',
  phone: '—',
  email: '—',
  status: 'Pending',
  serviceRadius: 0,
  mapOffset: { x: 0, y: 0 },
};

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
      const mapped = (data || []).map(mapVendorLocation);
      setVendors(mapped);
      setSelectedVendorId((prev) => prev || mapped[0]?.id || null);
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

  const selectedVendor =
    vendors.find((v) => v.id === selectedVendorId) ||
    vendors[0] ||
    FALLBACK_VENDOR;

  // Filters mapping
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'All') {
      matchesStatus = v.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Vendor Locations</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none animate-pulse">
              MAP INTERFACE
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">View serviceable areas and coordinate nodes on map.</p>
        </div>

        {/* Breadcrumb right align */}
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Home</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">Vendor Locations</span>
        </div>
      </div>

      {/* FILTER / SEARCH INPUT ROW */}
      <div className="bg-white rounded-2xl border border-gray-200/75 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 select-none shadow-sm text-left">
        
        {/* Search vendors */}
        <div className="md:col-span-2 space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Search Vendors</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, store, city, or address..." 
              className="w-full bg-[#F8F9FB]/60 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
          </div>
        </div>

        {/* Filter status */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Filter by Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none bg-[#F8F9FB]/60 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
            </select>
            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
          </div>
        </div>

      </div>

      {/* MAIN LAYOUT SPLIT PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
        
        {/* Left Column: Interactive map and detail overlay */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          
          {/* Map panel */}
          <div className="bg-white rounded-3xl border border-gray-250/60 shadow-sm overflow-hidden p-6 flex-1 flex flex-col min-h-[480px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 select-none">
              <div className="text-left">
                <h3 className="text-sm font-black text-[#0B1528]">Vendor Locations Map</h3>
                <p className="text-[9px] font-bold text-gray-400">Selected service radius visualization</p>
              </div>
              <Compass size={16} className="text-indigo-500 animate-spin-slow" />
            </div>

            {/* Cartography grid mockup map container */}
            <div className="border border-gray-200/80 rounded-2xl shadow-inner relative flex-1 bg-[#E8EEF4] overflow-hidden min-h-[320px]">
              
              {/* Grid Backdrop Layer */}
              <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>

              {/* Styled Mock map graphics with dynamic re-center values */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Cartography roads and structures */}
                <line x1="-100" y1="200" x2="1000" y2="200" stroke="#FFF" strokeWidth="6" />
                <line x1="-100" y1="200" x2="1000" y2="200" stroke="#E6A15C" strokeWidth="1.5" />

                <line x1="300" y1="-100" x2="300" y2="600" stroke="#FFF" strokeWidth="6" />
                <line x1="300" y1="-100" x2="300" y2="600" stroke="#E6A15C" strokeWidth="1.5" />

                <line x1="100" y1="50" x2="800" y2="350" stroke="#FFF" strokeWidth="4" />
                <line x1="0" y1="350" x2="900" y2="50" stroke="#FFF" strokeWidth="4" />
                
                {/* Secondary roads */}
                <line x1="-100" y1="120" x2="1000" y2="120" stroke="#FFF" strokeWidth="2.5" />
                <line x1="-100" y1="280" x2="1000" y2="280" stroke="#FFF" strokeWidth="2.5" />

                {/* River water body */}
                <path d="M-50,420 Q180,320 400,480 T900,380" fill="none" stroke="#AED2E6" strokeWidth="32" strokeLinecap="round" />

                {/* Dynamic radial concentric service area matching selected vendor's coordinates */}
                <g transform={`translate(${selectedVendor.mapOffset.x}, ${selectedVendor.mapOffset.y})`}>
                  {/* Outer glowing pulsing circle */}
                  <circle cx="50%" cy="50%" r={selectedVendor.serviceRadius * 15} fill="#4F46E5" fillOpacity="0.10" stroke="#4F46E5" strokeWidth="2.5" strokeDasharray="4,4" className="animate-pulse" />
                  <circle cx="50%" cy="50%" r={selectedVendor.serviceRadius * 15} fill="#06B6D4" fillOpacity="0.08" stroke="#06B6D4" strokeWidth="1.5" />
                  
                  {/* Centered coordinate anchor point */}
                  <circle cx="50%" cy="50%" r="5" fill="#4F46E5" />
                  <circle cx="50%" cy="50%" r="9" fill="none" stroke="#4F46E5" strokeWidth="1.5" />
                </g>
              </svg>

              {/* Mock Zoom Controls */}
              <div className="absolute top-4 left-4 flex flex-col bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden font-black text-sm select-none">
                <button type="button" onClick={() => alert('Zooming in...')} className="w-8 h-8 flex items-center justify-center border-b border-gray-100 hover:bg-gray-50 text-gray-700">+</button>
                <button type="button" onClick={() => alert('Zooming out...')} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-700">-</button>
              </div>

              {/* Styled Marker Tooltip at center of calibration offset */}
              <div 
                style={{ 
                  transform: `translate(calc(-50% + ${selectedVendor.mapOffset.x}px), calc(-50% + ${selectedVendor.mapOffset.y}px - 32px))` 
                }}
                className="absolute top-1/2 left-1/2 bg-gray-900 text-white text-[9.5px] font-black px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-gray-800 transition-all duration-300 pointer-events-none"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 block animate-ping"></span>
                <span>{selectedVendor.storeName}</span>
              </div>

              {/* Attribution Overlay */}
              <div className="absolute bottom-1 right-2 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[8px] font-bold text-gray-500 border border-gray-100">
                🌍 Leaflet | © OpenStreetMap contributors
              </div>

            </div>

            {/* Selected vendor card under the map */}
            <div className="border border-gray-200/80 rounded-2xl p-4 bg-gray-50/50 mt-4 text-left shadow-inner">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Selected Vendor</span>
                  <h4 className="text-xs font-black text-[#0B1528]">{selectedVendor.storeName} - {selectedVendor.ownerName}</h4>
                  <p className="text-[10px] font-bold text-gray-500 leading-normal">{selectedVendor.address}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded">
                      Coordinates: {selectedVendor.latitude}, {selectedVendor.longitude}
                    </span>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded ml-1">
                      Service Radius: {selectedVendor.serviceRadius} km
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Scrollable list of active vendor hubs */}
        <div className="lg:col-span-4 flex flex-col h-[580px] lg:h-auto">
          
          <div className="bg-white rounded-3xl border border-gray-250/60 shadow-sm overflow-hidden flex flex-col h-full">
            
            {/* Header tab */}
            <div className="p-5 border-b border-gray-150 bg-gray-50/50 select-none shrink-0 text-left">
              <h3 className="text-sm font-black text-[#0B1528]">Vendors ({filteredVendors.length})</h3>
              <p className="text-[9px] font-bold text-gray-400 mt-0.5">Click hub node to focus view</p>
            </div>

            {/* List entries */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0 bg-[#FCFDFE]">
              {filteredVendors.length === 0 ? (
                <div className="py-12 text-center text-xs font-black text-gray-400">
                  No vendor hubs matched.
                </div>
              ) : (
                filteredVendors.map(v => {
                  const isSelected = v.id === selectedVendorId;
                  return (
                    <div 
                      key={v.id}
                      onClick={() => setSelectedVendorId(v.id)}
                      className={`p-4 text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-50/30 border-l-[3.5px] border-indigo-600' 
                          : 'hover:bg-gray-50 border-l-[3.5px] border-transparent'
                      }`}
                    >
                      {/* Name and status badge */}
                      <div className="flex items-center justify-between select-none">
                        <span className="font-extrabold text-gray-950 text-xs truncate max-w-[150px]">{v.storeName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-wider select-none shrink-0 ${
                          v.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {v.status}
                        </span>
                      </div>

                      {/* Owner details */}
                      <p className="text-[9px] text-gray-400 font-bold block mt-1 uppercase tracking-wide select-none">{v.ownerName}</p>

                      {/* Address coordinates details */}
                      <div className="mt-2.5 space-y-1.5 select-none">
                        <div className="flex items-start gap-1.5">
                          <MapPin size={11} className="text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-[10px] text-gray-500 font-medium leading-normal">{v.address}</span>
                        </div>
                        
                        <div className="pl-4 flex flex-col gap-0.5">
                          <span className="text-[9px] text-[#0B1528] font-black block">Coords: {v.latitude}, {v.longitude}</span>
                          <span className="text-[9px] text-indigo-500 font-bold block">Radius: {v.serviceRadius} km</span>
                        </div>

                        {/* Stacking phone & email */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[9px] text-gray-400 font-bold select-none border-t border-gray-100 mt-2">
                          <div className="flex items-center gap-1">
                            <Phone size={10} className="text-gray-400" />
                            <span>{v.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail size={10} className="text-gray-400" />
                            <span className="truncate max-w-[120px]">{v.email}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

      {/* FOOTER COPYRIGHT BAR */}
      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">Healthy Delight</span>
        </p>
      </div>

    </div>
  );
};

export default VendorLocations;
