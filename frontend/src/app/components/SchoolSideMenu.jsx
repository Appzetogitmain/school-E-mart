import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Edit2, Heart, School,
  ShoppingBag, Search, UserPlus,
  Wallet, Phone, Info, X, ChevronDown,
  LogOut, Building2
} from 'lucide-react';
import AuthPrompt from './AuthPrompt';

const SchoolSideMenu = ({ isOpen, onClose, user: propUser }) => {
  const navigate = useNavigate();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = React.useState(false);

  const isGuest = !localStorage.getItem('childInfo');
  const user = propUser || (isGuest ? null : JSON.parse(localStorage.getItem('childInfo')));

  const menuItems = [
    { icon: <Edit2 size={20} />, label: "Edit School Profile", to: "/school/edit-profile", protected: true },
    { icon: <Heart size={20} />, label: "Procurement Wishlist", to: "/school/wishlist", protected: true },
    { icon: <ShoppingBag size={20} />, label: "Order Again", to: "/school/orders", protected: true },
    { icon: <Search size={20} />, label: "Manage Products", to: "/school/products" },
    { icon: <UserPlus size={20} />, label: "Partner Referral", to: "/school/refer", protected: true },
    { icon: <Wallet size={20} />, label: "Institutional Wallet", to: "/school/wallet", protected: true },
    { icon: <Phone size={20} />, label: "Contact us", to: "/school/contact" },
    { icon: <Info size={20} />, label: "About Portal", to: "/school/about" },
    {
      icon: <LogOut size={20} />,
      label: isGuest ? "Sign In" : "Sign Out",
      to: "/school/login",
      action: isGuest ? 'login' : 'logout'
    },
  ];

  const handleNavigation = (item) => {
    if (item.protected && isGuest) {
      setIsAuthPromptOpen(true);
      return;
    }

    onClose();
    if (item.action === 'logout') {
      localStorage.removeItem('childInfo');
      localStorage.removeItem('wishlist');
    }
    if (item.to) navigate(item.to);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-white z-[101] transform transition-transform duration-300 ease-out flex flex-col rounded-r-3xl overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] p-8 pb-10 flex flex-col items-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><X size={24} /></button>

          <div className="w-20 h-20 bg-white rounded-[1.8rem] flex items-center justify-center mb-4 shadow-lg overflow-hidden border-2 border-white">
            {user?.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 size={40} className="text-gray-300" />
            )}
          </div>

          <h2 className="text-white text-xl font-bold tracking-tight">
            {isGuest ? "School Guest" : (user?.school || "School Admin")}
          </h2>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Administrator Access</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-primary ${item.action === 'logout' ? 'text-red-500' : ''}`}
            >
              <div className="text-primary">{item.icon}</div>
              <span className="text-gray-700 text-[15px] font-medium tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center font-bold">
            School E-Mart v1.0.4 Admin
          </p>
        </div>

        <AuthPrompt
          isOpen={isAuthPromptOpen}
          onClose={() => setIsAuthPromptOpen(false)}
          title="School Login Required"
          message="Please login as an administrator to manage your institutional portal and view procurement records."
        />
      </div>
    </>
  );
};

export default SchoolSideMenu;
