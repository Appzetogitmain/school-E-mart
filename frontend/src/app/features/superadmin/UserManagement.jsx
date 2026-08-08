import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, UserCheck, Wallet, ShoppingBag, Search, ChevronRight, X, Edit3, ShieldAlert, Loader2, Edit, Trash2, AlertCircle
} from 'lucide-react';
import { listUsers, suspendUser, activateUser, adjustUserWallet, updateUser, deleteUser } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapAdminUserForList } from '../../../utils/mappers/adminUserMapper';

const inputCls =
  'w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold';
const labelCls = 'text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listUsers({ limit: 10000, role: 'parent' });
      setUsers((data || []).map(mapAdminUserForList));
    } catch (err) {
      setUsers([]);
      setError(getErrorMessage(err, 'Unable to load users'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Search and entry count states
  const [searchQuery, setSearchQuery] = useState('');
  const [showCount, setShowCount] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selected user for wallet adjustments
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('Credit');

  // Edit / delete
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleToggleStatus = async (user) => {
    if (!user?.mongoId) return;
    setActionId(user.mongoId);
    try {
      if (user.statusRaw === 'active') {
        await suspendUser(user.mongoId, { reason: 'Suspended by admin' });
        setUsers((prev) =>
          prev.map((u) =>
            u.mongoId === user.mongoId ? { ...u, status: 'Inactive', statusRaw: 'inactive' } : u
          )
        );
      } else {
        await activateUser(user.mongoId);
        setUsers((prev) =>
          prev.map((u) =>
            u.mongoId === user.mongoId ? { ...u, status: 'Active', statusRaw: 'active' } : u
          )
        );
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to update user status'));
    } finally {
      setActionId(null);
    }
  };

  // Submit wallet adjustment
  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    if (!adjustAmount || parseFloat(adjustAmount) <= 0) {
      alert('Please enter a valid monetary amount.');
      return;
    }

    try {
      await adjustUserWallet(selectedUser.id, {
        amountPaise: Math.round(parseFloat(adjustAmount) * 100),
        direction: adjustType === 'Debit' ? 'debit' : 'credit',
        remarks: `Manual ${adjustType.toLowerCase()} by super admin`,
      });
      setSelectedUser(null);
      setAdjustAmount('');
      await loadUsers();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to adjust wallet'));
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditError('');
    setEditForm({
      name: u.name === 'User' ? '' : u.name,
      email: u.email === '—' ? '' : u.email,
      phone: u.phone === '—' ? '' : u.phone,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser || !editForm) return;
    if (editForm.phone.trim() && !/^[6-9]\d{9}$/.test(editForm.phone.trim())) {
      setEditError('Phone must be a 10-digit Indian mobile starting with 6-9.');
      return;
    }
    setEditError('');

    try {
      setSaving(true);
      await updateUser(editingUser.mongoId, {
        ...(editForm.name.trim() ? { name: editForm.name.trim() } : {}),
        ...(editForm.email.trim() ? { email: editForm.email.trim() } : {}),
        ...(editForm.phone.trim() ? { phone: editForm.phone.trim() } : {}),
      });
      setIsEditModalOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setEditError(getErrorMessage(err, 'Unable to update user'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!confirm(
      `Permanently delete "${u.name}"?\n\nThis also removes their linked student profile(s) and saved addresses. Past orders are kept. This cannot be undone.`
    )) return;
    setActionId(u.mongoId);
    try {
      await deleteUser(u.mongoId);
      await loadUsers();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to delete user'));
    } finally {
      setActionId(null);
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(u => {
    const term = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.phone.includes(term) ||
      u.refCode.toLowerCase().includes(term)
    );
  });

  const pageSize = parseInt(showCount, 10) || 10;
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Calculate platform metrics
  const totalWalletSum = users.reduce((acc, curr) => acc + curr.walletAmt, 0);
  const totalSpentSum = users.reduce((acc, curr) => acc + curr.totalSpent, 0);
  const totalOrdersSum = users.reduce((acc, curr) => acc + curr.totalOrders, 0);

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER ROW WITH BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">User List</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              CUSTOMER CORE
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Monitor client logins, registered phone logs, wallet amounts, and total platform spent.</p>
        </div>

        {/* Breadcrumb right align */}
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Home</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">User List</span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      {/* OVERVIEW ANALYTICS COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        
        {/* Metric 1 */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 flex items-center gap-4 shadow-xs text-left">
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 shrink-0">
            <Users size={20} className="text-indigo-600" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Customers</span>
            <h3 className="text-xl font-black text-[#0B1528] mt-0.5">{users.length}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 flex items-center gap-4 shadow-xs text-left">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 shrink-0">
            <UserCheck size={20} className="text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Active Status</span>
            <h3 className="text-xl font-black text-[#0B1528] mt-0.5">
              {users.filter(u => u.status === 'Active').length}
            </h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 flex items-center gap-4 shadow-xs text-left">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 shrink-0">
            <Wallet size={20} className="text-amber-600" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Wallet (₹)</span>
            <h3 className="text-xl font-black text-[#0B1528] mt-0.5">₹{totalWalletSum.toFixed(2)}</h3>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 flex items-center gap-4 shadow-xs text-left">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 shrink-0">
            <ShoppingBag size={20} className="text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Cumulative spent</span>
            <h3 className="text-xl font-black text-[#0B1528] mt-0.5">₹{totalSpentSum.toFixed(2)}</h3>
          </div>
        </div>

      </div>

      {/* VIEW USERS CORE PANEL */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden text-left p-6 space-y-6">
        
        {/* Panel Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 select-none">
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">View Users</h3>
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-600">
            
            {/* Show page count */}
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={showCount}
                onChange={(e) => {
                  setShowCount(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none cursor-pointer font-bold"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="10000">All</option>
              </select>
              <span>entries</span>
            </div>

            {/* Local Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-1.5 w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              />
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

          </div>
        </div>

        {/* CUSTOM TABLE DATA DISPLAY */}
        <div className="overflow-x-auto border border-gray-150 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                <th className="px-5 py-4 w-12 text-center">Sr No</th>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">registration Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Ref Code</th>
                <th className="px-5 py-4">Wallet Amt</th>
                <th className="px-5 py-4 text-center">Total Orders</th>
                <th className="px-5 py-4">Total Spent</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-5 py-8 text-center text-gray-400 font-extrabold select-none">
                    No users found matching query string '{searchQuery}'.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, idx) => {
                  const isActive = u.status === 'Active';
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Sr No */}
                      <td className="px-5 py-4 text-center text-gray-400 font-extrabold tabular-nums select-none">
                        {srNo}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4 text-gray-950 font-black">
                        {u.name}
                      </td>

                      {/* Student — the linked child(ren); this, not the parent's
                          own name, is usually what identifies the row to a school */}
                      <td className="px-5 py-4 text-gray-700 font-bold">
                        {u.studentName}
                      </td>

                      {/* Contact Stacked */}
                      <td className="px-5 py-4 leading-normal select-all">
                        <span className="text-gray-400 font-medium block truncate max-w-[200px]">{u.email}</span>
                        <span className="text-gray-900 font-extrabold block mt-0.5 tabular-nums">{u.phone}</span>
                      </td>

                      {/* Registration Date */}
                      <td className="px-5 py-4 text-gray-400 font-semibold tabular-nums select-none">
                        {u.registrationDate}
                      </td>

                      {/* Status Toggle Pill */}
                      <td className="px-5 py-4 select-none">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionId === u.mongoId}
                          title="Click to toggle status active state"
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {u.status}
                        </button>
                      </td>

                      {/* Referral Code */}
                      <td className="px-5 py-4 font-black text-gray-900 select-all tracking-wider">
                        {u.refCode}
                      </td>

                      {/* Wallet Amt with Edit action */}
                      <td className="px-5 py-4 tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-950 font-black">₹{u.walletAmt.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            title="Adjust wallet balance"
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all"
                          >
                            <Edit3 size={11} />
                          </button>
                        </div>
                      </td>

                      {/* Total Orders */}
                      <td className="px-5 py-4 text-center text-gray-900 font-black tabular-nums select-none">
                        {u.totalOrders}
                      </td>

                      {/* Total Spent */}
                      <td className="px-5 py-4 text-gray-950 font-black tabular-nums">
                        ₹{u.totalSpent.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            title="Edit user"
                            className="w-7 h-7 rounded-xl border border-gray-250/60 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center transition-all"
                          >
                            <Edit size={12} className="stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            disabled={actionId === u.mongoId}
                            onClick={() => handleDeleteUser(u)}
                            title="Delete user"
                            className="w-7 h-7 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-all disabled:opacity-50"
                          >
                            {actionId === u.mongoId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} className="stroke-[2.5]" />}
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS FOOTER */}
        {filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100 select-none">
            <span className="text-xs font-bold text-gray-400">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredUsers.length)} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} entries
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, currentPage - 3),
                Math.min(totalPages, currentPage + 2)
              ).map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${currentPage === page ? 'bg-[#0B1528] text-white shadow-xs' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* CENTERED PORTAL MODAL DIALOG FOR WALLET ADJUSTMENT */}
      {selectedUser && createPortal(
        <div className="fixed inset-0 bg-[#0B1528]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] select-none animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-250 shadow-2xl max-w-sm w-full overflow-hidden text-left transform scale-100 transition-all">
            
            {/* Title Banner */}
            <div className="bg-[#0B1528] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Adjust Customer Wallet</h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Modify virtual balance of {selectedUser.name}.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleWalletSubmit} className="p-6 space-y-4 text-xs font-bold text-gray-700">
              
              {/* Wallet Info Summary */}
              <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-gray-100 flex items-center justify-between text-left">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide block">Current Ledger Balance</span>
                  <span className="text-lg font-black text-[#0B1528]">₹{selectedUser.walletAmt.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide block">Ref Code</span>
                  <span className="font-extrabold text-gray-700">{selectedUser.refCode}</span>
                </div>
              </div>

              {/* Grid adjustment Type & Amount */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Adjust Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
                  >
                    <option value="Credit">Credit (+) </option>
                    <option value="Debit">Debit (-) </option>
                  </select>
                </div>

                {/* Amount field */}
                <div className="space-y-1.5">
                  <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs transition-all"
                >
                  Apply
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && editForm && editingUser && createPortal(
        <div className="fixed inset-0 bg-[#0B1528]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] select-none animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-250 shadow-2xl max-w-sm w-full overflow-hidden text-left transform scale-100 transition-all">
            <div className="bg-[#0B1528] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Edit User</h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">{editingUser.refCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form id="edit-user-form" onSubmit={handleUpdateUser} className="p-6 space-y-4 text-xs font-bold text-gray-700">
              {editError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-red-700">{editError}</span>
                </div>
              )}
              <div>
                <label className={labelCls}>Name</label>
                <input type="text" className={inputCls} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" className={inputCls} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* FOOTER COPYRIGHT BAR */}
      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">School E-Mart</span>
        </p>
      </div>

    </div>
  );
};

export default UserManagement;
