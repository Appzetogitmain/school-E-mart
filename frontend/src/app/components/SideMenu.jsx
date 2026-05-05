import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Edit2, Heart, School, 
  ShoppingBag, Search, UserPlus, 
  Wallet, Phone, Info, X, ChevronDown,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginPromptSheet from './LoginPromptSheet';

const SideMenu = ({ isOpen, onClose, user = { name: "priya", phone: "+917999942772" } }) => {
  const navigate = useNavigate();
  const { isGuest, logout } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptConfig, setPromptConfig] = useState({});

  const menuItems = [
    { icon: <Edit2 size={20} />, label: "Edit Profile", to: "/user/edit-profile", restricted: true },
    { icon: <Heart size={20} />, label: "Wishlist", to: "/user/wishlist", restricted: true },
    { icon: <School size={20} />, label: "My School", to: "/user/my-school" },
    { icon: <ShoppingBag size={20} />, label: "My Orders", to: "/user/orders", restricted: true },
    { icon: <Search size={20} />, label: "My Products", to: "/user/products" },
    { icon: <UserPlus size={20} />, label: "Refer & Earn", to: "/user/refer" },
    { icon: <Wallet size={20} />, label: "Wallet", to: "/user/wallet" },
    { icon: <Phone size={20} />, label: "Contact us", to: "/user/contact" },
    { icon: <Info size={20} />, label: "About Us", to: "/user/about" },
    { icon: <LogOut size={20} />, label: "Sign Out", to: "/user/login", action: 'logout' },
  ];

  const handleNavigation = (item) => {
    if (isGuest && (item.label === 'My School' || item.restricted || item.label === 'Wallet')) {
      setPromptConfig({
        title: "Login Required",
        message: item.label === 'My School' 
          ? "Login to view school-specific products and recommendations"
          : `Please login to access ${item.label}`,
        redirectPath: item.to
      });
      setShowPrompt(true);
      return;
    }

    onClose();
    if (item.action === 'logout') {
      logout();
    }
    if (item.to) navigate(item.to);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Menu Sidebar */}
      <div className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-white z-[101] transform transition-transform duration-300 ease-out flex flex-col rounded-r-3xl overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand Purple Header Section */}
        <div className="bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] p-8 pb-10 flex flex-col items-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          
          {/* Profile Picture Placeholder */}
          <div className="w-20 h-20 bg-white rounded-[1.8rem] flex items-center justify-center mb-4 shadow-lg overflow-hidden border-2 border-white">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-gray-400" />
            )}
          </div>
          
          {/* User Info */}
          <h2 className="text-white text-xl font-medium mb-1 flex items-center gap-1">
            {user.name} <ChevronDown size={18} className="opacity-70" />
          </h2>
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{user.grade}</p>
        </div>
        
        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item, index) => (
            <button 
              key={index}
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-all group border-l-4 border-transparent hover:border-primary ${item.action === 'logout' ? 'text-red-500' : ''}`}
              style={{ 
                animation: isOpen ? `slideIn 0.3s ease-out ${index * 0.05}s forwards` : 'none',
                opacity: 0,
                transform: 'translateX(-20px)'
              }}
            >
              <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <span className="text-gray-700 text-[15px] font-medium tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>

        <style>
          {`
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(-20px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}
        </style>
        
        {/* Footer info */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center font-bold">
            School E-Mart v1.0.4
          </p>
        </div>
      </div>

      <LoginPromptSheet 
        isOpen={showPrompt} 
        onClose={() => setShowPrompt(false)} 
        {...promptConfig}
      />
    </>
  );
};

export default SideMenu;
