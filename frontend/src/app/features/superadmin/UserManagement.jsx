import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, UserCheck, Wallet, ShoppingBag, Search, ChevronRight, X, Edit3, ShieldAlert 
} from 'lucide-react';

const UserManagement = () => {
  // Mock users list state matching your screenshot data
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'User',
      email: '9555788454@kosil.temp',
      phone: '9555788454',
      registrationDate: '30/05/2026, 11:27:02',
      status: 'Active',
      refCode: 'USERUG69',
      walletAmt: 0.00,
      totalOrders: 0,
      totalSpent: 0.00
    },
    {
      id: 2,
      name: 'Rahul Verma',
      email: 'tes@rahul.com',
      phone: '9179815763',
      registrationDate: '30/05/2026, 11:26:36',
      status: 'Active',
      refCode: 'USERITZZ',
      walletAmt: 0.00,
      totalOrders: 3,
      totalSpent: 642.00
    },
    {
      id: 3,
      name: 'New Account',
      email: '1234567890@kosil.temp',
      phone: '1234567890',
      registrationDate: '30/05/2026, 10:47:09',
      status: 'Active',
      refCode: 'NEWAXVA8',
      walletAmt: 0.00,
      totalOrders: 0,
      totalSpent: 0.00
    },
    {
      id: 4,
      name: 'new',
      email: '7221132121@kosil.temp',
      phone: '7221132121',
      registrationDate: '29/05/2026, 22:02:08',
      status: 'Active',
      refCode: 'NEWVR83',
      walletAmt: 0.00,
      totalOrders: 0,
      totalSpent: 0.00
    },
    {
      id: 5,
      name: 'wholesaler',
      email: '7089334366@kosil.temp',
      phone: '7089334366',
      registrationDate: '25/05/2026, 12:08:01',
      status: 'Active',
      refCode: 'WHOLIS09',
      walletAmt: 0.00,
      totalOrders: 0,
      totalSpent: 0.00
    },
    {
      id: 6,
      name: 'Priyanshi',
      email: 'priyanshdass@gmail.com',
      phone: '7999942772',
      registrationDate: '25/05/2026, 12:00:26',
      status: 'Active',
      refCode: 'PRIYUNNF',
      walletAmt: 0.00,
      totalOrders: 1,
      totalSpent: 704.50
    }
  ]);

  // Search and entry count states
  const [searchQuery, setSearchQuery] = useState('');
  const [showCount, setShowCount] = useState('10');
  
  // Selected user for wallet adjustments
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('Credit');

  // Toggle single user status
  const handleToggleStatus = (id) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Submit wallet adjustment
  const handleWalletSubmit = (e) => {
    e.preventDefault();
    if (!adjustAmount || parseFloat(adjustAmount) <= 0) {
      alert('Please enter a valid monetary amount.');
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === selectedUser.id) {
        let newAmt = u.walletAmt;
        if (adjustType === 'Credit') {
          newAmt += parseFloat(adjustAmount);
        } else {
          newAmt = Math.max(0, newAmt - parseFloat(adjustAmount));
        }
        return { ...u, walletAmt: newAmt };
      }
      return u;
    }));

    alert(`Successfully ${adjustType === 'Credit' ? 'credited' : 'debited'} ₹${parseFloat(adjustAmount).toFixed(2)} to ${selectedUser.name}'s wallet!`);
    setSelectedUser(null);
    setAdjustAmount('');
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
                onChange={(e) => setShowCount(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none cursor-pointer font-bold"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>entries</span>
            </div>

            {/* Local Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">registration Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Ref Code</th>
                <th className="px-5 py-4">Wallet Amt</th>
                <th className="px-5 py-4 text-center">Total Orders</th>
                <th className="px-5 py-4">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-8 text-center text-gray-400 font-extrabold select-none">
                    No users found matching query string '{searchQuery}'.
                  </td>
                </tr>
              ) : (
                filteredUsers.slice(0, parseInt(showCount)).map((u, idx) => {
                  const isActive = u.status === 'Active';
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Sr No */}
                      <td className="px-5 py-4 text-center text-gray-400 font-extrabold tabular-nums select-none">
                        {idx + 1}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4 text-gray-950 font-black">
                        {u.name}
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
                          onClick={() => handleToggleStatus(u.id)}
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

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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

      {/* FOOTER COPYRIGHT BAR */}
      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">Healthy Delight</span>
        </p>
      </div>

    </div>
  );
};

export default UserManagement;
