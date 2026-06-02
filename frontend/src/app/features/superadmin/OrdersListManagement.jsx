import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Eye, Search, Download, ChevronRight, X, Calendar, User, MapPin, DollarSign, Clock, FileText
} from 'lucide-react';

const OrdersListManagement = () => {
  // Mock orders list matching your screenshot data exactly
  const [orders, setOrders] = useState([
    {
      id: 'ORD1780130489670897',
      customer: 'Rahul Verma',
      address: 'Corporate house, Chhoti Gwaltoli',
      date: '30/05/2026',
      status: 'Scheduled',
      deliveryStatus: 'Not Assigned',
      amount: 142.00,
      seller: 'harsh\'s hub',
      items: [
        { name: 'Fresh Apples Red Premium', qty: 2, price: 50.00 },
        { name: 'Local Farm Honey Organic', qty: 1, price: 42.00 }
      ]
    },
    {
      id: 'ORD1780126968340909',
      customer: 'Rahul Verma',
      address: 'Corporate house, Chhoti Gwaltoli',
      date: '30/05/2026',
      status: 'Received',
      deliveryStatus: 'Not Assigned',
      amount: 278.50,
      seller: 'patidar store',
      items: [
        { name: 'Organic Brocolli Green', qty: 3, price: 70.00 },
        { name: 'Premium Milk Dairy Gold', qty: 1, price: 68.50 }
      ]
    },
    {
      id: 'ORD17801259910309810',
      customer: 'Rahul Verma',
      address: 'Corporate house, Chhoti Gwaltoli',
      date: '30/05/2026',
      status: 'Scheduled',
      deliveryStatus: 'Not Assigned',
      amount: 221.50,
      seller: 'harsh\'s hub',
      items: [
        { name: 'Banana Golden Bunch', qty: 2, price: 45.00 },
        { name: 'Chocolates Mixed Box', qty: 1, price: 131.50 }
      ]
    },
    {
      id: 'ORD1780120267093245',
      customer: 'Harsh',
      address: 'Corporate House, Regal Square',
      date: '30/05/2026',
      status: 'Received',
      deliveryStatus: 'Not Assigned',
      amount: 62.00,
      seller: 'nexus',
      items: [
        { name: 'Brown Bread Wheat Grain', qty: 1, price: 62.00 }
      ]
    },
    {
      id: 'ORD1780054731433627',
      customer: 'Harsh',
      address: 'Corporate House, Regal Square',
      date: '29/05/2026',
      status: 'Delivered',
      deliveryStatus: 'Delivered',
      amount: 62.00,
      seller: 'nexus',
      items: [
        { name: 'Brown Bread Wheat Grain', qty: 1, price: 62.00 }
      ]
    },
    {
      id: 'ORD1780043020326166',
      customer: 'Harsh',
      address: 'Corporate House, Regal Square',
      date: '29/05/2026',
      status: 'Delivered',
      deliveryStatus: 'Delivered',
      amount: 85.00,
      seller: 'harsh\'s hub',
      items: [
        { name: 'Pomegranate Seeds Pack', qty: 1, price: 85.00 }
      ]
    },
    {
      id: 'ORD1780042034930386',
      customer: 'Harsh',
      address: 'Corporate House, Regal Square',
      date: '29/05/2026',
      status: 'Delivered',
      deliveryStatus: 'Delivered',
      amount: 85.00,
      seller: 'nexus',
      items: [
        { name: 'Pomegranate Seeds Pack', qty: 1, price: 85.00 }
      ]
    },
    {
      id: 'ORD1780040551080794',
      customer: 'Harsh',
      address: 'Corporate House, Regal Square',
      date: '29/05/2026',
      status: 'Delivered',
      deliveryStatus: 'Delivered',
      amount: 85.00,
      seller: 'patidar store',
      items: [
        { name: 'Pomegranate Seeds Pack', qty: 1, price: 85.00 }
      ]
    },
    {
      id: 'ORD1779971342101309',
      customer: 'Harsh',
      address: 'Corporate House, Regal Square',
      date: '28/05/2026',
      status: 'Delivered',
      deliveryStatus: 'Delivered',
      amount: 102.00,
      seller: 'harsh\'s hub',
      items: [
        { name: 'Fresh Apples Red Premium', qty: 2, price: 51.00 }
      ]
    }
  ]);

  // Filtering / control states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sellerFilter, setSellerFilter] = useState('All Sellers');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [perPage, setPerPage] = useState('10');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Modal Details Invoice
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Export Order Ledger CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Order ID,Customer Name,Address,Order Date,Status,Delivery Status,Amount (INR),Seller\n';
    
    filteredOrders.forEach(o => {
      csvContent += `${o.id},"${o.customer}","${o.address.replace(/"/g, '""')}",${o.date},${o.status},${o.deliveryStatus},${o.amount},"${o.seller}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_list_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter orders logic
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.amount.toString().includes(searchQuery);

    const matchesSeller = sellerFilter === 'All Sellers' || o.seller.toLowerCase() === sellerFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All Status' || o.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesSeller && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Orders List</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              ORDER MATRIX
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Track, assign delivery status parameters, filter chronological merchant collections, and generate invoice panels.</p>
        </div>

        {/* Breadcrumb right align */}
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Dashboard</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">Orders List</span>
        </div>
      </div>

      {/* CORE VIEW ORDER CARD PANEL */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden text-left p-6 space-y-6">
        
        {/* Panel title */}
        <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider border-b border-gray-100 pb-3 select-none">
          View Order List
        </h3>

        {/* ADVANCED MULTI FILTER BAR ROW */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 text-xs font-bold text-gray-600 select-none items-center">
          
          {/* Date range picker */}
          <div className="xl:col-span-4 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide shrink-0">From - To Order Date:</span>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="MM/DD/YYYY - MM/DD/YYYY"
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
              <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Seller dropdown filter */}
          <div className="xl:col-span-2 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide shrink-0">Sellers:</span>
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-bold"
            >
              <option value="All Sellers">All Sellers</option>
              <option value="harsh's hub">harsh's hub</option>
              <option value="patidar store">patidar store</option>
              <option value="nexus">nexus</option>
            </select>
          </div>

          {/* Status dropdown filter */}
          <div className="xl:col-span-2 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-bold"
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
              <option value="Processed">Processed</option>
              <option value="Shipped">Shipped</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          {/* Entries Limit */}
          <div className="xl:col-span-1">
            <select
              value={perPage}
              onChange={(e) => setPerPage(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-2 py-2 focus:outline-none cursor-pointer font-bold"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          {/* Export & Keyword Search block */}
          <div className="xl:col-span-3 flex items-center gap-3 justify-end">
            
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-white border border-[#0B1528] hover:bg-gray-50 text-[#0B1528] px-4 py-2 rounded-xl transition-all shadow-2xs font-extrabold"
            >
              <Download size={13} className="text-gray-500" />
              <span>Export</span>
            </button>

            <div className="relative flex-1 max-w-[200px]">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              />
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

          </div>

        </div>

        {/* ORDER LOGS TABLE */}
        <div className="overflow-x-auto border border-gray-150 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                <th className="px-5 py-4">O. ID</th>
                <th className="px-5 py-4">Customer Details</th>
                <th className="px-5 py-4">Address</th>
                <th className="px-5 py-4">O. Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Delivery Boy Assign Status</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-gray-400 font-extrabold select-none">
                    No orders recorded matching filter constraints.
                  </td>
                </tr>
              ) : (
                filteredOrders.slice(0, parseInt(perPage)).map(o => {
                  const isNotAssigned = o.deliveryStatus === 'Not Assigned';
                  
                  // Status badge helper colors
                  let statusStyle = 'bg-gray-50 text-gray-500 border-gray-150';
                  if (o.status === 'Scheduled') statusStyle = 'bg-amber-50 text-amber-700 border-amber-100';
                  if (o.status === 'Received') statusStyle = 'bg-sky-50 text-sky-700 border-sky-100';
                  if (o.status === 'Delivered') statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';

                  return (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Order ID */}
                      <td className="px-5 py-4 text-[#0B1528] font-extrabold tabular-nums select-all whitespace-nowrap">
                        {o.id}
                      </td>

                      {/* Customer name */}
                      <td className="px-5 py-4 text-gray-900 select-text">
                        {o.customer}
                      </td>

                      {/* Address */}
                      <td className="px-5 py-4 text-gray-400 font-medium max-w-[200px] truncate select-text">
                        {o.address}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-gray-400 font-extrabold tabular-nums select-none whitespace-nowrap">
                        {o.date}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 select-none">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusStyle}`}>
                          {o.status}
                        </span>
                      </td>

                      {/* Delivery Boy status badge */}
                      <td className="px-5 py-4 select-none">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isNotAssigned 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {o.deliveryStatus}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 text-gray-950 font-black tabular-nums whitespace-nowrap">
                        ₹{o.amount.toFixed(2)}
                      </td>

                      {/* View Action */}
                      <td className="px-5 py-4 text-center select-none">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="border border-[#0B1528] hover:bg-gray-50 text-[#0B1528] p-1.5 rounded-lg shadow-2xs transition-all inline-flex items-center justify-center"
                        >
                          <Eye size={13} className="stroke-[2.5]" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* CENTERED React Portal MODAL: ORDER DETAILS INVOICE RECEIPT */}
      {selectedOrder && createPortal(
        <div className="fixed inset-0 bg-[#0B1528]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] select-none animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-250 shadow-2xl max-w-lg w-full overflow-hidden text-left transform scale-100 transition-all">
            
            {/* Invoice Header */}
            <div className="bg-[#0B1528] text-white p-6 flex justify-between items-center select-none">
              <div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">ORDER INVOICE RECEIPT</span>
                <h3 className="text-sm font-black uppercase tracking-wider mt-0.5">{selectedOrder.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Invoice Body content */}
            <div className="p-6 space-y-6 text-xs font-bold text-gray-700 max-h-[80vh] overflow-y-auto">
              
              {/* Order Metadata summary card */}
              <div className="grid grid-cols-2 gap-4 bg-[#F8F9FA] rounded-2xl p-4 border border-gray-100">
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide block">Customer Info</span>
                  <div className="flex items-center gap-1.5 text-gray-900 font-extrabold">
                    <User size={12} className="text-gray-400 shrink-0" />
                    <span>{selectedOrder.customer}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide block">Fulfillment Seller Hub</span>
                  <span className="text-gray-900 font-extrabold block">{selectedOrder.seller}</span>
                </div>
                <div className="col-span-2 space-y-1 pt-2 border-t border-gray-200/60">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide block">Shipping Address Destination</span>
                  <div className="flex items-center gap-1.5 text-gray-900 font-extrabold">
                    <MapPin size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{selectedOrder.address}</span>
                  </div>
                </div>
              </div>

              {/* Items details list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Purchased Catalog Items</h4>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[9px] text-gray-400 font-black uppercase tracking-wider select-none">
                        <th className="px-4 py-2 text-left">Item Name</th>
                        <th className="px-4 py-2 text-center w-16">Qty</th>
                        <th className="px-4 py-2 text-right w-24">Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-extrabold text-gray-900">{item.name}</td>
                          <td className="px-4 py-2.5 text-center font-black tabular-nums">{item.qty}</td>
                          <td className="px-4 py-2.5 text-right font-black tabular-nums">₹{item.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation footer */}
              <div className="flex items-center justify-between border-t border-gray-150 pt-4 select-none">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide block">Date Settled</span>
                  <span className="text-gray-500 font-extrabold">{selectedOrder.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide block">Total Payable</span>
                  <span className="text-base font-black text-indigo-600">₹{selectedOrder.amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Order Status tracking pipeline */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider select-none">Order Status Pipeline</h4>
                <div className="grid grid-cols-4 gap-2 text-center select-none">
                  
                  <div className={`p-2.5 rounded-xl border ${selectedOrder.status === 'Scheduled' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                    <Clock size={14} className="mx-auto mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-wider block">Scheduled</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${selectedOrder.status === 'Received' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                    <FileText size={14} className="mx-auto mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-wider block">Received</span>
                  </div>

                  <div className="p-2.5 rounded-xl border bg-gray-50 text-gray-400 border-gray-100">
                    <Clock size={14} className="mx-auto mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-wider block">Shipped</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${selectedOrder.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                    <CheckCircle size={14} className="mx-auto mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-wider block">Delivered</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal action buttons footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end select-none">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="bg-[#0B1528] hover:bg-[#15253F] text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs transition-all"
              >
                Close Receipt
              </button>
            </div>

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

export default OrdersListManagement;
