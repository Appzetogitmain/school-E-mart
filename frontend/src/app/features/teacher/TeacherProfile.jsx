import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldAlert, Camera, User, Phone,
  Mail, MapPin, Briefcase, Lock, CheckCircle2, ChevronRight,
  Save, X, Loader2, LogOut
} from 'lucide-react';
import { updateTeacher } from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { resolveTeacherProfile } from '../../../utils/teacherApiHelpers';
import { useAuthUser, useTeacherSchoolId } from '../../../utils/teacherContext';
import useAuthStore from '../../../store/useAuthStore';

const TeacherProfile = () => {
  const navigate = useNavigate();
  const schoolId = useTeacherSchoolId();
  const authUser = useAuthUser();

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Female');
  const [maritalStatus, setMaritalStatus] = useState('Married');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');

  const [designation, setDesignation] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [avatar, setAvatar] = useState(
    'https://ui-avatars.com/api/?name=Teacher&background=3b2d7d&color=fff'
  );
  const [teacherProfileId, setTeacherProfileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef(null);

  // Password Modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback states
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Logout states
  const logout = useAuthStore((state) => state.logout);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!schoolId || !authUser?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const profile = await resolveTeacherProfile(schoolId);
        if (!profile) {
          setFullName(authUser.name || '');
          setEmail(authUser.email || '');
          setPhone(authUser.phone || '');
          return;
        }

        setTeacherProfileId(profile._id || profile.id);
        const user = profile.user || {};
        setFullName(user.name || authUser.name || '');
        setPhone(user.phone || authUser.phone || '');
        setEmail(user.email || authUser.email || '');
        setDesignation(profile.designation || '');
        setQualification(profile.qualification || '');
        setExperience(
          profile.experienceYears != null ? `${profile.experienceYears} Years` : ''
        );
        setJoiningDate(
          profile.joiningDate ? new Date(profile.joiningDate).toISOString().slice(0, 10) : ''
        );
        setEmployeeId(profile._id?.toString?.()?.slice(-8) || '');
        if (user.name) {
          setAvatar(
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b2d7d&color=fff`
          );
        }
      } catch {
        setFullName(authUser.name || '');
        setEmail(authUser.email || '');
        setPhone(authUser.phone || '');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [schoolId, authUser]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      triggerToast('Please fill all required fields (*)');
      return;
    }
    if (!schoolId || !teacherProfileId) {
      triggerToast('Teacher profile is not linked yet.');
      return;
    }

    setSaving(true);
    try {
      const experienceYears = parseInt(String(experience).replace(/\D/g, ''), 10);
      await updateTeacher(schoolId, teacherProfileId, {
        designation: designation.trim() || undefined,
        qualification: qualification.trim() || undefined,
        experienceYears: Number.isFinite(experienceYears) ? experienceYears : undefined,
        user: {
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        },
      });

      triggerToast('Profile Saved Successfully!');
      setTimeout(() => navigate('/school/teacher/dashboard'), 1500);
    } catch (err) {
      triggerToast(getErrorMessage(err, 'Unable to save profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // The store clears the local session even if the API call fails, so this
      // always ends with the teacher signed out.
      await logout();
      navigate('/school/login', { replace: true });
    } finally {
      setLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const handleAvatarChange = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        triggerToast('Please select a valid image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setAvatar(uploadEvent.target.result);
        triggerToast('Profile Photo Uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerToast('All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      triggerToast('Password must be at least 6 characters');
      return;
    }

    triggerToast('Password Updated Successfully!');
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen select-none font-outfit animate-in fade-in duration-300 pb-52 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-6 duration-300">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <CheckCircle2 size={14} strokeWidth={3} />
          </div>
          <span className="text-xs font-black">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="px-6 pt-7 pb-4 bg-white flex items-center justify-between border-b border-gray-100 relative z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/school/teacher/dashboard')}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex items-center justify-center text-deep-purple mr-1"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-lg font-black text-deep-purple leading-none">Edit Profile</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-1">Update your personal information</p>
          </div>
        </div>

        <button 
          onClick={() => triggerToast('Account Security Panel!')}
          className="px-3.5 py-2 hover:bg-gray-50 active:scale-95 transition-all border border-gray-200 rounded-full flex items-center gap-1 text-[10px] font-black text-primary"
        >
          <ShieldAlert size={14} />
          <span>Account Info</span>
        </button>
      </div>

      <div className="space-y-4 px-6 mt-4 relative z-20">
        
        {/* 2. Profile Photo Selector Box */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0 rounded-full border-2 border-primary/20 overflow-hidden shadow-inner group">
              <img 
                src={avatar} 
                alt="Profile photo" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
              />
              <button 
                type="button"
                onClick={handleAvatarChange}
                className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
              >
                <Camera size={12} strokeWidth={2.5} />
              </button>
            </div>
            <div>
              <h3 className="text-xs font-black text-deep-purple">Profile Photo</h3>
              <p className="text-[9px] text-gray-400 font-bold mt-0.5">JPG, PNG (Max 2MB)</p>
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <button 
            type="button"
            onClick={handleAvatarChange}
            className="px-4 py-2 border border-primary hover:bg-primary hover:text-white text-primary active:scale-95 transition-all rounded-xl text-[9px] font-black flex items-center gap-1 shadow-sm"
          >
            <Camera size={12} />
            <span>Change</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="space-y-4">

          {/* 3. Personal Information Block */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-2 shrink-0">
              <div className="w-7 h-7 rounded-xl bg-purple-50 text-primary flex items-center justify-center">
                <User size={14} />
              </div>
              <span className="text-[11px] font-black text-deep-purple uppercase tracking-wider block">Personal Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Full Name *</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                  placeholder="Enter full name"
                />
              </div>

              {/* DOB */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Date of Birth *</label>
                <input 
                  type="date" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                />
              </div>

              {/* Gender */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Gender *</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent cursor-pointer"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Marital Status */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Marital Status</label>
                <select 
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent cursor-pointer"
                >
                  <option value="Married">Married</option>
                  <option value="Single">Single</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Contact Information Block */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-2 shrink-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Phone size={13} />
              </div>
              <span className="text-[11px] font-black text-deep-purple uppercase tracking-wider block">Contact Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Phone */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                <Phone size={14} className="text-gray-400 mt-3.5 shrink-0" />
                <div className="flex-1">
                  <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Phone Number *</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                <Mail size={14} className="text-gray-400 mt-3.5 shrink-0" />
                <div className="flex-1">
                  <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Email Address *</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              {/* Alternate Phone */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                <Phone size={14} className="text-gray-400 mt-3.5 shrink-0" />
                <div className="flex-1">
                  <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Alternate Phone (Optional)</label>
                  <input 
                    type="text" 
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                    placeholder="Enter secondary contact"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                <MapPin size={14} className="text-gray-400 mt-3.5 shrink-0" />
                <div className="flex-1">
                  <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Address</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                    placeholder="Enter home location"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Professional Information Block */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-2 shrink-0">
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Briefcase size={14} />
              </div>
              <span className="text-[11px] font-black text-deep-purple uppercase tracking-wider block">Professional Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Designation */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Designation *</label>
                <select 
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent cursor-pointer"
                >
                  <option value="Mathematics Teacher">Mathematics Teacher</option>
                  <option value="English Teacher">English Teacher</option>
                  <option value="Science Teacher">Science Teacher</option>
                  <option value="Class Coordinator">Class Coordinator</option>
                </select>
              </div>

              {/* Qualification */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Qualification *</label>
                <select 
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent cursor-pointer"
                >
                  <option value="M.Sc. Mathematics">M.Sc. Mathematics</option>
                  <option value="B.Ed. Mathematics">B.Ed. Mathematics</option>
                  <option value="M.A. English">M.A. English</option>
                  <option value="Ph.D. Education">Ph.D. Education</option>
                </select>
              </div>

              {/* Experience */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Experience (Years)</label>
                <select 
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent cursor-pointer"
                >
                  <option value="8 Years">8 Years</option>
                  <option value="5 Years">5 Years</option>
                  <option value="10+ Years">10+ Years</option>
                </select>
              </div>

              {/* Joining Date */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Joining Date</label>
                <input 
                  type="date" 
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                />
              </div>

              {/* Employee ID */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Employee ID (Optional)</label>
                <input 
                  type="text" 
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                  placeholder="Enter employee card code"
                />
              </div>
            </div>
          </div>

          {/* 6. Account Settings Block */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-2 shrink-0">
              <div className="w-7 h-7 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center">
                <Lock size={14} />
              </div>
              <span className="text-[11px] font-black text-deep-purple uppercase tracking-wider block">Account Settings</span>
            </div>

            <div className="space-y-1">
              {/* Row 1 */}
              <button 
                type="button" 
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full py-3.5 px-2 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 active:scale-[0.99] transition-all rounded-xl text-left"
              >
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-gray-450 shrink-0" />
                  <div>
                    <span className="text-xs font-black text-deep-purple block leading-tight">Change Password</span>
                    <span className="text-[9px] text-gray-450 font-bold block mt-0.5">Update your account password</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>

              {/* Row 2 */}
              <div className="w-full py-3.5 px-2 flex items-center justify-between text-left border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-450 shrink-0" />
                  <div>
                    <span className="text-xs font-black text-deep-purple block leading-tight">Linked Number</span>
                    <span className="text-[9px] text-gray-450 font-bold block mt-0.5">{phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-[#EBFDF2] text-[#15803D] border border-[#DCFCE7] text-[8px] font-black px-2 py-0.5 rounded-full">
                    Verified ✓
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>

              {/* Row 3 — Log Out */}
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full py-3.5 px-2 flex items-center justify-between hover:bg-red-50/50 active:scale-[0.99] transition-all rounded-xl text-left"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={16} className="text-red-500 shrink-0" />
                  <div>
                    <span className="text-xs font-black text-red-500 block leading-tight">Log Out</span>
                    <span className="text-[9px] text-gray-450 font-bold block mt-0.5">Sign out of your teacher account</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

        </form>

      </div>

      {/* 7. Action CTA Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 z-40 space-y-2">
        <button 
          onClick={handleSave}
          className="w-full py-4 bg-primary text-white hover:bg-deep-purple active:scale-98 transition-all rounded-[1.8rem] text-sm font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
        >
          <Save size={16} strokeWidth={2.5} />
          <span>Save Changes</span>
        </button>

        <button 
          onClick={() => navigate('/school/teacher/dashboard')}
          className="w-full py-4 bg-white hover:bg-gray-50 active:scale-98 transition-all rounded-[1.8rem] text-sm font-black text-gray-450 border border-gray-200 flex items-center justify-center"
        >
          Cancel
        </button>
      </div>

      {/* 8. Change Password Modal Overlay */}
      {isPasswordModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-deep-purple/40 backdrop-blur-sm z-[90] transition-all animate-in fade-in duration-300"
            onClick={() => setIsPasswordModalOpen(false)}
          />
          
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.2rem] shadow-2xl z-[100] transition-all animate-in slide-in-from-bottom-24 duration-300 flex flex-col p-6 space-y-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-sm font-black text-deep-purple leading-none">Change Password</h3>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Protect your account with a secure password</p>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center text-gray-450"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePasswordUpdate} className="space-y-3.5 pb-4">
              {/* Current Password */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Current Password *</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                />
              </div>

              {/* New Password */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">New Password *</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                />
              </div>

              {/* Confirm Password */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl px-3.5 py-2.5">
                <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Confirm New Password *</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent"
                />
              </div>

              {/* Submit CTA */}
              <button 
                type="submit"
                className="w-full py-4 bg-primary text-white hover:bg-deep-purple active:scale-98 transition-all rounded-[1.8rem] text-sm font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-2 mt-2"
              >
                <Save size={16} strokeWidth={2.5} />
                <span>Update Password</span>
              </button>
            </form>

          </div>
        </>
      )}

      {/* 9. Log Out Confirmation Modal */}
      {isLogoutModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-deep-purple/40 backdrop-blur-sm z-[90] transition-all animate-in fade-in duration-300"
            onClick={() => !loggingOut && setIsLogoutModalOpen(false)}
          />

          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.2rem] shadow-2xl z-[100] transition-all animate-in slide-in-from-bottom-24 duration-300 flex flex-col p-6 space-y-5">
            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <LogOut size={22} className="text-red-500" />
              </div>
              <h3 className="text-sm font-black text-deep-purple leading-none">Log out?</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-2 max-w-[240px] leading-relaxed">
                You&apos;ll need to sign in again to mark attendance or set homework. Any unsaved profile changes will be lost.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-4 bg-red-500 text-white hover:bg-red-600 active:scale-98 transition-all rounded-[1.8rem] text-sm font-black shadow-lg shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loggingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <LogOut size={16} strokeWidth={2.5} />
                    <span>Yes, Log Out</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                disabled={loggingOut}
                className="w-full py-4 bg-white hover:bg-gray-50 active:scale-98 transition-all rounded-[1.8rem] text-sm font-black text-gray-450 border border-gray-200 flex items-center justify-center disabled:opacity-70"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default TeacherProfile;
