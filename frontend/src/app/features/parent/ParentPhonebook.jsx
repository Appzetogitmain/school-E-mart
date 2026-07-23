import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Phone,
  MessageSquare,
  GraduationCap,
  Users,
  User,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  X,
  ArrowUpDown,
  BookOpen,
  Star,
} from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import LoginRequired from '../../components/LoginRequired';
import { listPhonebookContacts } from '../../../services/schoolApi';
import { getChildInfoFromStorage } from '../../../utils/parentContext';
import { getErrorMessage } from '../../../utils/apiHelpers';

const avatarPalettes = [
  { avatarBg: 'bg-[#F4EBFF]', avatarColor: 'text-[#7F56D9]', callBg: 'bg-[#F4EBFF]', callColor: 'text-[#6A47DE]' },
  { avatarBg: 'bg-[#FFF6ED]', avatarColor: 'text-[#F2994A]', callBg: 'bg-[#FFF6ED]', callColor: 'text-[#F2994A]' },
  { avatarBg: 'bg-[#EBFBF0]', avatarColor: 'text-[#34A853]', callBg: 'bg-[#EBFBF0]', callColor: 'text-[#34A853]' },
  { avatarBg: 'bg-[#E8F0FE]', avatarColor: 'text-[#1A73E8]', callBg: 'bg-[#E8F0FE]', callColor: 'text-[#1A73E8]' },
];

const emergencyPalette = { avatarBg: 'bg-[#FEECEC]', avatarColor: 'text-[#E5484D]', callBg: 'bg-[#FEECEC]', callColor: 'text-[#E5484D]' };

