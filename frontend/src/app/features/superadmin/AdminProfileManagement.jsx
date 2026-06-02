import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  User, Mail, Phone, Shield, Calendar, Edit3, X, CheckCircle, Save, ChevronRight, Key, Eye, EyeOff 
} from 'lucide-react';

const AdminProfileManagement = () => {
  // Local profile states matching exact user requirements
  const [profile, setProfile] = useState({
    firstName: 'Harsh',
    lastName: 'Admin',
    email: 'admin9111966732@kosil.com',
    mobile: '9111966732',
    role: 'Super Admin',
    createdAt: '10/03/2026, 17:26:13'
  });

  // Modal active states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });
  
  // Toast notifications states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Profile updated successfully!');

  // Change Password Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password visibility triggers
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [showPass3, setShowPass3] = useState(false);

  // Trigger edit modal
  const handleOpenEdit = () => {
    setEditForm({ ...profile });
    setIsModalOpen(true);
  };

  // Submit profile changes
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile({
      ...profile,
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      email: editForm.email.trim(),
      mobile: editForm.mobile.trim()
    });
    setIsModalOpen(false);
    setToastMessage('Profile updated successfully!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Submit password updates
  const handleUpdatePassword = (e) => {
    e.preventDefault();
    
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      alert('Please fill out all password fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert('New Password and Confirm New Password do not match. Please verify your typing.');
      return;
    }

    if (newPassword.length < 6) {
      alert('New Password must be at least 6 characters long.');
      return;
    }

    // Reset fields on successful simulation
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');

    setToastMessage('Password updated successfully!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800 text-left relative">
      
      {/* GLASSMORPHIC SUCCESS TOAST */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-[#0B1528] text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/10 animate-slide-in select-none">
          <div className="bg-emerald-500 p-1.5 rounded-full text-white">
            <CheckCircle size={16} className="stroke-[3]" />
          </div>
          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-emerald-400">Success!</span>
            <span className="block text-[10px] text-gray-300 font-bold mt-0.5">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ADMIN PROFILE BREADCRUMB HEADER (Matching Screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Admin Profile</h1>
        </div>

        {/* Custom Aligned Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
          <span>Home</span>
          <ChevronRight size={12} className="stroke-[3]" />
          <span className="text-[#0B1528]">Profile</span>
        </div>
      </div>

      {/* PROFILE CARD BLOCK */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs max-w-4xl">
        
        {/* Card Header with Edit Trigger */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">
            Profile Information
          </h3>
          
          <button
            type="button"
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 bg-[#0B1528] hover:bg-[#15253F] text-white text-[10px] font-black uppercase tracking-wider py-2 px-4 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Edit3 size={11} className="stroke-[2.5]" />
            Edit Profile
          </button>
        </div>

        {/* 2-Column Grid details matching screenshot exactly */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
          
          {/* Row 1: First Name / Last Name */}
          <div className="space-y-1">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">First Name</span>
            <span className="block text-xs font-bold text-gray-800 select-all pt-1">
              {profile.firstName}
            </span>
          </div>

          <div className="space-y-1">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Last Name</span>
            <span className="block text-xs font-bold text-gray-800 select-all pt-1">
              {profile.lastName}
            </span>
          </div>

          {/* Row 2: Email / Mobile */}
          <div className="space-y-1">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Email</span>
            <span className="block text-xs font-bold text-gray-800 select-all pt-1">
              {profile.email}
            </span>
          </div>

          <div className="space-y-1">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Mobile</span>
            <span className="block text-xs font-bold text-gray-800 select-all pt-1">
              {profile.mobile}
            </span>
          </div>

          {/* Row 3: Role / Created At */}
          <div className="space-y-1">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Role</span>
            <div className="pt-1.5">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                {profile.role}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Created At</span>
            <span className="block text-xs font-bold text-gray-800 select-all pt-1">
              {profile.createdAt}
            </span>
          </div>

        </div>

      </div>

      {/* CHANGE PASSWORD CARD BLOCK (New Section Requested by User) */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs max-w-4xl">
        
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-6">
          <Key size={16} className="text-indigo-600 stroke-[2.5]" />
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">
            Change Password
          </h3>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Current Password */}
            <div className="space-y-1.5 text-left">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">
                Current Password *
              </label>
              
              <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                <input
                  type={showPass1 ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white pl-4 pr-10 py-2.5 focus:outline-none font-bold text-xs"
                />
                
                <button
                  type="button"
                  onClick={() => setShowPass1(!showPass1)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  {showPass1 ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5 text-left">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">
                New Password *
              </label>
              
              <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                <input
                  type={showPass2 ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white pl-4 pr-10 py-2.5 focus:outline-none font-bold text-xs"
                />
                
                <button
                  type="button"
                  onClick={() => setShowPass2(!showPass2)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  {showPass2 ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5 text-left">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">
                Confirm New Password *
              </label>
              
              <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all">
                <input
                  type={showPass3 ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full bg-white pl-4 pr-10 py-2.5 focus:outline-none font-bold text-xs"
                />
                
                <button
                  type="button"
                  onClick={() => setShowPass3(!showPass3)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  {showPass3 ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

          </div>

          {/* Action Trigger */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-[#0B1528] hover:bg-[#15253F] text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Save size={12} className="stroke-[2.5]" />
              Update Password
            </button>
          </div>

        </form>

      </div>

      {/* EDIT MODAL PORTAL */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
          
          <div className="bg-white w-full max-w-[420px] rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-5 text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider">
                Edit Profile Information
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-bold text-gray-700">
              
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="First Name"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Last Name"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="Mobile"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
                />
              </div>

              {/* Submit Actions */}
              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-150 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
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
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">School E-Mart</span>
        </p>
      </div>

    </div>
  );
};

export default AdminProfileManagement;
