import React from 'react';
import {
  User, Layers, Box, Clipboard, CheckCircle, XCircle, AlertTriangle, TrendingDown, MapPin, Award,
  Eye, ChevronLeft, ChevronRight
} from 'lucide-react';

const SuperAdminDashboard = () => {

  // Dashboard stats cleared to zero for dynamic live state
  const stats = [
    {
      label: 'Total User',
      value: '0',
      icon: User,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      label: 'Total Category',
      value: '0',
      icon: Layers,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      label: 'Total Subcategory',
      value: '0',
      icon: Layers,
      color: 'bg-pink-50 text-pink-600 border-pink-100',
    },
    {
      label: 'Total Product',
      value: '0',
      icon: Box,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      label: 'Total Orders',
      value: '0',
      icon: Clipboard,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      label: 'Completed Orders',
      value: '0',
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      label: 'Pending Orders',
      value: '0',
      icon: Clipboard,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      label: 'Cancelled Orders',
      value: '0',
      icon: XCircle,
      color: 'bg-red-50 text-red-600 border-red-100',
    },
    {
      label: 'Product Sold Out',
      value: '0',
      icon: Box,
      color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
    },
    {
      label: 'Product low on Stock',
      value: '0',
      icon: AlertTriangle,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    }
  ];

  // June 2026 days helper for left chart
  const juneDays = Array.from({ length: 30 }, (_, i) => `${String(i + 1).padStart(2, '0')}-Jun`);

  // Year 2026 months helper for right chart
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-8 pb-8 font-sans">

      {/* Page Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Console Overview</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Real-time status indicators and operations summary</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            System Live
          </span>
          <span className="text-[11px] text-gray-400 font-semibold">Last updated: Just now</span>
        </div>
      </div>

      {/* 1. GRID CARDS SECTION (CLEARED TO 0) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-[1.25rem] border border-gray-200 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${stat.color} transition-transform group-hover:scale-105 duration-200`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <div className="mt-4 leading-tight">
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">{stat.label}</span>
                <span className="text-2xl font-black text-gray-950 block mt-1 tracking-tight">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. SALES CHARTS & SIDEBAR DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Total Sales Chart panel */}
        <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="leading-tight">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">Total Sales Today</span>
              <span className="text-3xl font-black text-gray-950 block mt-1.5 tracking-tight">₹0.00</span>
              <span className="text-gray-400 text-xs font-bold flex items-center gap-1.5 mt-2">
                <TrendingDown size={14} className="text-gray-300" />
                <span>₹0.00 vs same day last week</span>
              </span>
            </div>

            {/* Chart Legend indicators */}
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>This Month</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span>Last Month</span>
              </div>
            </div>
          </div>

          {/* SVG Custom Sales Graph matching mockup */}
          <div className="h-60 mt-6 relative flex items-end">
            <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="600" y2="50" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#F1F5F9" strokeWidth="1" />

              {/* Flat Last Month line at 0 (bottom y=198) */}
              <line x1="0" y1="198" x2="600" y2="198" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="4 4" />

              {/* Flat This Month line at 0 (bottom y=198) */}
              <line x1="0" y1="198" x2="600" y2="198" stroke="#3B82F6" strokeWidth="3" />
            </svg>

            {/* Axis Y Values labels */}
            <div className="absolute left-2 top-0 h-full flex flex-col justify-between text-[9px] font-black text-gray-400/80 pointer-events-none select-none">
              <span>₹3,000</span>
              <span>₹2,000</span>
              <span>₹1,000</span>
              <span>₹0</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mini Panels Group */}
        <div className="space-y-6">

          {/* Sales By Location card */}
          <div className="bg-white rounded-[1.5rem] border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Sales by Location</h3>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <MapPin size={16} className="text-gray-400" />
                <span>Indore</span>
              </div>
              <span className="font-extrabold text-sm text-gray-900">₹0.00</span>
            </div>
          </div>

          {/* Average Order Value Card */}
          <div className="bg-white rounded-[1.5rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Avg. Completed Order Value</h3>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Award size={24} />
                </div>
                <div>
                  <span className="text-2xl font-black text-gray-950 tracking-tight">₹0.00</span>
                  <span className="text-[10px] font-bold text-gray-400 block mt-0.5">No completed orders yet</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. ORDER CHARTS ROW (CLEARED / FLAT STATS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">

        {/* Left Chart: Order - Jun 2026 (Flat line) */}
        <div className="bg-white rounded-[1.25rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
          <h2 className="text-base font-black text-gray-900 tracking-tight mb-4">Order - Jun 2026</h2>

          <div className="flex-1 flex items-stretch">
            {/* Y axis labels */}
            <div className="w-6 flex flex-col justify-between text-[10px] font-bold text-gray-400 text-right pr-2">
              <span>5</span>
              <span>4</span>
              <span>3</span>
              <span>2</span>
              <span>1</span>
              <span>0</span>
            </div>

            {/* SVG Plotting */}
            <div className="flex-1 border-b border-l border-gray-100 relative flex items-end pb-1 pl-1">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Horizontal grid guide lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="160" x2="500" y2="160" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />

                {/* June flat order line at Y=0 */}
                <line x1="0" y1="198" x2="500" y2="198" stroke="#8B5CF6" strokeWidth="3" />
              </svg>
            </div>
          </div>

          {/* Tilted X axis labels */}
          <div className="h-14 ml-6 overflow-hidden relative mt-2">
            <div className="flex justify-between w-full text-[8px] font-bold text-gray-400/90 whitespace-nowrap">
              {juneDays.map((day, idx) => (
                <div key={idx} className="w-[14px] origin-top-left rotate-[45deg] translate-y-2 translate-x-1">
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chart: Order - 2026 (Flat line) */}
        <div className="bg-white rounded-[1.25rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
          <h2 className="text-base font-black text-gray-900 tracking-tight mb-4">Order - 2026</h2>

          <div className="flex-1 flex items-stretch">
            {/* Y axis labels */}
            <div className="w-6 flex flex-col justify-between text-[10px] font-bold text-gray-400 text-right pr-2">
              <span>87</span>
              <span>67</span>
              <span>47</span>
              <span>27</span>
              <span>7</span>
              <span>-13</span>
            </div>

            {/* SVG Plotting */}
            <div className="flex-1 border-b border-l border-gray-100 relative flex items-end pb-1 pl-1">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Horizontal grid guide lines */}
                <line x1="0" y1="33" x2="500" y2="33" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="66" x2="500" y2="66" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="99" x2="500" y2="99" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="132" x2="500" y2="132" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="165" x2="500" y2="165" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />

                {/* Flat order line at Y=0 (bottom y=165) */}
                <line x1="0" y1="165" x2="500" y2="165" stroke="#8B5CF6" strokeWidth="3" />
              </svg>
            </div>
          </div>

          {/* Tilted X axis labels */}
          <div className="h-14 ml-6 overflow-hidden relative mt-2">
            <div className="flex justify-between w-full text-[9px] font-bold text-gray-400/90 whitespace-nowrap pl-2 pr-4">
              {months.map((month, idx) => (
                <div key={idx} className="w-[30px] origin-top-left rotate-[45deg] translate-y-3 translate-x-1">
                  {month}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. TABLES ROW (SHOWING CLEAN EMPTY STATES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">

        {/* Left Table: View New Orders */}
        <div className="bg-white rounded-[1.25rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h2 className="text-base font-black text-gray-900 tracking-tight">View New Orders</h2>

            {/* Show entries control */}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <span>Show</span>
              <select className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar min-h-[220px]">
            <table className="w-full text-left text-xs font-medium text-gray-600 border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">User Details</th>
                  <th className="py-3 px-2">O. Date</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="py-16 text-center text-xs font-bold text-gray-400 tracking-wide">
                    No records found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table pagination footer controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 text-xs font-bold text-gray-500">
            <span>Showing 0 to 0 of 0 entries</span>

            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400" disabled>
                <ChevronLeft size={14} />
              </button>
              <button className="w-7 h-7 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center" disabled>
                0
              </button>
              <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400" disabled>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Table: View Top Seller */}
        <div className="bg-white rounded-[1.25rem] border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h2 className="text-base font-black text-gray-900 tracking-tight">View Top Seller</h2>

            {/* Show entries control */}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <span>Show</span>
              <select className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar flex-1 min-h-[220px]">
            <table className="w-full text-left text-xs font-medium text-gray-600 border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">Seller Name</th>
                  <th className="py-3 px-2">Store Name</th>
                  <th className="py-3 px-2">Total Revenue</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="py-16 text-center text-xs font-bold text-gray-400 tracking-wide">
                    No records found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table pagination footer controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 text-xs font-bold text-gray-500 shrink-0">
            <span>Showing 0 to 0 of 0 entries</span>

            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400" disabled>
                <ChevronLeft size={14} />
              </button>
              <button className="w-7 h-7 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center" disabled>
                0
              </button>
              <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400" disabled>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 5. FOOTER COPYRIGHT */}
      <footer className="text-center text-xs font-bold text-gray-400 pt-8 border-t border-gray-200/60 mt-6 shrink-0">
        Copyright © 2026. Developed By School E Mart
      </footer>

    </div>
  );
};

export default SuperAdminDashboard;