const ParentPhonebook = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Teachers' | 'Emergency'
  const [sortOrder, setSortOrder] = useState('A-Z');
  const [showMore, setShowMore] = useState(false);

  const [selectedContact, setSelectedContact] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const [childInfo, setChildInfo] = useState(() => {
    const saved = localStorage.getItem('childInfo');
    return saved ? JSON.parse(saved) : {
      name: 'Guest',
      school: 'Explore Schools',
      grade: 'Select Grade',
      rollNo: 'Roll Number',
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

  const handleScroll = (e) => setScrolled(e.target.scrollTop > 50);

  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const [contacts, setContacts] = useState({ teachers: [], emergency: [], general: [] });

  useEffect(() => {
    let cancelled = false;
    const info = getChildInfoFromStorage();
    const schoolId = info?.schoolId;
    const studentId = info?.studentId;

    if (!schoolId || schoolId === 'explore-schools') {
      setContacts({ teachers: [], emergency: [], general: [] });
      setContactsLoading(false);
      return undefined;
    }

    setContactsLoading(true);
    setContactsError('');

    listPhonebookContacts(schoolId, studentId)
      .then((data) => {
        if (!cancelled) setContacts(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setContacts({ teachers: [], emergency: [], general: [] });
          setContactsError(getErrorMessage(err, 'Unable to load contacts'));
        }
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Normalise teachers + school numbers into one shape the UI can render
  const allContacts = useMemo(() => {
    const teacherContacts = (contacts.teachers || []).map((t, index) => {
      const palette = avatarPalettes[index % avatarPalettes.length];
      const subjectLine = (t.subjects || []).join(', ');
      return {
        id: t.id || `teacher-${index}`,
        kind: 'teacher',
        category: 'Teachers',
        name: t.name || 'Teacher',
        title: t.role || (t.isClassTeacher ? 'Class Teacher' : 'Subject Teacher'),
        role: subjectLine || t.designation || 'Teacher',
        department: subjectLine ? `Teaches ${subjectLine}` : (t.designation || 'School Staff'),
        phone: t.phone || '',
        email: t.email || '',
        isClassTeacher: Boolean(t.isClassTeacher),
        ...palette,
      };
    });

    const numberContacts = [
      ...(contacts.emergency || []).map((e) => ({ ...e, _cat: 'emergency' })),
      ...(contacts.general || []).map((e) => ({ ...e, _cat: 'general' })),
    ].map((e, index) => ({
      id: e._id || `number-${index}`,
      kind: 'number',
      category: 'Emergency',
      isEmergency: e._cat === 'emergency',
      name: e.name || 'Contact',
      title: e.name || 'Contact',
      role: e.designation || (e._cat === 'emergency' ? 'Emergency' : 'Helpline'),
      department: e.designation || (e._cat === 'emergency' ? 'Emergency Service' : 'School Helpline'),
      phone: e.phone || '',
      email: e.email || '',
      ...emergencyPalette,
    }));

    return { teacherContacts, numberContacts };
  }, [contacts]);

  const tabs = [
    { id: 'All', label: 'All', icon: <Users size={14} /> },
    { id: 'Teachers', label: 'Teachers', icon: <GraduationCap size={14} /> },
    { id: 'Emergency', label: 'Emergency', icon: <ShieldAlert size={14} /> },
  ];

  // Important = class teacher(s) + emergency numbers, shown as a quick-access grid
  const importantContacts = useMemo(() => {
    const classTeachers = allContacts.teacherContacts.filter((c) => c.isClassTeacher);
    const emergency = allContacts.numberContacts.filter((c) => c.isEmergency);
    return [...classTeachers, ...emergency].slice(0, 6);
  }, [allContacts]);

  const listContacts = useMemo(() => {
    let list = [...allContacts.teacherContacts, ...allContacts.numberContacts];

    if (activeTab === 'Teachers') list = allContacts.teacherContacts;
    else if (activeTab === 'Emergency') list = allContacts.numberContacts;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }

    return [...list].sort((a, b) =>
      sortOrder === 'A-Z' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }, [allContacts, activeTab, searchQuery, sortOrder]);

  const visibleContacts = useMemo(
    () => (showMore ? listContacts : listContacts.slice(0, 6)),
    [listContacts, showMore]
  );

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isGuest = !localStorage.getItem('childInfo');

  if (isGuest) {
    return (
      <>
        <AppHeader scrolled={scrolled} onMenuClick={() => setIsMenuOpen(true)} childInfo={null} transparentAtTop={false} />
        <div className="flex flex-col h-full bg-white pb-32 font-outfit overflow-y-auto">
          <div className="h-[140px] shrink-0"></div>
          <LoginRequired
            title="Phonebook Protected"
            message="Please login to view your class teacher, subject teachers and school emergency numbers."
          />
        </div>
      </>
    );
  }

  const showImportant = importantContacts.length > 0 && activeTab === 'All' && searchQuery.trim() === '';

  return (
    <>
      <AppHeader scrolled={scrolled} onMenuClick={() => setIsMenuOpen(true)} childInfo={childInfo} transparentAtTop={false} />

      <div
        onScroll={handleScroll}
        className="flex flex-col h-full bg-[#FAFAFC] pb-24 overflow-y-auto overflow-x-hidden w-full font-outfit relative"
      >
        <div className="h-[140px] shrink-0"></div>

        {/* Search + Filter */}
        <div className="px-6 mt-4 flex items-center gap-3 relative z-20">
          <div className="flex-1 bg-white border border-gray-100/80 rounded-2xl flex items-center px-3.5 py-2.5 shadow-sm focus-within:border-deep-purple/35 transition-all">
            <Search size={16} className="text-gray-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search teachers or numbers..."
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

        {/* Tabs */}
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

        {contactsError && (
          <div className="px-6 mt-4">
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-center">
              <span className="text-[11px] font-bold text-rose-500">{contactsError}</span>
            </div>
          </div>
        )}

        {/* Important quick-access */}
        {showImportant && (
          <div className="mt-6 px-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">Quick Access</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {importantContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col items-center text-center shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-gray-200/50 transition-all duration-300 cursor-pointer"
                >
                  <div className={`w-11 h-11 rounded-2xl ${contact.avatarBg} ${contact.avatarColor} flex items-center justify-center mb-2.5 shrink-0 border border-black/[0.01]`}>
                    {contact.kind === 'number' ? <ShieldAlert size={20} /> : <User size={20} />}
                  </div>
                  <span className="text-[11px] font-black text-gray-800 line-clamp-1 leading-tight">{contact.title}</span>
                  <span className="text-[9px] font-semibold text-gray-400 line-clamp-1 mt-0.5">{contact.name}</span>
                  <div className={`w-7 h-7 rounded-full ${contact.callBg} ${contact.callColor} flex items-center justify-center mt-3 shadow-sm`}>
                    <Phone size={11} className="fill-current" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All contacts list */}
        <div className="mt-6 px-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              {activeTab === 'Teachers' ? 'My Teachers' : activeTab === 'Emergency' ? 'Emergency & Helpline' : 'All Contacts'}
            </h2>
            <button
              onClick={() => setSortOrder(sortOrder === 'A-Z' ? 'Z-A' : 'A-Z')}
              className="text-[10px] font-black text-gray-500 hover:text-gray-700 flex items-center gap-1 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl shadow-sm"
            >
              <ArrowUpDown size={11} />
              <span>Sort: {sortOrder}</span>
            </button>
          </div>

          {contactsLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-3xl p-4 h-[76px] animate-pulse" />
              ))}
            </div>
          ) : visibleContacts.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm py-12">
              <Users size={36} className="text-gray-300 mb-2" />
              <h4 className="text-xs font-extrabold text-gray-700">No Contacts Found</h4>
              <p className="text-[9.5px] font-bold text-gray-400 mt-1 max-w-[220px] leading-normal">
                {activeTab === 'Teachers'
                  ? 'No teachers are assigned to your class yet. Please check back later.'
                  : 'No numbers match your search. Try another keyword or reset the filter.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-gray-200/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl ${contact.avatarBg} ${contact.avatarColor} flex items-center justify-center shrink-0`}>
                      {contact.kind === 'number' ? <ShieldAlert size={18} /> : <User size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-gray-800 truncate leading-snug">{contact.name}</h4>
                        {contact.isClassTeacher && <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />}
                      </div>
                      <p className="text-[9.5px] font-bold text-gray-400 mt-0.5 truncate flex items-center gap-1">
                        {contact.kind === 'teacher' && <BookOpen size={9} className="shrink-0" />}
                        {contact.kind === 'teacher' ? `${contact.title}${contact.role && contact.role !== contact.title ? ` · ${contact.role}` : ''}` : contact.role}
                      </p>
                      <span className="text-[9px] font-extrabold text-[#6A47DE] mt-1 block">{contact.phone}</span>
                    </div>
                  </div>
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

          {listContacts.length > 6 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="mt-2 text-[10px] font-black text-[#6A47DE] hover:text-[#5532C8] flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-all shadow-sm"
            >
              <span>{showMore ? 'View Less' : 'View More'}</span>
              {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Footer banner */}
        <div className="px-6 mt-6">
          <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-3xl p-5 flex gap-4 shadow-sm relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-[#E8D7FE] flex items-center justify-center text-[#7F56D9] shrink-0 shadow-sm border border-[#D6BBFB]/30">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-gray-800 tracking-tight leading-snug">Only your class contacts</h3>
              <p className="text-[10px] font-bold text-gray-500 leading-relaxed mt-1">
                You only see the teachers assigned to your child's class, plus the school's emergency numbers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact detail modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-[2px] animate-fade-in">
          <div onClick={() => setSelectedContact(null)} className="absolute inset-0 bg-transparent" />
          <div className="bg-white border-t border-gray-100 rounded-t-[32px] w-full max-w-md shadow-2xl p-6 relative z-10 animate-slide-up pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <button
              onClick={() => setSelectedContact(null)}
              className="absolute right-6 top-6 w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-4 mt-2">
              <div className={`w-14 h-14 rounded-2xl ${selectedContact.avatarBg} ${selectedContact.avatarColor} flex items-center justify-center shrink-0 border border-black/[0.01] shadow-sm`}>
                {selectedContact.kind === 'number' ? <ShieldAlert size={28} /> : <User size={28} />}
              </div>
              <div className="min-w-0">
                <span className="px-2 py-0.5 rounded-lg bg-[#F4EBFF] text-[#7F56D9] text-[8px] font-black uppercase tracking-wider">
                  {selectedContact.kind === 'teacher' ? selectedContact.title : selectedContact.category}
                </span>
                <h3 className="text-sm font-black text-gray-800 tracking-tight leading-snug mt-1.5">{selectedContact.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">{selectedContact.department}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3.5">
              <div className="bg-gray-50 rounded-2xl p-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 block">Phone Number</span>
                  <span className="text-xs font-black text-gray-700 mt-1 block">{selectedContact.phone}</span>
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

              {selectedContact.email && (
                <div className="bg-gray-50 rounded-2xl p-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 block">Email Address</span>
                    <span className="text-xs font-black text-gray-700 mt-1 block truncate">{selectedContact.email}</span>
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

            <p className="text-[9px] font-bold text-gray-400 text-center leading-normal mt-5 max-w-[280px] mx-auto">
              Please contact teachers only during standard school hours (08:00 AM - 04:00 PM).
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ParentPhonebook;
