import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Download, Calendar, ArrowRight, Eye, ChevronRight, 
  ChevronLeft, FileSpreadsheet, FileText, CheckCircle2, Truck, 
  CalendarClock, XCircle, ShoppingBag, MapPin, Building2, User,
  Printer
} from 'lucide-react';
import apiClient from '../../services/apiClient';

const VendorOrders = () => {
  const [searchParams] = useSearchParams();
  const initialStatusFilter = searchParams.get('status') || 'All Status';
  
  // Helpers to parse dates
  const parseMockDate = (dateStr) => {
    if (!dateStr) return null;
    const [m, d, y] = dateStr.split('/');
    return new Date(y, m - 1, d);
  };

  const parseInputDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return new Date(y, m - 1, d);
  };

  // States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Fetch orders from MongoDB backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/vendor/orders');
        setOrders(response.data || []);
      } catch (error) {
        console.error('Error loading vendor orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    const fromDateObj = parseInputDate(fromDate);
    const toDateObj = parseInputDate(toDate);

    return orders.filter(order => {
      // Status Filter
      const matchesStatus = statusFilter === 'All Status' || order.status.toLowerCase() === statusFilter.toLowerCase();
      
      // Search Query Filter
      const matchesSearch = searchQuery === '' || 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.amount.toString().includes(searchQuery) ||
        order.school.toLowerCase().includes(searchQuery.toLowerCase());

      // Date Range Filter
      let matchesDate = true;
      if (order.orderDate) {
        const orderDateObj = parseMockDate(order.orderDate);
        
        if (fromDateObj) {
          orderDateObj.setHours(0, 0, 0, 0);
          fromDateObj.setHours(0, 0, 0, 0);
          if (orderDateObj < fromDateObj) matchesDate = false;
        }
        
        if (toDateObj) {
          orderDateObj.setHours(0, 0, 0, 0);
          toDateObj.setHours(0, 0, 0, 0);
          if (orderDateObj > toDateObj) matchesDate = false;
        }
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [orders, statusFilter, searchQuery, fromDate, toDate]);

  // Pagination Slice
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    return filteredOrders.slice(startIndex, startIndex + limit);
  }, [filteredOrders, currentPage, limit]);

  const totalPages = Math.ceil(filteredOrders.length / limit);

  // ----------------------------------------------------
  // FULL SCREEN HIGH FIDELITY ORDER INVOICE DETAILS VIEW
  // ----------------------------------------------------
  if (selectedOrder) {
    return (
      <div className="space-y-6 pb-12 relative animate-fade-in font-sans text-gray-900 selection:bg-purple-100">
        
        {/* Header and Back navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-purple-200 rounded-xl text-xs font-bold text-gray-600 hover:text-[#5B3FD6] transition-all flex items-center gap-1.5 shadow-sm"
            >
              ← Back to Orders list
            </button>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">View Order Details</h1>
          </div>
          <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <span>Home</span>
            <ChevronRight size={12} />
            <span>Orders List</span>
            <ChevronRight size={12} />
            <span className="text-[#5B3FD6]">Details</span>
          </div>
        </div>

        {/* Order Action Section Panel */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="w-full xl:flex-1">
            <button className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 transition-all shadow-sm">
              Accept Order
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full xl:w-auto justify-start xl:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Truck size={14} /> Assign Rider:
              </span>
              <select className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] cursor-pointer">
                <option>Select Delivery Rider</option>
                <option>Rahul Sharma (Active)</option>
                <option>Amit Kumar (Active)</option>
                <option>Rajesh Yadav (Active)</option>
              </select>
            </div>
            
            <button className="px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white font-extrabold rounded-xl transition-all text-xs tracking-wider uppercase shadow-sm">
              REQUEST RIDER
            </button>

            <div className="h-6 w-px bg-gray-100 hidden sm:block"></div>

            <button className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 hover:border-purple-200 bg-white hover:bg-purple-50/20 text-xs font-bold text-gray-700 transition-all shadow-sm">
              <FileText size={14} className="text-red-500" /> Export Invoice PDF
            </button>

            <button className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 hover:border-purple-200 bg-white hover:bg-purple-50/20 text-xs font-bold text-gray-700 transition-all shadow-sm">
              <Printer size={14} className="text-blue-500" /> Print Invoice
            </button>
          </div>
        </div>

        {/* View Order Details Card */}
        <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm p-6 md:p-8 space-y-8 relative overflow-hidden">
          
          {/* Blue Schedule Banner */}
          <div className="bg-blue-50/60 border border-blue-100/50 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block">
                {selectedOrder.status.toUpperCase()} DELIVERY ORDER
              </span>
              <span className="text-xs font-extrabold text-blue-800 mt-1 block">
                Deliver on {selectedOrder.deliveryDate} ({selectedOrder.timeSlot})
              </span>
            </div>
          </div>

          {/* Supplier, Contact & Invoice Information metadata */}
          <div className="flex flex-col md:flex-row justify-between gap-6 pt-2">
            
            {/* Left Column: Supplier Info */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800 font-black text-sm shrink-0 border border-gray-200">
                  {selectedOrder.school.charAt(0)}
                </div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  {selectedOrder.school}
                </span>
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {selectedOrder.school}
              </h2>
              
              <div className="text-xs text-gray-500 font-medium space-y-1.5 leading-relaxed">
                <p><span className="text-gray-400 font-bold">From:</span> {selectedOrder.school}</p>
                <p><span className="text-gray-400 font-bold">Phone:</span> {selectedOrder.phone}</p>
                <p><span className="text-gray-400 font-bold">Email:</span> {selectedOrder.email}</p>
                <p><span className="text-gray-400 font-bold">Website:</span> <a href={selectedOrder.website} target="_blank" rel="noreferrer" className="text-[#5B3FD6] hover:underline font-bold">{selectedOrder.website}</a></p>
              </div>
            </div>

            {/* Right Column: Invoice ID & Status */}
            <div className="text-left md:text-right space-y-2 text-xs">
              <p className="text-gray-400 font-bold">Date: {selectedOrder.orderDate}</p>
              
              <h3 className="text-lg font-black text-gray-900 tracking-tight pt-1">
                Invoice #{selectedOrder.id}
              </h3>
              
              <div className="text-gray-500 font-medium space-y-1.5 inline-block text-left md:text-right leading-relaxed">
                <p><span className="text-gray-400 font-bold">Order ID:</span> {selectedOrder.id}</p>
                <p><span className="text-gray-400 font-bold">Delivery Date:</span> {selectedOrder.deliveryDate}</p>
                <p><span className="text-gray-400 font-bold">Time Slot:</span> {selectedOrder.timeSlot}</p>
                <p className="pt-2 flex items-center md:justify-end gap-2">
                  <span className="text-gray-400 font-bold">Order Status:</span>
                  <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${selectedOrder.statusColor}`}>
                    {selectedOrder.status}
                  </span>
                </p>
              </div>
            </div>

          </div>

          {/* Product Items Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <th className="px-6 py-4">SR. NO.</th>
                  <th className="px-6 py-4">PRODUCT</th>
                  <th className="px-6 py-4">UNIT</th>
                  <th className="px-6 py-4">PRICE</th>
                  <th className="px-6 py-4">TAX ₹ (%)</th>
                  <th className="px-6 py-4 text-center">QTY</th>
                  <th className="px-6 py-4 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 font-semibold">
                {selectedOrder.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-mono">{item.srNo}</td>
                    <td className="px-6 py-4 font-black text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4">₹{item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500">{item.tax}</td>
                    <td className="px-6 py-4 text-center font-bold">{item.qty}</td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">₹{(item.qty * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Billing & Commission Calculations Summary Card */}
          <div className="flex justify-end pt-4">
            <div className="w-full max-w-[380px] bg-[#FCFCFD] border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-b border-gray-100 pb-2">
                Order Billing Summary
              </span>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Items Total:</span>
                <span className="font-black text-gray-950">₹{selectedOrder.amount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Platform Commission (10%):</span>
                <span className="font-black text-red-500">-₹{(selectedOrder.amount * 0.1).toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-100 pt-3.5 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest block">
                    YOUR NET EARNINGS:
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold tracking-wider mt-0.5 block uppercase">
                    (Credited to Wallet Balance)
                  </span>
                </div>
                <span className="text-xl font-black text-emerald-600">
                  ₹{(selectedOrder.amount * 0.9).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice footer message */}
          <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-6 border-t border-gray-50">
            Bill Generated by {selectedOrder.school}
          </div>

        </div>

      </div>
    );
  }

  // ----------------------------------------------------
  // VENDOR ORDERS LOG TABLE VIEW
  // ----------------------------------------------------
  return (
    <div className="space-y-6 pb-12 relative animate-fade-in font-sans">
      
      {/* Page Title & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Orders List</h1>
        </div>
        <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          <span>Home</span>
          <ChevronRight size={12} />
          <span className="text-[#5B3FD6]">Orders List</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm overflow-hidden">
        
        {/* Card Header & Controls */}
        <div className="p-5 md:p-6 border-b border-gray-50 bg-[#FCFCFD]">
          <h2 className="font-extrabold text-sm text-gray-800 mb-4">View Order List</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* From Date Picker */}
            <div className="lg:col-span-2 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">From</span>
              <div className="relative w-full group">
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] cursor-pointer"
                />
              </div>
            </div>

            {/* To Date Picker */}
            <div className="lg:col-span-2 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">To</span>
              <div className="relative w-full group">
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] cursor-pointer"
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="lg:col-span-3 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">Status</span>
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] cursor-pointer"
              >
                <option>All Status</option>
                <option>Received</option>
                <option>Scheduled</option>
                <option>Processing</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>
            </div>

            {/* Pagination Limit */}
            <div className="lg:col-span-1">
              <select 
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                className="w-full px-2.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] cursor-pointer text-center"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="lg:col-span-3 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by Order ID, Status, or Amount..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] placeholder-gray-400 font-medium"
              />
            </div>

            {/* Export Menu */}
            <div className="lg:col-span-1 relative">
              <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 hover:border-[#5B3FD6]/20 bg-white hover:bg-purple-50/30 text-xs font-bold text-gray-700 hover:text-[#5B3FD6] transition-all"
              >
                <Download size={14} /> Export
              </button>
              
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 p-1.5 z-30 animate-scale-in">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    <FileSpreadsheet size={14} className="text-emerald-600" /> Excel (.xlsx)
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    <FileText size={14} className="text-blue-600" /> PDF Report
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Table Body Area */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white space-y-3">
              <div className="w-8 h-8 border-4 border-[#5B3FD6] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading Orders Log...</span>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <th className="px-6 py-4">O. Id</th>
                  <th className="px-6 py-4">D. Date</th>
                  <th className="px-6 py-4">O. Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 text-gray-500">{order.deliveryDate}</td>
                      <td className="px-6 py-4 text-gray-500">{order.orderDate}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${order.statusColor}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-900">₹{order.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-[#5B3FD6]/10 text-gray-600 hover:text-[#5B3FD6] text-xs font-bold border border-gray-100 hover:border-transparent transition-all"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold bg-white">
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-[#FCFCFD]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Showing page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default VendorOrders;
