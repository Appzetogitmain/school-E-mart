import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Copy, Share2,
  Users, Gift, ShoppingBag,
  CheckCircle2, Clock, Sparkles, LogIn
} from 'lucide-react';

const ReferEarnPage = () => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Generate or retrieve unique referral code (Only for non-guests)
  const [referralCode] = useState(() => {
    if (isGuest) return null;
    const saved = localStorage.getItem('referral_code');
    // Re-generate if no code or if old code contains letters (only want EMART + 4 numbers)
    const isValid = saved && /^EMART\d{4}$/.test(saved);
    if (isValid) return saved;
    
    // Generate new: EMART + 4 random numbers
    const digits = '0123456789';
    let code = 'EMART';
    for (let i = 0; i < 4; i++) {
      code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    localStorage.setItem('referral_code', code);
    return code;
  });

  const referral = {
    code: referralCode,
    totalEarnings: "1,250",
    monthlyEarnings: "450",
    successfulReferrals: 12,
    pendingReferrals: 3
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referral.code);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'School E-Mart Referral',
      text: `Join me on School E-Mart and get exclusive rewards on your first school kit! Use my code: ${referral.code}`,
      url: 'https://schoolemart.app/join'
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyCode(); // Fallback to copy if share API not available
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-32 font-outfit relative overflow-x-hidden">
      {/* Toast Notification */}
      {showCopyToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top duration-300">
          <div className="bg-black/90 text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md border border-white/10">
            <CheckCircle2 size={16} className="text-green-400" />
            <span className="text-xs font-bold">Referral code copied!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-deep-purple">Refer & Earn</h1>
      </div>

      <div className="pt-20 px-6 space-y-8">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary to-[#8C75FF] rounded-[2.5rem] p-8 text-white overflow-hidden shadow-xl shadow-primary/20 animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30 animate-bounce-gentle">
              <Gift size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-medium mb-3">Invite Friends &<br />Earn Rewards</h2>
            <p className="text-white/70 text-sm font-light leading-relaxed max-w-[240px] mx-auto">
              Share your referral code and earn rewards when your friends place their first order
            </p>
          </div>
        </section>

        {/* Referral Code Card */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-gray-50 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          {isGuest ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogIn size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-black text-deep-purple mb-2">Sign in to Start Earning</h3>
              <p className="text-gray-400 text-xs font-medium mb-8 leading-relaxed max-w-[200px] mx-auto">
                Login now to generate your unique referral code and start inviting friends.
              </p>
              <button 
                onClick={() => navigate('/user/login')}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Login / Register
              </button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-4">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Your Referral Code</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-black text-deep-purple tracking-tight">{referral.code}</span>
                  <button 
                    onClick={handleCopyCode}
                    className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary active:scale-90 transition-all"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>
              
              <button 
                onClick={handleShare}
                className="w-full py-5 bg-primary text-white rounded-2xl text-sm font-medium shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Share2 size={18} /> Share & Invite Friends
              </button>
            </>
          )}
        </section>

        {/* Earnings Summary */}
        <section className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Your Earnings</h3>
          <div className="bg-golden-yellow/10 rounded-[2.5rem] p-8 border border-golden-yellow/20 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-golden-yellow/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div>
              <p className="text-[10px] font-black text-golden-yellow uppercase tracking-widest mb-1">This Month</p>
              <p className="text-2xl font-black text-deep-purple">₹{isGuest ? '0' : referral.monthlyEarnings}</p>
            </div>
            <div className="w-px h-12 bg-golden-yellow/20"></div>
            <div className="text-right">
              <p className="text-[10px] font-black text-golden-yellow uppercase tracking-widest mb-1">Total Earned</p>
              <p className="text-2xl font-black text-primary">₹{isGuest ? '0' : referral.totalEarnings}</p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">How it Works</h3>
          <div className="space-y-8 relative pl-4">
            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gray-100"></div>

            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary border border-gray-50 shrink-0">
                <Share2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-deep-purple mb-1">Invite Friends</h4>
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Share your unique referral link with your friends and family.</p>
              </div>
            </div>

            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary border border-gray-100 shrink-0">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-deep-purple mb-1">Friend Orders</h4>
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Your friend signs up and places their very first order on the app.</p>
              </div>
            </div>

            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-golden-yellow/20 shadow-md flex items-center justify-center text-golden-yellow border border-golden-yellow/10 shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-deep-purple mb-1">You Both Earn</h4>
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Both you and your friend get instant rewards added to your wallets!</p>
              </div>
            </div>
          </div>
        </section>

        {/* Referral Stats */}
        <section className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-300 pb-12">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Your Referrals</h3>
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Successful</span>
              </div>
              <p className="text-2xl font-black text-deep-purple">{referral.successfulReferrals}</p>
            </div>
            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Clock size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
              </div>
              <p className="text-2xl font-black text-deep-purple">{referral.pendingReferrals}</p>
            </div>
          </div>
        </section>
      </div>

      <style>
        {`
          @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-bounce-gentle {
            animation: bounce-gentle 3s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default ReferEarnPage;
