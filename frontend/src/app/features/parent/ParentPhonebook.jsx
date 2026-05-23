import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  Building2, 
  GraduationCap, 
  Headphones, 
  MoreHorizontal, 
  Users, 
  User,
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Copy, 
  Check, 
  X,
  ArrowUpDown
} from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import SideMenu from '../../components/SideMenu';

const ParentPhonebook = () => {
  // Header Scroll and SideMenu States
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Administration', 'Academics', 'Support Staff', 'Other Services'
  const [sortOrder, setSortOrder] = useState('A-Z'); // 'A-Z', 'Z-A'
  
  // Expanded Contacts pagination state
  const [showMore, setShowMore] = useState(false);

  // Active Contact Modal details
  const [selectedContact, setSelectedContact] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Student / Child Profile Info
  const [childInfo, setChildInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : {
      name: "Guest",
      school: "Explore Schools",
      grade: "Select Grade",
      rollNo: "Roll Number",
    };
  });

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('childInfo');
      if (saved) setChildInfo(JSON.parse(saved));
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    setScrolled(scrollPos > 50);
  };

  // Contacts Database
  const contactsDatabase = useMemo(() => ({
    important: [
      {
        id: 'imp-1',
        title: 'Principal',
        name: 'Dr. Evelyn Harris',
        role: 'School Administration',
        category: 'Administration',
        phone: '+91 98765 43210',
        email: 'principal@exploreschool.edu',
        avatarBg: 'bg-[#F4EBFF]',
        avatarColor: 'text-[#7F56D9]',
        callBg: 'bg-[#F4EBFF]',
        callColor: 'text-[#6A47DE]'
      },
      {
        id: 'imp-2',
        title: 'Vice Principal',
        name: 'Mr. Ronald Davies',
        role: 'School Administration',
        category: 'Administration',
        phone: '+91 98765 43211',
        email: 'viceprincipal@exploreschool.edu',
        avatarBg: 'bg-[#FFF6ED]',
        avatarColor: 'text-[#F2994A]',
        callBg: 'bg-[#FFF6ED]',
        callColor: 'text-[#F2994A]'
      },
      {
        id: 'imp-3',
        title: 'Front Office',
        name: 'Reception & Helpdesk',
        role: 'School Administration',
        category: 'Administration',
        phone: '+91 98765 43212',
        email: 'info@exploreschool.edu',
        avatarBg: 'bg-[#EBFBF0]',
        avatarColor: 'text-[#34A853]',
        callBg: 'bg-[#EBFBF0]',
        callColor: 'text-[#34A853]'
      }
    ],
    all: [
      {
        id: 'all-1',
        name: 'Academic Coordinator',
        department: 'Academics Department',
        phone: '011-2345678',
        email: 'coordinator.academics@exploreschool.edu',
        category: 'Academics',
        avatarBg: 'bg-[#F4EBFF]',
        avatarColor: 'text-[#7F56D9]'
      },
      {
        id: 'all-2',
        name: 'Account Office',
        department: 'Finance Department',
        phone: '011-2345679',
        email: 'accounts@exploreschool.edu',
        category: 'Other Services',
        avatarBg: 'bg-[#FFF6ED]',
        avatarColor: 'text-[#F2994A]'
      },
      {
        id: 'all-3',
        name: 'IT Support',
        department: 'IT Department',
        phone: '011-2345680',
        email: 'itsupport@exploreschool.edu',
        category: 'Support Staff',
        avatarBg: 'bg-[#EBFBF0]',
        avatarColor: 'text-[#34A853]'
      },
      {
        id: 'all-4',
        name: 'Transport Incharge',
        department: 'Transport Department',
        phone: '011-2345681',
        email: 'transport@exploreschool.edu',
        category: 'Other Services',
        avatarBg: 'bg-[#E8F0FE]',
        avatarColor: 'text-[#1A73E8]'
      },
      {
        id: 'all-5',
        name: 'School Nurse',
        department: 'Medical Room',
        phone: '011-2345682',
        email: 'medical@exploreschool.edu',
        category: 'Support Staff',
        avatarBg: 'bg-[#FFF0F2]',
        avatarColor: 'text-[#E04F5F]'
      },
      {
        id: 'all-6',
        name: 'Librarian',
        department: 'Library',
        phone: '011-2345683',
        email: 'library@exploreschool.edu',
        category: 'Academics',
        avatarBg: 'bg-[#F4EBFF]',
        avatarColor: 'text-[#7F56D9]'
      },
      {
        id: 'all-7',
        name: 'Admission Office',
        department: 'Administration',
        phone: '011-2345684',
        email: 'admissions@exploreschool.edu',
        category: 'Administration',
        avatarBg: 'bg-[#E8F0FE]',
        avatarColor: 'text-[#1A73E8]'
      },
      {
        id: 'all-8',
        name: 'Sports Coordinator',
        department: 'Physical Education Dept',
        phone: '011-2345685',
        email: 'sports@exploreschool.edu',
        category: 'Academics',
        avatarBg: 'bg-[#EBFBF0]',
        avatarColor: 'text-[#34A853]'
      }
    ]
  }), []);

  // Category Tab Meta
  const tabs = [
    { id: 'All', label: 'All', icon: <Users size={14} /> },
    { id: 'Administration', label: 'Administration', icon: <Building2 size={14} /> },
    { id: 'Academics', label: 'Academics', icon: <GraduationCap size={14} /> },
    { id: 'Support Staff', label: 'Support Staff', icon: <Headphones size={14} /> },
    { id: 'Other Services', label: 'Other Services', icon: <MoreHorizontal size={14} /> }
  ];

  // Filtering + Sorting Engine
  const filteredContacts = useMemo(() => {
    // 1. Filter Important Contacts
    let importantFiltered = contactsDatabase.important;
    if (activeTab !== 'All') {
      importantFiltered = importantFiltered.filter(c => c.category === activeTab);
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      importantFiltered = importantFiltered.filter(
        c => c.title.toLowerCase().includes(query) || 
        c.name.toLowerCase().includes(query) || 
        c.role.toLowerCase().includes(query)
      );
    }

    // 2. Filter All Contacts
    let allFiltered = contactsDatabase.all;
    if (activeTab !== 'All') {
      allFiltered = allFiltered.filter(c => c.category === activeTab);
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      allFiltered = allFiltered.filter(
        c => c.name.toLowerCase().includes(query) || 
        c.department.toLowerCase().includes(query) ||
        c.phone.includes(query)
      );
    }

    // 3. Sort All Contacts
    const sortedAll = [...allFiltered].sort((a, b) => {
      if (sortOrder === 'A-Z') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

    return {
      important: importantFiltered,
      all: sortedAll
    };
  }, [contactsDatabase, searchQuery, activeTab, sortOrder]);

  // Display pagination
  const visibleAllContacts = useMemo(() => {
    if (showMore) return filteredContacts.all;
    return filteredContacts.all.slice(0, 5); // Default display 5 contacts
  }, [filteredContacts.all, showMore]);

  // Copy Clipboard Helper
  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <>
      {/* Side menu navigation drawer */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={childInfo}
      />

      {/* Global AppHeader */}
      <AppHeader
        scrolled={scrolled}
        onMenuClick={() => setIsMenuOpen(true)}
        childInfo={childInfo}
        transparentAtTop={false}
      />

      <div 
        onScroll={handleScroll}
        className="flex flex-col h-full bg-[#FAFAFC] pb-24 overflow-y-auto overflow-x-hidden w-full font-outfit relative"
      >
        {/* Sticky AppHeader Spacer */}
        <div className="h-[140px] shrink-0"></div>

        {/* 1. Search and Filter Panel */}
        <div className="px-6 mt-4 flex items-center gap-3 relative z-20">
          <div className="flex-1 bg-white border border-gray-100/80 rounded-2xl flex items-center px-3.5 py-2.5 shadow-sm focus-within:border-deep-purple/35 transition-all">
            <Search size={16} className="text-gray-400 shrink-0 mr-2" />
            <input 
              type="text"
              placeholder="Search by name, role or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-gray-700 w-full placeholder-gray-400"
            />
          </div>
          <button 
            onClick={() => setActiveTab('All')}
            className="px-4 py-2.5 bg-white border border-gray-100 rounded-2xl flex items-center gap-1.5 text-xs font-black text-gray-600 shadow-sm active:scale-95 transition-all hover:border-gray-200"
          >
            <Filter size={14} className="text-[#6A47DE]" />
            <span>Filter</span>
          </button>
        </div>

        {/* 2. Scrollable Category Tab Bar */}
        <div className="px-6 mt-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2.5 min-w-max pb-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-extrabold border transition-all duration-300 ${
                    isActive
                      ? 'bg-[#F4EBFF] border-[#E9D7FE] text-[#7F56D9] shadow-sm'
                      : 'bg-white border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Important Contacts Dashboard */}
        {filteredContacts.important.length > 0 && (
          <div className="mt-6 px-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                Important Contacts
              </h2>
              <button 
                onClick={() => {
                  setActiveTab('Administration');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-[#6A47DE] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {filteredContacts.important.map((contact) => (
                <div 
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col items-center text-center shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-gray-200/50 transition-all duration-300 cursor-pointer"
                >
                  {/* Round avatar container */}
                  <div className={`w-11 h-11 rounded-2xl ${contact.avatarBg} ${contact.avatarColor} flex items-center justify-center mb-2.5 shrink-0 border border-black/[0.01]`}>
                    <User size={20} />
                  </div>
                  
                  <span className="text-[11px] font-black text-gray-800 line-clamp-1 leading-tight">
                    {contact.title}
                  </span>
                  
                  <span className="text-[9px] font-semibold text-gray-400 line-clamp-1 mt-0.5">
                    {contact.role}
                  </span>

                  {/* Circle Dialer trigger */}
                  <div className={`w-7 h-7 rounded-full ${contact.callBg} ${contact.callColor} flex items-center justify-center mt-3 shadow-sm hover:scale-105 active:scale-95 transition-all`}>
                    <Phone size={11} className="fill-current" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. All Contacts List Section */}
        <div className="mt-6 px-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              All Contacts
            </h2>
            <button 
              onClick={() => setSortOrder(sortOrder === 'A-Z' ? 'Z-A' : 'A-Z')}
              className="text-[10px] font-black text-gray-500 hover:text-gray-700 flex items-center gap-1 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl shadow-sm"
            >
              <ArrowUpDown size={11} />
              <span>Sort: {sortOrder}</span>
            </button>
          </div>

          {visibleAllContacts.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm py-12">
              <Users size={36} className="text-gray-300 mb-2" />
              <h4 className="text-xs font-extrabold text-gray-700">No Contacts Found</h4>
              <p className="text-[9.5px] font-bold text-gray-400 mt-1 max-w-[200px] leading-normal">
                There are no school directories matching your search query. Try another keyword or reset active filters.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleAllContacts.map((contact) => (
                <div 
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-gray-200/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Circle avatar badge */}
                    <div className={`w-10 h-10 rounded-2xl ${contact.avatarBg} ${contact.avatarColor} flex items-center justify-center shrink-0`}>
                      <User size={18} />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-gray-800 truncate leading-snug">
                        {contact.name}
                      </h4>
                      <p className="text-[9.5px] font-bold text-gray-400 mt-0.5 truncate">
                        {contact.department}
                      </p>
                      <span className="text-[9px] font-extrabold text-[#6A47DE] mt-1 block">
                        {contact.phone}
                      </span>
                    </div>
                  </div>

                  {/* Circle Actions Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a 
                      href={`tel:${contact.phone}`} 
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 text-gray-500 active:scale-90 transition-all"
                    >
                      <Phone size={12} className="text-[#6A47DE]" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View More pagination toggler */}
          {filteredContacts.all.length > 5 && (
            <button 
              onClick={() => setShowMore(!showMore)}
              className="mt-2 text-[10px] font-black text-[#6A47DE] hover:text-[#5532C8] flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-all shadow-sm shadow-[#6A47DE]/2"
            >
              <span>{showMore ? 'View Less Contacts' : 'View More Contacts'}</span>
              {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* 5. Footer Connect Banner */}
        <div className="px-6 mt-6">
          <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-3xl p-5 flex gap-4 shadow-sm shadow-[#6A47DE]/2 relative overflow-hidden">
            {/* Safety shield check icon */}
            <div className="w-10 h-10 rounded-2xl bg-[#E8D7FE] flex items-center justify-center text-[#7F56D9] shrink-0 shadow-sm border border-[#D6BBFB]/30">
              <ShieldCheck size={18} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-gray-800 tracking-tight leading-snug">
                Connect with the Right People
              </h3>
              <p className="text-[10px] font-bold text-gray-500 leading-relaxed mt-1">
                Easily reach out to school departments and staff for any queries or support.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Dynamic Contact Detail Slide-up Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] animate-fade-in">
          {/* Backdrop Dismiss trigger */}
          <div 
            onClick={() => setSelectedContact(null)} 
            className="absolute inset-0 bg-transparent" 
          />

          <div className="bg-white border-t border-gray-100 rounded-t-[32px] w-full max-w-md shadow-2xl p-6 relative z-10 animate-slide-up pb-10">
            {/* Horizontal drag bar decorative indicator */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* Dismiss Cross */}
            <button 
              onClick={() => setSelectedContact(null)}
              className="absolute right-6 top-6 w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>

            {/* Avatar Header Block */}
            <div className="flex items-center gap-4 mt-2">
              <div className={`w-14 h-14 rounded-2xl ${selectedContact.avatarBg || selectedContact.bgColor} ${selectedContact.avatarColor || selectedContact.iconColor} flex items-center justify-center shrink-0 border border-black/[0.01] shadow-sm`}>
                <User size={28} />
              </div>
              <div className="min-w-0">
                <span className="px-2 py-0.5 rounded-lg bg-[#F4EBFF] text-[#7F56D9] text-[8px] font-black uppercase tracking-wider">
                  {selectedContact.category}
                </span>
                <h3 className="text-sm font-black text-gray-800 tracking-tight leading-snug mt-1.5">
                  {selectedContact.name || selectedContact.title}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                  {selectedContact.department || selectedContact.role}
                </p>
              </div>
            </div>

            {/* Details and fields section */}
            <div className="mt-6 flex flex-col gap-3.5">
              
              {/* Phone Field */}
              <div className="bg-gray-50 rounded-2xl p-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 block">Phone Number</span>
                  <span className="text-xs font-black text-gray-700 mt-1 block">
                    {selectedContact.phone}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCopy(selectedContact.phone, 'phone')}
                    className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all active:scale-90"
                    title="Copy Phone"
                  >
                    {copiedField === 'phone' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                  
                  <a 
                    href={`tel:${selectedContact.phone}`}
                    className="w-8 h-8 rounded-xl bg-[#6A47DE] text-white flex items-center justify-center hover:bg-[#5532C8] transition-all active:scale-90"
                  >
                    <Phone size={12} className="fill-current" />
                  </a>
                </div>
              </div>

              {/* Email Field (if present) */}
              {selectedContact.email && (
                <div className="bg-gray-50 rounded-2xl p-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 block">Email Address</span>
                    <span className="text-xs font-black text-gray-700 mt-1 block truncate">
                      {selectedContact.email}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleCopy(selectedContact.email, 'email')}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all active:scale-90"
                      title="Copy Email"
                    >
                      {copiedField === 'email' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                    
                    <a 
                      href={`mailto:${selectedContact.email}`}
                      className="w-8 h-8 rounded-xl bg-[#6A47DE] text-white flex items-center justify-center hover:bg-[#5532C8] transition-all active:scale-90"
                    >
                      <MessageSquare size={12} className="fill-current" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Quick alert reminder */}
            <p className="text-[9px] font-bold text-gray-400 text-center leading-normal mt-5 max-w-[280px] mx-auto">
              Please contact academic staff only during standard school operational timings (08:00 AM - 04:00 PM).
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ParentPhonebook;
