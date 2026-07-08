import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, UserPlus, Edit2, Trash2, 
  Mail, Phone, Loader2, X, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { listParents, createParent, updateParent, deleteParent } from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { useSchoolId } from '../../../utils/schoolContext';

const SchoolParentsPage = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  // State Variables
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedParent, setSelectedParent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  // Delete modal state
  const [parentToDelete, setParentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load parent profiles
  const loadParents = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      setError('School context is missing. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await listParents(schoolId, { limit: 100 });
      setParents(data || []);
    } catch (err) {
      setParents([]);
      setError(getErrorMessage(err, 'Unable to load parents'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadParents();
  }, [loadParents]);

  // Open modal helper
  const openAddModal = () => {
    setModalMode('add');
    setSelectedParent(null);
    setFormData({ name: '', phone: '', email: '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (parent) => {
    setModalMode('edit');
    setSelectedParent(parent);
    setFormData({
      name: parent.user?.name || '',
      phone: parent.user?.phone || '',
      email: parent.user?.email || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  // Form handle change
  const handleInputChange = (field, value) => {
    setModalError('');
    let val = value;
    if (field === 'phone') {
      val = value.replace(/\D/g, '').slice(-10);
    }
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  // Form validations
  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.phone || formData.phone.length !== 10) return 'Valid 10-digit mobile number is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) return 'Invalid email address';
    return '';
  };

  // Form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setModalError(validationError);
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      };
      if (formData.email?.trim()) {
        payload.email = formData.email.trim();
      }

      if (modalMode === 'add') {
        const result = await createParent(schoolId, payload);
        setParents(prev => [result, ...prev]);
      } else {
        const result = await updateParent(schoolId, selectedParent._id, payload);
        setParents(prev => prev.map(p => p._id === selectedParent._id ? { ...p, user: { ...p.user, ...result.user } } : p));
      }
      setIsModalOpen(false);
      loadParents(); // Reload list to reflect correct DB state
    } catch (err) {
      setModalError(getErrorMessage(err, `Failed to ${modalMode} parent`));
    } finally {
      setModalLoading(false);
    }
  };

  // Delete parent helper
  const handleDelete = async () => {
    if (!parentToDelete || !schoolId) return;
    setDeleteLoading(true);
    try {
      await deleteParent(schoolId, parentToDelete._id);
      setParents(prev => prev.filter(p => p._id !== parentToDelete._id));
      setParentToDelete(null);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete parent'));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter parents based on search query
  const filteredParents = parents.filter(p => {
    const name = (p.user?.name || '').toLowerCase();
    const phone = (p.user?.phone || '');
    const email = (p.user?.email || '').toLowerCase();
    const search = searchQuery.toLowerCase();
    return name.includes(search) || phone.includes(search) || email.includes(search);
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-12 font-outfit">
      
      {/* Header Banner */}
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
              <h1 className="text-xl font-black leading-tight">Parent Accounts</h1>
              <span className="text-[12px] text-purple-200 font-bold block mt-1">
                Manage registered parents and send invitation welcome emails
              </span>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-white text-[#3b2d7d] px-4 py-2.5 rounded-full text-xs font-black hover:bg-purple-50 active:scale-95 transition-all shadow-md"
          >
            <UserPlus size={16} />
            Add Parent
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="px-6 py-6 space-y-6">
        
        {/* Search Bar */}
        <div className="relative flex items-center w-full">
          <Search size={16} className="absolute left-4.5 text-gray-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parents by name, email, or mobile..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors placeholder:text-gray-300 shadow-inner"
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={loadParents} className="text-red-700 underline shrink-0">Retry</button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="animate-spin text-[#3b2d7d] mb-4" />
            <p className="text-sm text-gray-500 font-bold">Loading parents database...</p>
          </div>
        ) : filteredParents.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-[2.2rem] p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-[#3b2d7d]">
              <UserPlus size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-deep-purple">No Parents Found</h3>
              <p className="text-gray-400 text-sm mt-1">
                {searchQuery ? "No matches found for your search query." : "Start adding parent accounts to invite them to the platform."}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="bg-[#3b2d7d] text-white px-6 py-3 rounded-full text-xs font-black shadow-lg shadow-purple-900/10 hover:bg-purple-800 active:scale-95 transition-all inline-block"
              >
                Add Your First Parent
              </button>
            )}
          </div>
        ) : (
          /* Parents Card Grid */
          <div className="space-y-4 w-full">
            {filteredParents.map((parent) => {
              const name = parent.user?.name || 'Unnamed Parent';
              const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <div 
                  key={parent._id}
                  className="bg-white border border-gray-150 rounded-[2.2rem] p-5.5 relative flex flex-col justify-between hover:shadow-md transition-all duration-300 w-full group overflow-hidden"
                >
                  <div>
                    {/* Top Row: Initials Avatar + Name & Referral Code + Quick Actions */}
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Initials Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3b2d7d]/5 to-purple-50 flex items-center justify-center font-black text-[#3b2d7d] text-sm shrink-0 border border-purple-100/50">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[14px] font-black text-deep-purple leading-tight truncate">
                            {name}
                          </h3>
                          {parent.referralCode && (
                            <span className="inline-block bg-purple-50 text-[#3b2d7d] text-[9px] font-black rounded-lg border border-purple-100 px-2 py-0.5 mt-1 uppercase tracking-wider">
                              Ref: {parent.referralCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Top Right Quick Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => openEditModal(parent)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-purple-50 hover:text-[#3b2d7d] transition-all active:scale-90"
                          title="Edit Parent"
                        >
                          <Edit2 size={13} className="stroke-[2.5]" />
                        </button>
                        <button 
                          onClick={() => setParentToDelete(parent)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
                          title="Delete Parent"
                        >
                          <Trash2 size={13} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Contact Info Stack */}
                    <div className="py-3.5 my-3 border-y border-gray-100 text-[11px] font-bold text-gray-500 space-y-2.5 w-full">
                      <div className="flex items-center gap-2.5">
                        <span className="text-gray-400 text-sm">📞</span>
                        <span className="text-deep-purple">{parent.user?.phone || 'No phone number'}</span>
                      </div>
                      {parent.user?.email && (
                        <div className="flex items-center gap-2.5">
                          <span className="text-gray-400 text-sm">✉️</span>
                          <span className="text-deep-purple break-all">{parent.user.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5">
                        <span className="text-gray-400 text-sm">🪪</span>
                        <span className="font-black text-[#3b2d7d]">{parent.user?.refId || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Role Info */}
                  <div className="flex items-center justify-between text-[9px] font-black text-purple-300 uppercase tracking-wider w-full">
                    <span>PARENT ACCOUNT</span>
                    <span className="text-emerald-500 flex items-center gap-1 font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Parent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#3b2d7d] text-white px-6 py-5 flex items-center justify-between">
              <h3 className="text-lg font-black">{modalMode === 'add' ? 'Add Parent Account' : 'Edit Parent Account'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 flex-1">
              {modalError && (
                <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Parent Full Name</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none placeholder:text-gray-300"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                <input 
                  type="tel"
                  required
                  disabled={modalMode === 'edit'} // Disable phone edits to keep primary index clean
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none placeholder:text-gray-300"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email ID (Optional)</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-deep-purple focus:ring-2 focus:ring-primary/10 outline-none placeholder:text-gray-300"
                />
                {modalMode === 'add' && (
                  <span className="text-[10px] text-gray-400 font-bold block ml-1 leading-tight">
                    * If provided, a welcome email with credentials details will be sent immediately.
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-xs font-black text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-3.5 bg-[#3b2d7d] text-white rounded-2xl text-xs font-black hover:bg-purple-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/10"
                >
                  {modalLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Profile'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {parentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-deep-purple">Delete Parent Profile?</h3>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                Are you sure you want to delete the account for <strong>{parentToDelete.user?.name}</strong>? This action will disable their access.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={deleteLoading}
                onClick={() => setParentToDelete(null)}
                className="flex-1 py-3 border border-gray-150 rounded-2xl text-xs font-black text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                onClick={handleDelete}
                className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-xs font-black hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolParentsPage;
