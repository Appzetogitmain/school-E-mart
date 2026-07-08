import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Edit, Trash2, X, Download, Plus, Filter, 
  User, Check, AlertCircle, RefreshCw, ChevronDown, Eye, MapPin, 
  CreditCard, ShieldAlert, Landmark, Settings, Loader2
} from 'lucide-react';
import {
  listVendors,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapAdminVendorForList } from '../../../utils/mappers/adminVendorMapper';

const VendorListManagement = () => {
  // Navigation, filtering & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Approved' | 'Pending' | 'Suspended'
  const [showCount, setShowCount] = useState(10);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);
  
  // Modal input fields
  const [editName, setEditName] = useState('');
  const [editStoreName, setEditStoreName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCommission, setEditCommission] = useState('10');
  const [editStatus, setEditStatus] = useState('Pending');
  const [editNeedApproval, setEditNeedApproval] = useState('Yes');
  
  // Address parameters
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editServiceableArea, setEditServiceableArea] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [editServiceRadius, setEditServiceRadius] = useState('7');
  
  // Tax & Bank fields
  const [editPanCard, setEditPanCard] = useState('');
  const [editTaxName, setEditTaxName] = useState('');
  const [editTaxNumber, setEditTaxNumber] = useState('');
  const [editAccountName, setEditAccountName] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editIfscCode, setEditIfscCode] = useState('');
  
  // Readonly fields
  const [editBalance, setEditBalance] = useState('0.00');
  const [editCategoriesCount, setEditCategoriesCount] = useState(0);

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (activeTab === 'Pending') params.approvalStatus = 'pending';
      if (activeTab === 'Approved') params.approvalStatus = 'approved';
      if (activeTab === 'Suspended') params.approvalStatus = 'suspended';
      const { data } = await listVendors(params);
      setVendors((data || []).map(mapAdminVendorForList));
    } catch (err) {
      setVendors([]);
      setError(getErrorMessage(err, 'Unable to load vendors'));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const runVendorAction = async (vendor, action) => {
    if (!vendor?.mongoId) return;
    setActionId(vendor.mongoId);
    try {
      if (action === 'approve') await approveVendor(vendor.mongoId, {});
      if (action === 'reject') await rejectVendor(vendor.mongoId, { reason: 'Rejected by admin' });
      if (action === 'suspend') await suspendVendor(vendor.mongoId, { reason: 'Suspended by admin' });
      if (action === 'reactivate') await reactivateVendor(vendor.mongoId, {});
      await loadVendors();
      if (editingVendor?.mongoId === vendor.mongoId) {
        setIsEditModalOpen(false);
        setEditingVendor(null);
        setEditingVendorId(null);
      }
    } catch (err) {
      alert(getErrorMessage(err, `Unable to ${action} vendor`));
    } finally {
      setActionId(null);
    }
  };


  // Open Edit Modal & populate details
  const openEditModal = (v) => {
    setEditingVendor(v);
    setEditingVendorId(v.id);
    setEditName(v.name);
    setEditStoreName(v.storeName);
    setEditPhone(v.phone);
    setEditEmail(v.email);
    setEditCategory(v.category || '');
    setEditCommission(v.commission.replace('%', '').replace('.00', ''));
    setEditStatus(v.status);
    setEditNeedApproval(v.needApproval);
    
    // Address fields
    setEditAddress(v.address || '');
    setEditCity(v.city || '');
    setEditServiceableArea(v.serviceableArea || '');
    setEditLatitude(v.latitude || '');
    setEditLongitude(v.longitude || '');
    setEditServiceRadius(v.serviceRadius || '7');

    // Tax & Bank fields
    setEditPanCard(v.panCard || '');
    setEditTaxName(v.taxName || '');
    setEditTaxNumber(v.taxNumber || '');
    setEditAccountName(v.accountName || '');
    setEditBankName(v.bankName || '');
    setEditBranch(v.branch || '');
    setEditAccountNumber(v.accountNumber || '');
    setEditIfscCode(v.ifscCode || '');

    // Settings
    setEditBalance(v.balance || '0.00');
    setEditCategoriesCount(v.categoriesCount || 0);

    setIsEditModalOpen(true);
  };

  // Safe delete handler
  const handleDeleteVendor = (id) => {
    if (confirm('Are you sure you want to delete this vendor and all associated store settings?')) {
      setVendors(prev => prev.filter(v => v.id !== id));
    }
  };

  // Submit edit form
  const handleUpdateVendor = (e) => {
    if (e) e.preventDefault();
    if (!editName.trim() || !editStoreName.trim()) return;

    setVendors(prev => prev.map(v => {
      if (v.id === editingVendorId) {
        return {
          ...v,
          name: editName,
          storeName: editStoreName,
          phone: editPhone,
          email: editEmail,
          category: editCategory,
          balance: parseFloat(editBalance).toFixed(2),
          commission: `${parseFloat(editCommission).toFixed(2)}%`,
          status: editStatus,
          needApproval: editNeedApproval,
          address: editAddress,
          city: editCity,
          serviceableArea: editServiceableArea,
          latitude: editLatitude,
          longitude: editLongitude,
          serviceRadius: editServiceRadius,
          panCard: editPanCard,
          taxName: editTaxName,
          taxNumber: editTaxNumber,
          accountName: editAccountName,
          bankName: editBankName,
          branch: editBranch,
          accountNumber: editAccountNumber,
          ifscCode: editIfscCode
        };
      }
      return v;
    }));

    setIsEditModalOpen(false);
  };

  // Filter vendors by search query and active tab
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.id.includes(searchQuery) ||
                          v.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab !== 'All') {
      matchesTab = v.status === activeTab;
    }

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Vendor Management</h1>
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none animate-pulse">
              LIVE HUBS
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Review store balances, commissions, and partner registration profiles.</p>
        </div>

        {/* Top Quick Actions */}
        <button 
          onClick={() => {
            const randomId = Math.floor(1000000 + Math.random() * 9000000).toString();
            const newVendor = {
              id: randomId,
              name: 'New Partner',
              storeName: 'Elite Market',
              phone: '9999999999',
              email: 'new@partner.com',
              category: 'General',
              balance: '0.00',
              commission: '10.00%',
              categoriesCount: 0,
              status: 'Pending',
              needApproval: 'Yes',
              address: 'M.G Road, Indore, MP, 452001, India',
              city: 'Indore',
              serviceableArea: 'Indore Central',
              latitude: '22.717591',
              longitude: '75.871987',
              serviceRadius: '5',
              panCard: 'ABCDE1234F',
              taxName: 'New Partner Tax',
              taxNumber: '11ABCDE1234F1Z1',
              accountName: 'Partner Owner',
              bankName: 'HDFC Bank',
              branch: 'Indore Main',
              accountNumber: '998877665544',
              ifscCode: 'HDFC0009999'
            };
            setVendors(prev => [newVendor, ...prev]);
          }}
          className="bg-[#0B1528] hover:bg-gray-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-950/10 self-start"
        >
          <Plus size={14} className="stroke-[3]" />
          <span>ADD NEW VENDOR</span>
        </button>
      </div>

      {/* FILTER TABS ROW */}
      <div className="bg-white rounded-2xl border border-gray-200/75 p-3 flex flex-wrap gap-2 select-none shadow-sm">
        {['All', 'Pending', 'Approved', 'Suspended'].map(tab => {
          const isActive = activeTab === tab;
          let count = vendors.length;
          if (tab !== 'All') count = vendors.filter(v => v.status === tab).length;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                isActive 
                  ? 'bg-[#0B1528] text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200/60'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* ACTIONS & DYNAMIC GRID FILTERS */}
      <div className="bg-white rounded-2xl border border-gray-200/75 p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none shadow-sm">
        
        {/* Count Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-bold text-gray-400">Show</span>
          <select 
            value={showCount} 
            onChange={(e) => setShowCount(parseInt(e.target.value))}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <span className="text-xs font-bold text-gray-400">entries</span>
        </div>

        {/* Search and Export Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store name, ID..." 
              className="w-full bg-[#F8F9FB]/60 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-gray-400 font-medium"
            />
          </div>

          {/* Export Dropdown Button */}
          <button 
            onClick={() => alert('Exporting active vendor records as CSV...')}
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-extrabold text-gray-700 flex items-center gap-1.5 transition-all"
          >
            <Download size={13} className="stroke-[2.5]" />
            <span>EXPORT</span>
          </button>
        </div>

      </div>

      {/* DATA GRID TABLE */}
      <div className="bg-white rounded-[1.25rem] border border-gray-250/60 shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto border border-gray-200/80 rounded-2xl shadow-inner bg-[#FCFDFE]">
          <table className="w-full text-left text-xs font-semibold text-gray-600 border-collapse select-none">
            <thead>
              <tr className="border-b border-gray-250 bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-5">Id</th>
                <th className="py-4 px-5">Name</th>
                <th className="py-4 px-5">Store Name</th>
                <th className="py-4 px-5">Contact Details</th>
                <th className="py-4 px-5">Logo</th>
                <th className="py-4 px-5">Balance</th>
                <th className="py-4 px-5">Commission</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Need Approval?</th>
                <th className="py-4 px-5 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-xs font-black text-gray-400">
                    No active vendor records found.
                  </td>
                </tr>
              ) : (
                filteredVendors.slice(0, showCount).map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    {/* ID */}
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-[#0B1528] text-xs">{v.id}</span>
                    </td>

                    {/* NAME */}
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-gray-700 text-xs">{v.name}</span>
                    </td>

                    {/* STORE NAME */}
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider border border-indigo-100/50">
                        {v.storeName}
                      </span>
                    </td>

                    {/* CONTACT */}
                    <td className="py-4 px-5">
                      <div className="text-left leading-tight">
                        <span className="font-extrabold text-gray-800 text-xs block">{v.phone}</span>
                        <span className="text-[9px] text-gray-400 font-bold block mt-0.5">{v.email}</span>
                      </div>
                    </td>

                    {/* LOGO */}
                    <td className="py-4 px-5">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-150 bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                        <User size={14} className="stroke-[2.5]" />
                      </div>
                    </td>

                    {/* BALANCE */}
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-[#0B1528] text-xs">₹{v.balance}</span>
                    </td>

                    {/* COMMISSION */}
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-gray-600 text-xs">{v.commission}</span>
                    </td>

                    {/* CATEGORY (View Button) */}
                    <td className="py-4 px-5">
                      <button 
                        onClick={() => alert(`Active categories: ${v.category || 'None'}`)}
                        className="px-3 py-1.5 rounded-xl border border-gray-250 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-black text-[10px] flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Eye size={12} className="text-gray-400" />
                        <span>View ({v.categoriesCount})</span>
                      </button>
                    </td>

                    {/* STATUS PILL */}
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                        v.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : v.status === 'Suspended'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {v.status}
                      </span>
                    </td>

                    {/* NEED APPROVAL */}
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        v.needApproval === 'Yes'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {v.needApproval}
                      </span>
                    </td>

                    {/* ACTION ICONS */}
                    <td className="py-4 px-5 text-right pr-6">
                      <div className="flex items-center gap-1.5 ml-auto justify-end">
                        {/* Edit Button */}
                        <button 
                          onClick={() => openEditModal(v)}
                          title="Edit Vendor Details"
                          className="w-7 h-7 rounded-xl border border-gray-250/60 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center transition-all shrink-0"
                        >
                          <Edit size={12} className="stroke-[2.5]" />
                        </button>

                        {v.statusRaw === 'pending' && (
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

                        {v.statusRaw === 'suspended' && (
                          <button
                            type="button"
                            disabled={actionId === v.mongoId}
                            onClick={() => runVendorAction(v, 'reactivate')}
                            title="Reactivate vendor"
                            className="w-7 h-7 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
                          >
                            <RefreshCw size={12} />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDeleteVendor(v.id)}
                          title="Delete Vendor Partnership"
                          className="w-7 h-7 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-all shrink-0"
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

      {/* HIGH-FIDELITY SEGMENTED EDIT VENDOR PORTAL OVERLAY */}
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-4xl overflow-hidden animate-slide-up flex flex-col h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#0B1528]">Edit Vendor - {editName}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">View and manage vendor details</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingVendor(null);
                  setEditingVendorId(null);
                }}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* TOP ACTION BAR STATUS & QUICK APPROVALS */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-150 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                editStatus === 'Approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : editStatus === 'Suspended'
                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                Status: {editStatus}
              </span>

              <div className="flex items-center gap-2">
                {editingVendor?.statusRaw === 'pending' && (
                  <>
                    <button 
                      type="button"
                      disabled={actionId === editingVendor?.mongoId}
                      onClick={() => runVendorAction(editingVendor, 'approve')}
                      className="bg-[#0B1528] hover:bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      {actionId === editingVendor?.mongoId ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="stroke-[3]" />}
                      <span>Approve</span>
                    </button>
                    <button 
                      type="button"
                      disabled={actionId === editingVendor?.mongoId}
                      onClick={() => runVendorAction(editingVendor, 'reject')}
                      className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      <X size={14} className="stroke-[3]" />
                      <span>Reject</span>
                    </button>
                  </>
                )}
                {editingVendor?.statusRaw === 'approved' && (
                  <button
                    type="button"
                    disabled={actionId === editingVendor?.mongoId}
                    onClick={() => runVendorAction(editingVendor, 'suspend')}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                  >
                    <AlertCircle size={14} />
                    <span>Suspend</span>
                  </button>
                )}
                {editingVendor?.statusRaw === 'suspended' && (
                  <button
                    type="button"
                    disabled={actionId === editingVendor?.mongoId}
                    onClick={() => runVendorAction(editingVendor, 'reactivate')}
                    className="bg-[#0B1528] hover:bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw size={14} />
                    <span>Reactivate</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Form Body Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left bg-gray-50/20">
              
              {/* 1. BASIC INFORMATION SECTION */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <User size={16} className="text-gray-500" />
                  <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Basic Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Seller Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Store Name</label>
                    <input 
                      type="text" 
                      value={editStoreName}
                      onChange={(e) => setEditStoreName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Email</label>
                    <input 
                      type="email" 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Phone</label>
                    <input 
                      type="text" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Category</label>
                    <input 
                      type="text" 
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      placeholder="e.g. Backpacks & Bags"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Commission (%)</label>
                    <input 
                      type="number" 
                      value={editCommission}
                      onChange={(e) => setEditCommission(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-[#0B1528] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-black"
                    />
                  </div>
                </div>
              </div>

              {/* 2. ADDRESS INFORMATION SECTION */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <MapPin size={16} className="text-gray-500" />
                  <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Address Information</h4>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Address</label>
                  <input 
                    type="text" 
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">City</label>
                    <input 
                      type="text" 
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Serviceable Area</label>
                    <input 
                      type="text" 
                      value={editServiceableArea}
                      onChange={(e) => setEditServiceableArea(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Latitude</label>
                    <input 
                      type="text" 
                      value={editLatitude}
                      onChange={(e) => setEditLatitude(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Longitude</label>
                    <input 
                      type="text" 
                      value={editLongitude}
                      onChange={(e) => setEditLongitude(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. SERVICE AREA VISUALIZATION */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Eye size={16} className="text-gray-500" />
                  <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Service Area Visualization</h4>
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-3 max-w-md">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Service Radius (km)</label>
                    <input 
                      type="number" 
                      value={editServiceRadius}
                      onChange={(e) => setEditServiceRadius(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => alert(`Radius updated to ${editServiceRadius} km!`)}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-inner h-[38px] shrink-0"
                  >
                    Update Radius
                  </button>
                </div>

                {/* Styled Interactive Leaflet Map Visualizer */}
                <div className="border border-gray-250/80 rounded-2xl overflow-hidden shadow-inner relative h-64 bg-[#EBF0F5] select-none">
                  {/* Grid background layer to simulate cartography lines */}
                  <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
                  
                  {/* Decorative map graphics inside an SVG */}
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {/* Simulated river */}
                    <path d="M-10,120 Q120,80 250,150 T500,100 T800,130" fill="none" stroke="#A9CDE2" strokeWidth="18" strokeLinecap="round" />
                    {/* Simulated main roads */}
                    <line x1="0" y1="50" x2="900" y2="280" stroke="#FFF" strokeWidth="4" />
                    <line x1="120" y1="0" x2="220" y2="400" stroke="#FFF" strokeWidth="4" />
                    <line x1="0" y1="180" x2="900" y2="180" stroke="#F6D199" strokeWidth="3" />
                    
                    {/* Glowing pulse concentric radar service circles matching radius */}
                    <circle cx="50%" cy="50%" r={editServiceRadius * 12} fill="#6366F1" fillOpacity="0.12" stroke="#4F46E5" strokeWidth="2" strokeDasharray="3,3" className="animate-pulse" />
                    <circle cx="50%" cy="50%" r={editServiceRadius * 12} fill="transparent" stroke="#4F46E5" strokeWidth="1.5" />
                    
                    {/* Central anchor node coordinates */}
                    <circle cx="50%" cy="50%" r="5" fill="#4F46E5" />
                  </svg>

                  {/* Compass Zoom Controls */}
                  <div className="absolute top-4 left-4 flex flex-col bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden font-black text-sm select-none">
                    <button type="button" onClick={() => alert('Zooming in...')} className="w-8 h-8 flex items-center justify-center border-b border-gray-100 hover:bg-gray-50 text-gray-700">+</button>
                    <button type="button" onClick={() => alert('Zooming out...')} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-700">-</button>
                  </div>

                  {/* Leaflet Attribution Bar */}
                  <div className="absolute bottom-1 right-2 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[8px] font-bold text-gray-500 border border-gray-100">
                    🌍 Leaflet | © OpenStreetMap contributors
                  </div>

                  {/* Marker Pin Tooltip */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-9 bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1">
                    <MapPin size={9} className="text-indigo-400" />
                    <span>{editCity || 'Indore'} Service Node</span>
                  </div>

                  {/* Dynamic radius label overlay */}
                  <div className="absolute bottom-4 left-4 bg-gray-900/90 text-white text-[9px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md border border-gray-800">
                    <span>* Service Area Coverage:</span>
                    <span className="text-emerald-400 font-black">{editServiceRadius} km</span>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 font-bold select-none italic">* Adjust the radius above to see the service area change dynamically.</p>
              </div>

              {/* 4. TAX INFORMATION SECTION */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ShieldAlert size={16} className="text-gray-500" />
                  <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Tax Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">PAN Card</label>
                    <input 
                      type="text" 
                      value={editPanCard}
                      onChange={(e) => setEditPanCard(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Tax Name</label>
                    <input 
                      type="text" 
                      value={editTaxName}
                      onChange={(e) => setEditTaxName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Tax Number</label>
                  <input 
                    type="text" 
                    value={editTaxNumber}
                    onChange={(e) => setEditTaxNumber(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* 5. BANK INFORMATION SECTION */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Landmark size={16} className="text-gray-500" />
                  <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Bank Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Account Name</label>
                    <input 
                      type="text" 
                      value={editAccountName}
                      onChange={(e) => setEditAccountName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Bank Name</label>
                    <input 
                      type="text" 
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Branch</label>
                    <input 
                      type="text" 
                      value={editBranch}
                      onChange={(e) => setEditBranch(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Account Number</label>
                    <input 
                      type="text" 
                      value={editAccountNumber}
                      onChange={(e) => setEditAccountNumber(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1 max-w-xs">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">IFSC Code</label>
                  <input 
                    type="text" 
                    value={editIfscCode}
                    onChange={(e) => setEditIfscCode(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* 6. SETTINGS / READONLY DATA */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Settings size={16} className="text-gray-500" />
                  <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Settings</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Balance</label>
                    <input 
                      type="text" 
                      value={`₹${editBalance}`}
                      readOnly
                      disabled
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-500 font-bold select-none cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Categories Count</label>
                    <input 
                      type="text" 
                      value={`${editCategoriesCount} categories`}
                      readOnly
                      disabled
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-500 font-bold select-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer buttons bar */}
            <div className="p-5 border-t border-gray-150 flex items-center justify-end gap-2.5 bg-white px-6 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
              <button 
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingVendor(null);
                  setEditingVendorId(null);
                }}
                className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs px-5 py-2.5 rounded-xl transition-all"
              >
                Close
              </button>
              <button 
                type="button"
                onClick={handleUpdateVendor}
                className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/10"
              >
                Save Changes
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
