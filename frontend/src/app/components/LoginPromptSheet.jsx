import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, X, ShieldAlert } from 'lucide-react';

const LoginPromptSheet = ({ isOpen, onClose, title, message, redirectPath }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    if (redirectPath) {
      sessionStorage.setItem('redirect_after_login', redirectPath);
    }
    navigate('/user/login');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end font-outfit">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="relative bg-white rounded-t-[3rem] p-8 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6">
            <ShieldAlert size={40} className="text-primary" />
          </div>
          
          <h2 className="text-2xl font-black text-deep-purple mb-3">{title || "Login Required"}</h2>
          <p className="text-gray-400 text-sm font-medium leading-relaxed mb-10 max-w-[280px]">
            {message || "Please login to continue with your order and delivery details"}
          </p>
          
          <div className="w-full flex flex-col gap-3">
            <button 
              onClick={handleLogin}
              className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={18} /> Continue to Login
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptSheet;
