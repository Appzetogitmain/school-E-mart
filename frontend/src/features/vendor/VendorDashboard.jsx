import React from 'react';
import { 
  Download, Plus, TrendingUp, TrendingDown, ClipboardList, CheckCircle2, 
  Clock, XCircle, Wallet, ArrowRight, Star, BellRing, FileText
} from 'lucide-react';

const VendorDashboard = () => {
  // Mock Data
  const recentOrders = [
    { id: 'ORD-2026-0528', school: 'Gyan Public School', amount: '₹12,450', status: 'Processing', statusColor: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'ORD-2026-0527', school: 'Bright Future School', amount: '₹8,750', status: 'Shipped', statusColor: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'ORD-2026-0526', school: 'Little Angels School', amount: '₹15,200', status: 'Delivered', statusColor: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'ORD-2026-0525', school: 'Sunrise Public School', amount: '₹5,600', status: 'Pending', statusColor: 'bg-amber-50 text-amber-600 border-amber-100' },
  ];

  const quotations = [
    { title: 'Uniform Requirement 2026-27', school: 'Shining Star School', due: 'Due in 2 days', status: 'New', statusColor: 'bg-blue-50 text-blue-600 border-blue-100' },
    { title: 'Sports Kit Requirement', school: 'Green Field School', due: 'Due in 3 days', status: 'New', statusColor: 'bg-blue-50 text-blue-600 border-blue-100' },
    { title: 'Winter Uniform Requirement', school: 'Kids World School', due: 'Due in 5 days', status: 'In Progress', statusColor: 'bg-amber-50 text-amber-600 border-amber-100' },
    { title: 'School Bag Requirement', school: 'Cambridge School', due: 'Due in 7 days', status: 'Pending', statusColor: 'bg-gray-50 text-gray-500 border-gray-100' },
  ];

  const topProducts = [
    { name: 'School Shirt (Blue)', sales: '512 Units Sold', revenue: '₹1,02,400', image: '👕' },
    { name: 'School Trousers (Grey)', sales: '398 Units Sold', revenue: '₹87,560', image: '👖' },
    { name: 'School Bag', sales: '287 Units Sold', revenue: '₹71,750', image: '🎒' }
  ];

  const announcements = [
    { title: 'New Feature Update', desc: 'You can now create custom catalog for schools.', date: '22 May 2026', icon: BellRing, iconColor: 'text-purple-600 bg-purple-50' },
    { title: 'System Maintenance', desc: 'Our system will be under maintenance on 25 May 2026 from 12:00 AM to 2:00 AM.', date: '21 May 2026', icon: Clock, iconColor: 'text-emerald-600 bg-emerald-50' }
  ];

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. GREETING & QUICK ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2">
            Welcome back, Ankit! 👋
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1.5">
            Here's what's happening with your business today.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#5B3FD6]/20 bg-white text-[#5B3FD6] hover:bg-[#5B3FD6]/5 text-xs font-bold transition-all shadow-sm active:scale-95">
            <Download size={14} /> Download Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B3FD6] text-white hover:bg-[#472fc2] text-xs font-bold transition-all shadow-md shadow-purple-200 active:scale-95">
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        
        {/* Metric 1 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <ClipboardList size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-gray-900">98</span>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 mt-1.5">
              <TrendingUp size={10} /> +18% this month
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Completed Orders</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-gray-900">50</span>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 mt-1.5">
              <TrendingUp size={10} /> +12% this month
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-gray-900">4</span>
            <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5 mt-1.5">
              <TrendingDown size={10} /> -2% this month
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cancelled Orders</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-gray-900">4</span>
            <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5 mt-1.5">
              <TrendingDown size={10} /> -1% this month
            </span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl md:text-2xl font-black text-gray-900 truncate block">₹1,45,320</span>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 mt-1.5">
              <TrendingUp size={10} /> +22% this month
            </span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Wallet Balance</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl md:text-2xl font-black text-gray-900 truncate block">₹12,450</span>
            <button className="text-[10px] font-extrabold text-[#5B3FD6] hover:underline flex items-center gap-0.5 mt-2 text-left">
              View Wallet →
            </button>
          </div>
        </div>

      </div>

      {/* 3. CORE WIDGETS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Widget */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50 shrink-0">
            <h2 className="font-extrabold text-sm text-gray-800">Recent Orders</h2>
            <button className="text-xs font-bold text-[#5B3FD6] hover:underline">View All</button>
          </div>
          <div className="flex-1 mt-4 space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-xs p-1 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <ClipboardList size={16} />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-800">{order.id}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{order.school}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{order.amount}</p>
                  <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1.5 ${order.statusColor}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full text-center py-2.5 mt-4 text-xs font-bold text-[#5B3FD6] hover:text-[#472fc2] bg-purple-50/50 hover:bg-purple-50 rounded-xl transition-all flex items-center justify-center gap-1">
            View All Orders <ArrowRight size={12} />
          </button>
        </div>

        {/* Quotation Requests Widget */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50 shrink-0">
            <h2 className="font-extrabold text-sm text-gray-800">Quotation Requests</h2>
            <button className="text-xs font-bold text-[#5B3FD6] hover:underline">View All</button>
          </div>
          <div className="flex-1 mt-4 space-y-4">
            {quotations.map((req, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-1 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-gray-800 truncate">{req.title}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">{req.school}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-red-500 font-semibold">{req.due}</p>
                  <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1.5 ${req.statusColor}`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full text-center py-2.5 mt-4 text-xs font-bold text-[#5B3FD6] hover:text-[#472fc2] bg-purple-50/50 hover:bg-purple-50 rounded-xl transition-all flex items-center justify-center gap-1">
            View All Quotations <ArrowRight size={12} />
          </button>
        </div>

        {/* Sales Overview Widget */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50 shrink-0">
            <h2 className="font-extrabold text-sm text-gray-800">Sales Overview</h2>
            <select className="text-xs font-bold text-gray-500 border border-gray-100 bg-gray-50 px-2 py-1 rounded-lg outline-none cursor-pointer">
              <option>This Month</option>
              <option>Last 3 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex-1 mt-4 relative flex flex-col justify-end min-h-[180px]">
            {/* Custom SVG Line Chart */}
            <svg viewBox="0 0 300 130" className="w-full h-full">
              {/* Y Axis Grid lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F3F9" strokeWidth="1" strokeDasharray="3" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#F1F3F9" strokeWidth="1" strokeDasharray="3" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#F1F3F9" strokeWidth="1" strokeDasharray="3" />
              <line x1="0" y1="110" x2="300" y2="110" stroke="#F1F3F9" strokeWidth="1" strokeDasharray="3" />
              
              {/* Y Axis text label */}
              <text x="5" y="15" fill="#9BA6B8" fontSize="6" fontWeight="bold">₹40K</text>
              <text x="5" y="45" fill="#9BA6B8" fontSize="6" fontWeight="bold">₹30K</text>
              <text x="5" y="75" fill="#9BA6B8" fontSize="6" fontWeight="bold">₹20K</text>
              <text x="5" y="105" fill="#9BA6B8" fontSize="6" fontWeight="bold">₹10K</text>
              <text x="5" y="125" fill="#9BA6B8" fontSize="6" fontWeight="bold">₹0</text>
              
              {/* Smooth Gradient Area fill below chart line */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B3FD6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#5B3FD6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path 
                d="M 30 110 C 60 90, 90 90, 120 70 C 150 50, 180 50, 210 40 C 240 30, 270 50, 290 65 L 290 110 L 30 110 Z" 
                fill="url(#chartGrad)" 
              />
              
              {/* Chart Line path */}
              <path 
                d="M 30 110 C 60 90, 90 90, 120 70 C 150 50, 180 50, 210 40 C 240 30, 270 50, 290 65" 
                fill="none" 
                stroke="#5B3FD6" 
                strokeWidth="2" 
                strokeLinecap="round" 
              />
              
              {/* Highlight Point */}
              <circle cx="210" cy="40" r="3.5" fill="#5B3FD6" stroke="#FFFFFF" strokeWidth="1" />
              
              {/* Chart Labels */}
              <text x="30" y="128" fill="#9BA6B8" fontSize="6" textAnchor="middle" fontWeight="bold">01 May</text>
              <text x="95" y="128" fill="#9BA6B8" fontSize="6" textAnchor="middle" fontWeight="bold">07 May</text>
              <text x="160" y="128" fill="#9BA6B8" fontSize="6" textAnchor="middle" fontWeight="bold">13 May</text>
              <text x="225" y="128" fill="#9BA6B8" fontSize="6" textAnchor="middle" fontWeight="bold">19 May</text>
              <text x="290" y="128" fill="#9BA6B8" fontSize="6" textAnchor="middle" fontWeight="bold">31 May</text>
            </svg>

            {/* Float Highlight Tag */}
            <div className="absolute top-8 right-12 bg-gray-900 text-white rounded-lg p-1.5 shadow-md flex flex-col text-[8px] leading-tight z-10 pointer-events-none scale-90">
              <span className="font-extrabold">₹32,450</span>
              <span className="text-[7px] text-gray-400 mt-0.5">23 May 2026</span>
            </div>
          </div>
          <button className="w-full text-center py-2.5 mt-4 text-xs font-bold text-[#5B3FD6] hover:text-[#472fc2] bg-purple-50/50 hover:bg-purple-50 rounded-xl transition-all flex items-center justify-center gap-1">
            View Full Report <ArrowRight size={12} />
          </button>
        </div>

      </div>

      {/* 4. CORE WIDGETS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Selling Products */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50 shrink-0">
            <h2 className="font-extrabold text-sm text-gray-800">Top Selling Products</h2>
            <button className="text-xs font-bold text-[#5B3FD6] hover:underline">View All</button>
          </div>
          <div className="flex-1 mt-4 space-y-4">
            {topProducts.map((prod, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs hover:bg-gray-50 rounded-xl p-1 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg shrink-0">
                    {prod.image}
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-800">{prod.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{prod.sales}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900">{prod.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50 shrink-0">
            <h2 className="font-extrabold text-sm text-gray-800">Announcements</h2>
            <button className="text-xs font-bold text-[#5B3FD6] hover:underline">View All</button>
          </div>
          <div className="flex-1 mt-4 space-y-4">
            {announcements.map((announce, idx) => {
              const Icon = announce.icon;
              return (
                <div key={idx} className="flex gap-3.5 hover:bg-gray-50 rounded-xl p-2.5 transition-colors text-xs items-start">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${announce.iconColor}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-gray-800 truncate">{announce.title}</p>
                    <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">{announce.desc}</p>
                    <span className="text-[9px] text-gray-400 font-medium block mt-1.5">{announce.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vendor Performance */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50 shrink-0">
            <h2 className="font-extrabold text-sm text-gray-800">Vendor Performance</h2>
          </div>
          
          <div className="flex-1 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Performance Circular Gauge */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* SVG Semi-Circle Gauge */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    fill="transparent"
                    stroke="#E4E8F1"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth="8"
                    strokeDasharray="276"
                    strokeDashoffset="60"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Inner Info */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-gray-900 flex items-center gap-0.5">
                    4.6
                  </span>
                  <span className="text-[9px] font-bold text-emerald-500 mt-0.5 flex items-center gap-0.5">
                    <Star size={8} className="fill-emerald-500 text-emerald-500" /> Excellent
                  </span>
                  <span className="text-[7px] text-gray-400 mt-0.5">Based on 30 days</span>
                </div>
              </div>
            </div>

            {/* Performance Categories Scores */}
            <div className="space-y-3">
              {[
                { title: 'Order Fulfillment', score: '4.7' },
                { title: 'Product Quality', score: '4.5' },
                { title: 'On-time Delivery', score: '4.6' },
                { title: 'Customer Feedback', score: '4.6' }
              ].map((perf, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium truncate pr-2">{perf.title}</span>
                  <span className="font-extrabold text-gray-800 shrink-0 flex items-center gap-0.5">
                    {perf.score} <Star size={10} className="fill-emerald-500 text-emerald-500" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full text-center py-2.5 mt-4 text-xs font-bold text-[#5B3FD6] hover:text-[#472fc2] bg-purple-50/50 hover:bg-purple-50 rounded-xl transition-all flex items-center justify-center gap-1 shrink-0">
            View Performance Report <ArrowRight size={12} />
          </button>
        </div>

      </div>

    </div>
  );
};

export default VendorDashboard;
