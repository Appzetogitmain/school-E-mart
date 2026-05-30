import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, LogIn, Sparkles, 
  ShieldCheck, Heart, ShoppingBag 
} from 'lucide-react';

const AuthPrompt = ({ isOpen, onClose, title = "Join School E-Mart", message = "Login to save your child's profile and access exclusive features." }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-deep-purple/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 fill-mode-both">
        {/* Top Banner */}
        <div className="h-32 bg-primary relative overflow-hidden flex items-center justify-center">
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-accent-orange/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10 flex gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white rotate-[-12deg] shadow-lg">
              <Heart size={24} fill="currentColor" />
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-xl">
              <ShoppingBag size={24} />
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white rotate-[12deg] shadow-lg">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/20 transition-all z-20"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="px-8 pt-8 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full mb-4">
            <Sparkles size={12} className="text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Unlock Benefits</span>
          </div>

          <h2 className="text-2xl font-black text-deep-purple tracking-tight mb-3">
            {title}
          </h2>
          <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto mb-8">
            {message}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                onClose();
                navigate(window.location.pathname.startsWith('/school') ? '/school/login' : '/user/login');
              }}
              className="w-full py-4 bg-primary text-white rounded-2xl text-base font-black shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 tracking-widest uppercase"
            >
              <LogIn size={20} strokeWidth={3} />
              Login Now
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-sm font-bold active:scale-95 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>

        {/* Bottom Detail */}
        <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">School E-Mart Experience</p>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthPrompt;
