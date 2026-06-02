import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Calendar, Search, Download, ChevronRight, X, Info 
} from 'lucide-react';

const VendorTransactions = () => {
  // Mock transaction list state
  const [transactions, setTransactions] = useState([
    {
      id: '6B3WGY8B',
      vendorName: "harsh's hub",
      type: 'Credit',
      amount: 63.00,
      remarks: 'Sale proceeds from Order #ORD1780130489670897',
      date: '30/05/2026'
    },
    {
      id: '3A0A1VTI',
      vendorName: "harsh's hub",
      type: 'Credit',
      amount: 45.00,
      remarks: 'Sale proceeds from Order #ORD1780130489670554',
      date: '30/05/2026'
    },
    {
      id: 'HOZZ61MS',
      vendorName: "harsh's hub",
      type: 'Credit',
      amount: 54.00,
      remarks: 'Sale proceeds from Order #ORD1780126968345112',
      date: '30/05/2026'
    },
    {
      id: 'A59T8R80',
      vendorName: "harsh's hub",
      type: 'Credit',
      amount: 54.00,
      remarks: 'Sale proceeds from Order #ORD1780126968345998',
      date: '30/05/2026'
    },
    {
      id: '60EIVH9H',
      vendorName: "harsh's hub",
      type: 'Credit',
      amount: 63.00,
      remarks: 'Sale proceeds from Order #ORD1780126968345334',
      date: '30/05/2026'
    },
    {
      id: 'TX100982',
      vendorName: 'patidar store',
      type: 'Credit',
      amount: 145.50,
      remarks: 'Sale proceeds from Order #ORD1780130489670443',
      date: '29/05/2026'
    },
    {
      id: 'TX99281A',
      vendorName: 'nexus',
      type: 'Debit',
      amount: 500.00,
      remarks: 'Requested Bank Transfer withdrawal processed',
      date: '28/05/2026'
    }
  ]);

  // Modal open states
  const [showAddModal, setShowAddModal] = useState(false);

  // New transaction form state
  const [newTx, setNewTx] = useState({
    vendorName: "harsh's hub",
    type: 'Credit',
    amount: '',
    remarks: ''
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [perPage, setPerPage] = useState('10');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Handle new transaction submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTx.amount || parseFloat(newTx.amount) <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }

    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const todayStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');

    const added = {
      id: randomId,
      vendorName: newTx.vendorName,
      type: newTx.type,
      amount: parseFloat(newTx.amount),
      remarks: newTx.remarks || 'Manual administrative fund adjustment',
      date: todayStr
    };

    setTransactions(prev => [added, ...prev]);
    setShowAddModal(false);
    setNewTx({
      vendorName: "harsh's hub",
      type: 'Credit',
      amount: '',
      remarks: ''
    });
    alert(`Transaction recorded successfully!\nReference: ${randomId}`);
  };

  // Clear date filters
  const handleClearDates = () => {
    setFromDate('');
    setToDate('');
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Reference ID,Vendor Name,Type,Amount (INR),Remarks,Date\n';
    
    filteredTransactions.forEach(t => {
      csvContent += `${t.id},"${t.vendorName}",${t.type},${t.amount},"${t.remarks.replace(/"/g, '""')}",${t.date}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendor_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.remarks.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVendor = vendorFilter === 'All' || t.vendorName === vendorFilter;
    const matchesType = typeFilter === 'All' || t.type === typeFilter;

    return matchesSearch && matchesVendor && matchesType;
  });

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Vendor Transactions</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              LEDGER
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Track platform fund transfers, payouts, and primary vendor settlements.</p>
        </div>

        {/* Breadcrumb right align */}
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Home</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">Transactions</span>
        </div>
      </div>

      {/* VIEW FUND TRANSFER / CONTROL GRID PANEL */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden text-left p-6 space-y-6">
        
        {/* Title & Add button */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4 select-none">
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">View Fund Transfer</h3>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-white border border-[#0B1528] hover:bg-gray-50 text-[#0B1528] text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Add Fund Transfer</span>
          </button>
        </div>

        {/* Multi Filter Bar Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 text-xs font-bold text-gray-600">
          
          {/* Dates & Vendor Filters */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* From Date */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 select-none uppercase tracking-wide">From - To Date:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              />
            </div>

            <span className="text-gray-400 select-none">-</span>

            {/* To Date */}
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
            />

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClearDates}
              className="bg-gray-100 hover:bg-gray-200/80 text-gray-600 px-3 py-2 rounded-xl transition-all select-none text-[10px] uppercase font-black"
            >
              Clear
            </button>

          </div>

          {/* Search, Export, Dropdown filters */}
          <div className="flex flex-wrap items-center xl:justify-end gap-3 select-none">
            
            {/* Per Page */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Per Page:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-2 py-2 focus:outline-none cursor-pointer font-bold"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl transition-all shadow-2xs font-extrabold"
            >
              <Download size={13} className="text-gray-400" />
              <span>Export</span>
            </button>

            {/* Search Ledger Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 w-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              />
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

          </div>

        </div>

        {/* Secondary Filter Bar Row (Vendor & Method) */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-600 select-none pb-2 border-b border-gray-50">
          
          {/* Vendor Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Filter by Vendor:</span>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-bold"
            >
              <option value="All">All Vendors</option>
              <option value="harsh's hub">harsh's hub</option>
              <option value="patidar store">patidar store</option>
              <option value="nexus">nexus</option>
              <option value="Test Factory">Test Factory</option>
            </select>
          </div>

          {/* Method Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Filter by Method:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-bold"
            >
              <option value="All">All</option>
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>
          </div>

        </div>

        {/* LEDGER DATA TABLE */}
        <div className="overflow-x-auto border border-gray-150 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                <th className="px-6 py-4">Reference ID</th>
                <th className="px-6 py-4">Vendor Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount (₹)</th>
                <th className="px-6 py-4">Remarks / Message</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400 font-extrabold">
                    No transactions found matching your selection.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const isCredit = t.type === 'Credit';
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-[#0B1528] font-extrabold tabular-nums select-all">
                        {t.id}
                      </td>
                      <td className="px-6 py-4 text-gray-900 select-none">
                        {t.vendorName}
                      </td>
                      <td className="px-6 py-4 select-none">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isCredit 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-950 font-black tabular-nums">
                        ₹{t.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-medium max-w-[320px] truncate select-text">
                        {t.remarks}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-extrabold tabular-nums select-none">
                        {t.date}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* CENTERED ADD FUND TRANSFER MODAL POPUP */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-[#0B1528]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] select-none animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-250 shadow-2xl max-w-md w-full overflow-hidden text-left transform scale-100 transition-all">
            
            {/* Modal Title Banner */}
            <div className="bg-[#0B1528] text-white p-6 flex justify-between items-center select-none">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Add Fund Transfer</h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Record a new administrative financial transaction cut.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Input Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs font-bold text-gray-700">
              
              {/* Select Vendor Hub */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Vendor Hub</label>
                <select
                  value={newTx.vendorName}
                  onChange={(e) => setNewTx(prev => ({ ...prev, vendorName: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
                >
                  <option value="harsh's hub">harsh's hub</option>
                  <option value="patidar store">patidar store</option>
                  <option value="nexus">nexus</option>
                  <option value="Test Factory">Test Factory</option>
                </select>
              </div>

              {/* Grid Transaction Type & Amount */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Transaction Type */}
                <div className="space-y-1.5">
                  <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Transaction Type</label>
                  <select
                    value={newTx.type}
                    onChange={(e) => setNewTx(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
                  >
                    <option value="Credit">Credit (Deposit)</option>
                    <option value="Debit">Debit (Deduction)</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={newTx.amount}
                    onChange={(e) => setNewTx(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
                  />
                </div>

              </div>

              {/* Remarks / Message */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Remarks / Message</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe the nature of this fund transfer adjustment..."
                  value={newTx.remarks}
                  onChange={(e) => setNewTx(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-semibold"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs transition-all"
                >
                  Submit
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

export default VendorTransactions;
