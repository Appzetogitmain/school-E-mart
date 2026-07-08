import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, HelpCircle, Search, SlidersHorizontal,
  Trash2, Play, Plus, BookOpen, GraduationCap,
  FolderOpen, ChevronRight, Sparkles, Users
} from 'lucide-react';
import { listSchoolRfqs } from '../../../services/rfqApi';
import { useSchoolId } from '../../../utils/schoolContext';
import { getErrorMessage } from '../../../utils/apiHelpers';

const mapDraft = (rfq) => {
  const items = rfq.items || [];
  return {
    id: rfq._id,
    title: rfq.title || 'Untitled request',
    category: rfq.category === 'uniform' ? 'Uniform Requests' : (rfq.category || 'Others'),
    classes: (rfq.classes || rfq.targetClasses || []).join(', ') || '—',
    setsCount: items.length,
    vendorsCount: (rfq.invitedVendorIds || []).length,
    createdBy: rfq.createdByName || 'You',
    lastUpdated: rfq.audit?.updatedAt
      ? new Date(rfq.audit.updatedAt).toLocaleDateString('en-GB')
      : '—',
    // Wizard progress is not persisted server-side; show a simple draft indicator.
    completedSteps: 2,
    totalSteps: 4,
    percent: 50,
  };
};

const SchoolDraftRequests = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  // Selected Category Pill State
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDrafts = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await listSchoolRfqs(schoolId, { status: 'draft', limit: 50 });
      setDrafts((data || []).map(mapDraft));
    } catch (err) {
      setDrafts([]);
      setError(getErrorMessage(err, 'Unable to load draft requests'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const categories = ['All', 'Uniform Requests', 'Purchase Requests', 'Kits', 'Others'];

  const handleDeleteDraft = () => {
    // No RFQ delete endpoint yet; drafts are managed from the create-request flow.
    alert('Deleting drafts is not supported yet. Open the draft to edit it instead.');
  };

  const handleResumeDraft = (d) => {
    navigate(`/school/create-request?draftId=${d.id}`);
  };

  const filteredDrafts = drafts.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || d.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-12 font-outfit">
      
      {/* Top Banner Header Area */}
      <div className="bg-[#3b2d7d] text-white px-6 py-6 sticky top-0 z-50 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => navigate('/school/admin')}
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-xl font-black leading-tight">Draft Requests</h1>
              <span className="text-[12px] text-purple-200 font-bold block mt-1">
                Continue your unfinished procurement requests
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => alert('Draft Requests Help:\n\nReview your saved incomplete requests. You can click "Resume" to finish editing or click "Delete" to discard them.')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 text-white/95 active:scale-90 transition-transform"
          >
            <HelpCircle size={22} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 py-6 space-y-6">
        
        {/* Search Bar & Filter Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center flex-1">
            <Search size={16} className="absolute left-4.5 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search draft requests..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors placeholder:text-gray-300 leading-relaxed shadow-inner"
            />
          </div>
          <button className="w-12 h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-2xl flex items-center justify-center transition-colors shadow-sm shrink-0 active:scale-95">
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4.5 py-2.5 rounded-full text-xs font-black shrink-0 transition-all active:scale-95 border ${
                activeCategory === cat 
                  ? 'bg-[#3b2d7d] border-[#3b2d7d] text-white shadow-md shadow-purple-100' 
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Active Drafts Banner Summary Card */}
        <div className="bg-gradient-to-tr from-[#3b2d7d]/5 to-purple-500/5 border border-purple-100/50 rounded-[2.2rem] p-6 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#3b2d7d] flex items-center justify-center shrink-0 shadow-inner">
              <FolderOpen size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-black block uppercase tracking-wider">Draft Requests</span>
              <h3 className="text-sm font-black text-deep-purple mt-0.5">{drafts.length} Active Drafts</h3>
              <span className="text-[10px] text-[#3b2d7d] font-bold block mt-1.5 leading-none">
                Most Recent: <span className="font-extrabold">{drafts[0]?.title || 'None'}</span>
              </span>
            </div>
          </div>
          {drafts.length > 0 && (
            <button 
              onClick={() => handleResumeDraft(drafts[0])}
              className="bg-[#3b2d7d] hover:bg-[#2b2061] active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md"
            >
              Resume
              <ChevronRight size={14} className="stroke-[3]" />
            </button>
          )}
        </div>

        {/* Draft List Container */}
        <div className="space-y-5">
          {filteredDrafts.map((d) => (
            <div 
              key={d.id}
              className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-5 relative overflow-hidden animate-in fade-in duration-300"
            >
              {/* Header Badge, ID, Options */}
              <div className="flex items-center justify-between gap-3">
                <span className="px-2.5 py-1 bg-amber-50 text-[9.5px] font-black text-amber-600 rounded-md border border-amber-100 flex items-center gap-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Draft
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">ID: {d.id}</span>
                </div>
              </div>

              {/* Title and Date */}
              <div>
                <h4 className="text-sm font-black text-deep-purple">{d.title}</h4>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400 font-bold leading-none">
                  <span>Last Updated: {d.lastUpdated}</span>
                  <span>•</span>
                  <span>Created By: {d.createdBy}</span>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-deep-purple">
                  <span>Completed: {d.completedSteps} of {d.totalSteps} Steps</span>
                  <span className="text-[#3b2d7d]">{d.percent}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#3b2d7d] to-[#5942bc] rounded-full transition-all duration-500" 
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
              </div>

              {/* Quick Info Badges Grid */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-150 text-[10px] font-black text-gray-500">
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-200/60 shadow-inner text-center">
                  <GraduationCap size={16} className="text-indigo-500 stroke-[2.5]" />
                  <span className="text-[7.5px] font-black text-gray-400 block mt-1 uppercase">Classes</span>
                  <span className="text-deep-purple font-extrabold mt-0.5 truncate max-w-full">{d.classes}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-200/60 shadow-inner text-center">
                  <BookOpen size={16} className="text-emerald-500 stroke-[2.5]" />
                  <span className="text-[7.5px] font-black text-gray-400 block mt-1 uppercase">Sets</span>
                  <span className="text-deep-purple font-extrabold mt-0.5">{d.setsCount} Sets</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-200/60 shadow-inner text-center">
                  <Users size={16} className="text-purple-500 stroke-[2.5]" />
                  <span className="text-[7.5px] font-black text-gray-400 block mt-1 uppercase">Vendors</span>
                  <span className="text-deep-purple font-extrabold mt-0.5">{d.vendorsCount} Selected</span>
                </div>
              </div>

              {/* Actions Footer Bar */}
              <div className="flex items-center gap-3 pt-1">
                <button 
                  onClick={() => handleResumeDraft(d)}
                  className="flex-1 py-3.5 border-2 border-[#3b2d7d] text-[#3b2d7d] hover:bg-[#3b2d7d]/5 active:scale-95 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all uppercase bg-white shadow-sm"
                >
                  <Play size={12} className="fill-[#3b2d7d]" />
                  Resume
                </button>
                <button 
                  onClick={() => handleDeleteDraft(d.id)}
                  className="flex-1 py-3.5 border-2 border-red-500 text-red-500 hover:bg-red-50 active:scale-95 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all uppercase bg-white shadow-sm"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>

            </div>
          ))}

          {filteredDrafts.length === 0 && (
            <div className="text-center py-10 bg-white border border-gray-150 rounded-[2.2rem] p-6 shadow-sm">
              <FolderOpen size={36} className="text-gray-300 mx-auto block stroke-[1.5]" />
              <span className="text-xs font-black text-gray-500 block mt-3">
                {loading ? 'Loading drafts…' : error ? 'Unable to load drafts' : 'No draft requests yet'}
              </span>
              <span className="text-[10px] text-gray-400 font-bold block mt-1">
                {error && !loading ? error : 'Saved but unsent procurement requests will appear here.'}
              </span>
            </div>
          )}
        </div>

        {/* Create New Request bottom banner action button */}
        <div 
          onClick={() => navigate('/school/create-request')}
          className="border-2 border-dashed border-[#3b2d7d]/30 bg-purple-50/5 hover:bg-[#3b2d7d]/5 rounded-[2.2rem] p-6 text-center cursor-pointer group transition-all active:scale-98"
        >
          <div className="w-10 h-10 rounded-full bg-[#3b2d7d] text-white flex items-center justify-center shadow-md mx-auto transition-transform group-hover:scale-105">
            <Plus size={18} className="stroke-[3]" />
          </div>
          <span className="text-xs font-black text-[#3b2d7d] block mt-3 uppercase tracking-wider">
            + Create New Request
          </span>
        </div>

      </div>
    </div>
  );
};

export default SchoolDraftRequests;
