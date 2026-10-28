import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { getSocialRewardStatus } from '../../../services/parentApi';
import useAuthStore from '../../../store/useAuthStore';
import SocialRewardModal from './SocialRewardModal';

const ParentPrivilegeCard = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [rewardData, setRewardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getSocialRewardStatus();
      setRewardData(data);
    } catch {
      // If endpoint fails, keep silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus, isAuthenticated]);

  // Master Toggle: if admin disabled the program, hide card completely
  if (loading || !rewardData?.isActive) {
    return null;
  }

  const isApproved = Boolean(rewardData?.hasLifetimeSocialDiscount || rewardData?.request?.status === 'approved');
  const isPending = rewardData?.request?.status === 'pending_approval';
  const tasks = rewardData?.request?.tasks || {};
  const completedCount = [tasks.instagram, tasks.youtube, tasks.google].filter(Boolean).length;
  const pendingCount = 3 - completedCount;

  const handleCardClick = () => {
    if (!isAuthenticated) {
      navigate('/user/login');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="px-6 mt-6">
        <div
          onClick={handleCardClick}
          className="relative rounded-[2.5rem] p-1.5 overflow-hidden cursor-pointer shadow-xl shadow-purple-950/15 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 group border border-purple-200/40 bg-gradient-to-r from-amber-400/30 via-purple-600/30 to-amber-500/30"
        >
          {/* Main Card Graphic Container */}
          <div className="relative rounded-[2.2rem] overflow-hidden bg-[#2D1B75] text-white">
            <img
              src="/assets/school_privilege_card.png"
              alt="School E-Mart Parent Privilege Pass"
              className="w-full h-auto object-cover block select-none pointer-events-none group-hover:brightness-105 transition-all duration-300"
            />

            {/* Dynamic Status Pill Overlay at top */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md backdrop-blur-md">
              {isApproved ? (
                <span className="bg-emerald-500/90 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-emerald-400">
                  <CheckCircle2 size={13} className="stroke-[3]" /> 5% Discount Active
                </span>
              ) : isPending ? (
                <span className="bg-amber-500/90 text-amber-950 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-amber-300 animate-pulse">
                  <Clock size={13} /> Pending Approval
                </span>
              ) : completedCount > 0 ? (
                <span className="bg-purple-900/80 text-amber-300 px-3 py-1 rounded-full flex items-center gap-1 border border-amber-400/40">
                  <Sparkles size={13} /> {pendingCount} Task{pendingCount > 1 ? 's' : ''} Pending
                </span>
              ) : (
                <span className="bg-amber-400 text-purple-950 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm font-black group-hover:bg-amber-300 transition-colors">
                  <Sparkles size={12} /> Tap to Activate
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      <SocialRewardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rewardData={rewardData}
        onRefresh={fetchStatus}
      />
    </>
  );
};

export default ParentPrivilegeCard;
