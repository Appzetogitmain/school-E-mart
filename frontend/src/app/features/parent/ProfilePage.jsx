import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Edit2, Heart, School, 
  ShoppingBag, Search, UserPlus, 
  Wallet, Phone, Info, LogOut, ChevronRight,
  ShieldCheck, AlertCircle
} from 'lucide-react';
import AuthPrompt from '../../components/AuthPrompt';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);

  // Load user data on mount and listen for storage changes
  useEffect(() => {
    const loadUser = () => {
      const childInfoStr = localStorage.getItem('childInfo');
      if (childInfoStr) {
        setUser(JSON.parse(childInfoStr));
        setIsGuest(false);
      } else {
        setUser(null);
        setIsGuest(true);
      }
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  const menuItems = [
    { icon: <Edit2 size={20} />, label: "Edit Profile", to: "/user/edit-profile", protected: true, color: "text-[#6A47DE] bg-[#F4EBFF]" },
    { icon: <Heart size={20} />, label: "Wishlist", to: "/user/wishlist", protected: true, color: "text-red-500 bg-red-50" },
    { icon: <School size={20} />, label: "My School", to: "/user/my-school", protected: true, color: "text-blue-500 bg-blue-50" },
    { icon: <ShoppingBag size={20} />, label: "My Orders", to: "/user/orders", protected: true, color: "text-green-500 bg-green-50" },
    { icon: <Search size={20} />, label: "My Products", to: "/user/products", color: "text-orange-500 bg-orange-50" },
    { icon: <Wallet size={20} />, label: "Wallet", to: "/user/wallet", protected: true, color: "text-[#E04F5F] bg-[#FFF0F2]" },
    { icon: <Phone size={20} />, label: "Contact us", to: "/user/contact", color: "text-teal-500 bg-teal-50" },
    { icon: <Info size={20} />, label: "About Us", to: "/user/about", color: "text-gray-500 bg-gray-50" }
  ];

  const handleNavigation = (item) => {
    if (item.protected && isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }
    if (item.to) navigate(item.to);
  };

  const handleAuthAction = () => {
    if (isGuest) {
      navigate('/user/login');
    } else {
      localStorage.removeItem('childInfo');
      localStorage.removeItem('wishlist');
      window.dispatchEvent(new Event('storage'));
      navigate('/user/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-5 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-black text-deep-purple">My Profile</h1>
        <div className="w-10 h-10"></div> {/* Spacer */}
      </div>

      <div className="pt-24 px-6 space-y-6">
        {/* User Card */}
        <div className="bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-purple-900/10">
          {/* Glassmorphic Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8 blur-xl pointer-events-none"></div>

          <div className="flex items-center gap-5 relative z-10">
            {/* Profile Avatar */}
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/20 shrink-0">
              {user?.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-gray-400" />
              )}
            </div>

            {/* Info */}
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight truncate">
                {isGuest ? "Guest User" : (user?.name || "Parent")}
              </h2>
              {user?.phone && (
                <p className="text-white/70 text-xs font-medium mt-0.5">{user.phone}</p>
              )}
              {isGuest ? (
                <span className="inline-block bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-[#FFC933] border border-[#FFC933]/20 mt-1.5">
                  Limited Access
                </span>
              ) : (
                <span className="inline-block bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-green-300 border border-green-300/20 mt-1.5">
                  Parent Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items Grid/List */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100/50 space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#F8F7FF] active:bg-[#F0EEFF] rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-gray-700">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        {/* Authentication Button */}
        <button
          onClick={handleAuthAction}
          className={`w-full py-4 rounded-2xl text-sm font-black shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 ${
            isGuest 
              ? 'bg-primary text-white shadow-primary/10 hover:bg-deep-purple' 
              : 'bg-white text-red-500 border border-red-100 shadow-red-100/10 hover:bg-red-50/50'
          }`}
        >
          <LogOut size={18} />
          {isGuest ? "Sign In to Account" : "Sign Out"}
        </button>

        {/* Footer Version Info */}
        <div className="pt-4 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
            School E-Mart v1.0.4
          </p>
        </div>
      </div>

      {/* Auth Prompt dialog for protected routes */}
      <AuthPrompt 
        isOpen={isAuthPromptOpen} 
        onClose={() => setIsAuthPromptOpen(false)} 
        title="Account Login Required"
        message="Please login to manage your profile, view order history, and access exclusive member benefits."
      />
    </div>
  );
};

export default ProfilePage;
