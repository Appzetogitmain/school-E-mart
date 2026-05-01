import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus, GraduationCap, Lock } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const LoginPromptModal = ({ isOpen, onClose, message = "Please login to continue your shopping experience." }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Top Decorative Section */}
        <div className="bg-primary/5 p-10 flex flex-col items-center text-center">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-primary hover:bg-white rounded-full transition-all shadow-sm"
          >
            <X size={20} />
          </button>

          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-primary/10 flex items-center justify-center text-primary mb-6 relative">
            <GraduationCap size={40} />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-orange rounded-xl flex items-center justify-center text-deep-purple shadow-lg border-4 border-white">
              <Lock size={14} />
            </div>
          </div>

          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Login Required</h3>
          <p className="text-sm text-gray-500 font-normal leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-8 space-y-4">
          <button
            onClick={() => {
              navigate(ROUTES.LOGIN);
              onClose();
            }}
            className="w-full py-4 bg-primary text-white font-medium rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:bg-deep-purple transition-all active:scale-[0.98]"
          >
            <LogIn size={20} />
            Sign In Now
          </button>

          <button
            onClick={() => {
              navigate(ROUTES.REGISTER);
              onClose();
            }}
            className="w-full py-4 bg-white border-2 border-gray-100 text-gray-700 font-medium rounded-2xl flex items-center justify-center gap-3 hover:border-primary/20 hover:bg-primary/5 transition-all active:scale-[0.98]"
          >
            <UserPlus size={20} className="text-primary" />
            Create Account
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Maybe Later
          </button>
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-[10px] text-gray-400 font-normal">
            By continuing, you agree to our Terms and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
