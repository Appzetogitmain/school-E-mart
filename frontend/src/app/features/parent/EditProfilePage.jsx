import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, User, Mail, Phone, 
  MapPin, Home, Globe, Navigation, 
  ShieldCheck, Check, AlertCircle, ImageIcon
} from 'lucide-react';
import { updateMyProfile } from '../../../services/parentApi';
import useAuthStore from '../../../store/useAuthStore';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    altPhone: "",
    address: "",
    pinCode: "",
    city: "",
    state: "",
    country: "India",
    photo: ""
  });

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const user = await refreshUser();
        if (cancelled) return;
        setFormData({
          fullName: user.childProfile?.name || user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          altPhone: user.profile?.altPhone || "",
          address: user.profile?.address || "",
          pinCode: user.profile?.pinCode || "",
          city: user.profile?.city || "",
          state: user.profile?.state || "",
          country: user.profile?.country || "India",
          photo: user.childProfile?.photo || user.childProfile?.avatarUrl || user.profile?.avatarUrl || ""
        });
      } catch (err) {
        console.error("Failed to load profile on mount", err);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAutoFill = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          const addr = data.address || {};
          setFormData((prev) => ({
            ...prev,
            pinCode: addr.postcode || prev.pinCode,
            city: addr.city || addr.town || addr.village || prev.city,
            state: addr.state || prev.state,
            country: addr.country || prev.country,
            address: [addr.road, addr.suburb, addr.neighbourhood]
              .filter(Boolean)
              .join(', ') || prev.address,
          }));
        } catch {
          alert('Unable to fetch address. Please enter manually.');
        }
      },
      () => {
        alert('Location access denied. Please enter your address manually.');
      }
    );
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Student Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (formData.email && !formData.email.includes('@')) newErrors.email = "Valid email is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      await updateMyProfile({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        altPhone: formData.altPhone,
        address: formData.address,
        pinCode: formData.pinCode,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        photo: formData.photo
      });

      await refreshUser();

      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate(-1);
        window.dispatchEvent(new Event('storage'));
      }, 1500);
    } catch (err) {
      console.error("Failed to save profile", err);
      alert(err.response?.data?.message || "Failed to update profile. Please try again.");
      setLoading(false);
    }
  };

  const InputField = ({ label, icon: Icon, field, type = "text", placeholder, readOnly = false }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div className={`
        relative flex items-center bg-white rounded-2xl border-2 transition-all duration-300
        ${errors[field] ? 'border-red-100 bg-red-50/30' : 'border-gray-50 focus-within:border-primary/20 focus-within:shadow-lg focus-within:shadow-primary/5'}
      `}>
        <div className={`pl-4 text-gray-400 ${errors[field] ? 'text-red-400' : ''}`}>
          <Icon size={18} />
        </div>
        <input
          type={type}
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="w-full py-4 px-3 bg-transparent text-sm font-bold text-deep-purple outline-none placeholder:text-gray-300"
        />
        {errors[field] && (
          <div className="pr-4 text-red-500">
            <AlertCircle size={18} />
          </div>
        )}
      </div>
      {errors[field] && <p className="text-[9px] font-bold text-red-500 ml-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative">
      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] bg-deep-purple/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/40 animate-in zoom-in duration-500">
            <Check size={40} className="text-white" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-black text-white mt-6">Profile Updated!</h2>
        </div>
      )}

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-5 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-black text-deep-purple">Edit Profile</h1>
        <div className="w-10 h-10"></div> {/* Spacer */}
      </div>

      <div className="pt-24 px-6 space-y-8 overflow-y-auto">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="relative group">
            <div className="w-28 h-28 rounded-[2.5rem] bg-white p-1 shadow-xl shadow-primary/10 border-2 border-primary/20">
              <div className="w-full h-full rounded-[2.2rem] bg-gray-100 overflow-hidden relative flex items-center justify-center">
                {formData.photo ? (
                  <img 
                    src={formData.photo} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-300">
                    <ImageIcon size={32} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">No Photo</span>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={handlePhotoClick}
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white active:scale-90 transition-all hover:bg-deep-purple"
            >
              <Camera size={18} />
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-black text-deep-purple">{formData.fullName || "New Student"}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Parent Portal Account</p>
          </div>
        </div>

        {/* Personal Details */}
        <div className="space-y-5">
          <SectionTitle title="Personal Details" />
          <InputField label="Student Name" icon={User} field="fullName" placeholder="Enter student name" />
          <InputField label="Email Address" icon={Mail} field="email" type="email" placeholder="email@example.com" />
          <div className="grid grid-cols-1 gap-5">
            <InputField label="Phone Number" icon={Phone} field="phone" placeholder="+91 XXXXX XXXXX" />
            <InputField label="Alternate Phone" icon={Phone} field="altPhone" placeholder="Optional" />
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-5 pb-10">
          <div className="flex items-center justify-between">
            <SectionTitle title="Address Details" />
            <button 
              onClick={handleAutoFill}
              className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-tight active:scale-95 transition-all"
            >
              <Navigation size={12} fill="currentColor" /> Tap to Auto-fill
            </button>
          </div>
          
          <InputField label="House No. & Street" icon={Home} field="address" placeholder="Flat, Floor, Street" />
          
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Pin Code" icon={MapPin} field="pinCode" placeholder="XXXXXX" />
            <InputField label="City" icon={Globe} field="city" placeholder="Indore" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <InputField label="State" icon={MapPin} field="state" placeholder="Madhya Pradesh" />
            <InputField label="Country" icon={Globe} field="country" placeholder="India" />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <button 
          onClick={handleSave}
          disabled={loading}
          className={`
            w-full py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 
            active:scale-95 transition-all flex items-center justify-center gap-3
            ${loading ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Save Changes
              <ShieldCheck size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const SectionTitle = ({ title }) => (
  <div className="flex items-center gap-2">
    <div className="w-1 h-4 bg-primary rounded-full"></div>
    <h3 className="text-sm font-black text-deep-purple uppercase tracking-widest">{title}</h3>
  </div>
);

export default EditProfilePage;
