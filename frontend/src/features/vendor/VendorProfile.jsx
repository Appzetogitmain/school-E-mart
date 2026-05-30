import React, { useState } from 'react';
import { 
  User, ShieldCheck, Mail, Phone, Building, MapPin, 
  Globe, Compass, Edit3, X, Check, AlertTriangle, HelpCircle, ShieldAlert
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const VendorProfile = () => {
  const { user, setUser } = useAuthStore();

  // Local state initialized with live user store details to avoid mock data
  const [name, setName] = useState(user?.name || 'Harsh');
  const [storeName, setStoreName] = useState(user?.school || "Harsh's Hub");
  const [phone, setPhone] = useState(user?.phone || '6268423925');
  const [email, setEmail] = useState(user?.email || 'harsh@appzeto.com');

  // Location & Service settings state
  const [serviceRadius, setServiceRadius] = useState(8);
  const [latitude, setLatitude] = useState(22.715188);
  const [longitude, setLongitude] = useState(75.899109);
  const [address, setAddress] = useState(user?.location || '172, Vaibhav Nagar, Ashirwad Vihar Colony, Tilak Nagar, Indore, Madhya Pradesh 452018, India');

  // UI Interactive States
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successSave, setSuccessSave] = useState(false);

  // Edit states
  const [editName, setEditName] = useState(name);
  const [editStoreName, setEditStoreName] = useState(storeName);
  const [editPhone, setEditPhone] = useState(phone);
  const [editEmail, setEditEmail] = useState(email);
  const [editAddress, setEditAddress] = useState(address);

  const handleEditProfileSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setName(editName);
      setStoreName(editStoreName);
      setPhone(editPhone);
      setEmail(editEmail);
      setAddress(editAddress);

      // Sync with global auth store
      if (user) {
        setUser({
          ...user,
          name: editName,
          school: editStoreName,
          phone: editPhone,
          email: editEmail,
          location: editAddress
        });
      }

      setIsSaving(false);
      setSuccessSave(true);

      setTimeout(() => {
        setSuccessSave(false);
        setIsEditing(false);
      }, 1200);

    }, 800);
  };

  const startEditing = () => {
    setEditName(name);
    setEditStoreName(storeName);
    setEditPhone(phone);
    setEditEmail(email);
    setEditAddress(address);
    setIsEditing(true);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-gray-900 selection:bg-purple-100">
      
      {/* 1. Immersive Top Banner Header Card */}
      <div className="bg-[#0E0E2C] rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between text-white shadow-xl relative overflow-hidden shrink-0 group">
        
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#5B3FD6]/10 to-transparent rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-500"></div>

        <div className="flex items-center gap-6 relative z-10">
          {/* Avatar Circle */}
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shrink-0 shadow-lg text-[#0E0E2C] text-4xl font-black">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-gray-800 border border-gray-700 text-gray-300 text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full">
                Seller
              </span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mt-2">{name}</h2>
            <p className="text-[#5B3FD6] text-xs font-bold mt-1 uppercase tracking-wider">{storeName}</p>
          </div>
        </div>

        <button 
          onClick={startEditing}
          className="mt-6 md:mt-0 bg-transparent border border-gray-700 hover:bg-white/5 text-white font-extrabold flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer relative z-10 shrink-0 self-start md:self-auto"
        >
          <Edit3 size={14} />
          <span>EDIT PROFILE</span>
        </button>

      </div>

      {/* 2. Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Span: Business Settings Info cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Business Profile */}
          <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-sm text-gray-900 tracking-tight">Business Profile</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Seller Identity */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Seller Identity</span>
                <div className="bg-gray-50/50 border border-gray-200/50 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 flex items-center gap-2">
                  <User size={14} className="text-gray-400 shrink-0" />
                  <span>{name}</span>
                </div>
              </div>

              {/* Store Name */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Store Name</span>
                <div className="bg-gray-50/50 border border-gray-200/50 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 flex items-center gap-2">
                  <Building size={14} className="text-gray-400 shrink-0" />
                  <span>{storeName}</span>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Contact Number</span>
                <div className="bg-gray-50/50 border border-gray-200/50 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 flex items-center gap-2">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <span>{phone}</span>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Email Address</span>
                <div className="bg-gray-50/50 border border-gray-200/50 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 flex items-center gap-2">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  <span>{email}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Location & Service Settings */}
          <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-gray-900 tracking-tight">Location & Service Settings</h3>
              <button 
                onClick={() => alert('Map Location Manager feature is api-ready!')}
                className="bg-[#0E0E2C] hover:opacity-95 text-white font-extrabold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer shadow-md"
              >
                Manage
              </button>
            </div>

            {/* Address Pin Row */}
            <div className="bg-gray-50/50 border border-gray-200/50 rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100/50 shadow-sm mt-0.5">
                <MapPin size={18} />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Store Location Pin</span>
                <p className="text-xs font-bold text-gray-800 leading-relaxed">{address}</p>
              </div>
            </div>

            {/* Details Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50/30 border border-gray-100 rounded-xl p-3 flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Service Radius</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-extrabold text-gray-900">{serviceRadius}</span>
                  <span className="bg-gray-100 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-black border border-gray-200/50 uppercase">km</span>
                </div>
              </div>

              <div className="bg-gray-50/30 border border-gray-100 rounded-xl p-3 flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Latitude</span>
                <span className="text-sm font-extrabold text-gray-900 mt-1">{latitude}</span>
              </div>

              <div className="bg-gray-50/30 border border-gray-100 rounded-xl p-3 flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Longitude</span>
                <span className="text-sm font-extrabold text-gray-900 mt-1">{longitude}</span>
              </div>
            </div>

            {/* Location Notice Block */}
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 flex gap-3.5 text-[10px] text-amber-800 font-semibold leading-normal">
              <Compass size={16} className="shrink-0 text-amber-600 mt-0.5" />
              <span>Your shop location and service radius determine which customers can view your products. Ensure the marker is placed exactly at your physical storefront for accurate delivery assignments.</span>
            </div>

          </div>

        </div>

        {/* Right Span: Security & Trust Block */}
        <div className="bg-[#0E0E2C] text-white rounded-[2rem] p-8 shadow-xl flex flex-col justify-between shrink-0 space-y-6 self-start">
          
          <div className="space-y-6">
            <span className="text-[9px] font-black text-[#5B3FD6] tracking-widest uppercase block">Security & Trust</span>
            
            {/* List */}
            <div className="space-y-5">
              
              {/* Verification */}
              <div className="flex items-center gap-4.5">
                <div className="w-10 h-10 bg-white/5 text-[#5B3FD6] rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Verification</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Verified Merchant</span>
                </div>
              </div>

              {/* Partner Tier */}
              <div className="flex items-center gap-4.5">
                <div className="w-10 h-10 bg-white/5 text-[#5B3FD6] rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                  <Compass size={18} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Partner Tier</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Standard Growth</span>
                </div>
              </div>

              {/* Region */}
              <div className="flex items-center gap-4.5">
                <div className="w-10 h-10 bg-white/5 text-[#5B3FD6] rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                  <Globe size={18} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Region</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Pan India Reach</span>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center gap-2 text-[10px] text-gray-500 font-bold">
            <ShieldCheck size={14} className="text-gray-500" />
            <span>Secured Admin Portal</span>
          </div>

        </div>

      </div>

      {/* 3. Centered Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-[#0E0E2C]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="w-full max-w-[440px] bg-white rounded-[2rem] shadow-2xl p-7.5 space-y-6 animate-scale-up relative">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-[#5B3FD6]" />
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Edit Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditProfileSubmit} className="space-y-4">
              
              {/* Seller Identity */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block ml-0.5">Seller Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={14} />
                  <input 
                    type="text" 
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6]"
                  />
                </div>
              </div>

              {/* Store Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block ml-0.5">Store Hub Name</label>
                <div className="relative group">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={14} />
                  <input 
                    type="text" 
                    required
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block ml-0.5">Contact Number</label>
                <div className="relative group">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={14} />
                  <input 
                    type="text" 
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6]"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block ml-0.5">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={14} />
                  <input 
                    type="email" 
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6]"
                  />
                </div>
              </div>

              {/* Store Location */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block ml-0.5">Store Location Address</label>
                <div className="relative group">
                  <MapPin className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-[#5B3FD6] transition-colors" size={14} />
                  <textarea 
                    required
                    rows={2}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B3FD6]/10 focus:border-[#5B3FD6] resize-none"
                  />
                </div>
              </div>

              {/* Success Notification */}
              {successSave && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-extrabold uppercase tracking-wider">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Profile Saved Successfully!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-500 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-[#5B3FD6] hover:bg-[#492eb3] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer text-center flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Save Details'
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default VendorProfile;
