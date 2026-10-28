import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, Clock, AlertCircle, Loader2, Sparkles, ExternalLink,
  Star, ShieldCheck, ArrowRight, Check
} from 'lucide-react';
import { completeSocialRewardTask, submitSocialRewardForApproval } from '../../../services/parentApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const InstagramIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
  </svg>
);

const COUNTDOWN_SECONDS = 6;

const SocialRewardModal = ({ isOpen, onClose, rewardData, onRefresh }) => {
  const [activeTimerPlatform, setActiveTimerPlatform] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [localTasks, setLocalTasks] = useState({
    instagram: false,
    youtube: false,
    google: false,
  });

  useEffect(() => {
    if (rewardData?.request?.tasks) {
      setLocalTasks({
        instagram: Boolean(rewardData.request.tasks.instagram),
        youtube: Boolean(rewardData.request.tasks.youtube),
        google: Boolean(rewardData.request.tasks.google),
      });
    }
  }, [rewardData]);

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (activeTimerPlatform && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (activeTimerPlatform && timerSeconds === 0) {
      // Timer finished -> complete task on backend
      handleCompleteTask(activeTimerPlatform);
      setActiveTimerPlatform(null);
    }
    return () => clearInterval(interval);
  }, [activeTimerPlatform, timerSeconds]);

  if (!isOpen) return null;

  const urls = rewardData?.urls || {};
  const status = rewardData?.request?.status || 'not_started';
  const hasLifetimeSocialDiscount = Boolean(rewardData?.hasLifetimeSocialDiscount);
  const allTasksCompleted = localTasks.instagram && localTasks.youtube && localTasks.google;

  const handleTaskClick = (platform, url) => {
    if (localTasks[platform] || activeTimerPlatform) return;
    setError('');

    // Open target social platform in a new tab
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    // Start 6-second verification countdown
    setActiveTimerPlatform(platform);
    setTimerSeconds(COUNTDOWN_SECONDS);
  };

  const handleCompleteTask = async (platform) => {
    try {
      await completeSocialRewardTask(platform);
      setLocalTasks((prev) => ({ ...prev, [platform]: true }));
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to record task completion'));
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    setError('');
    try {
      await submitSocialRewardForApproval();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit request for approval'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden text-gray-900 animate-scale-in">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#2F1E74] via-[#432A9C] to-[#5C3ED9] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider w-fit mb-2 border border-amber-400/30">
            <Sparkles size={13} />
            <span>5% Lifetime Privilege Pass</span>
          </div>

          <h2 className="text-xl font-black text-white leading-tight">
            Unlock Flat 5% Off Forever
          </h2>
          <p className="text-xs text-purple-200 mt-1">
            Complete the 3 quick tasks below to get your lifetime savings activated on all school kits & supplies.
          </p>
        </div>

        {/* Status Message Banners */}
        <div className="p-6 space-y-4">
          {hasLifetimeSocialDiscount || status === 'approved' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">🎉 Privilege Pass is Active!</div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Congratulations! 5% discount will automatically be deducted from your cart subtotal on every order.
                </div>
              </div>
            </div>
          ) : status === 'pending_approval' ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <Clock size={22} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="font-bold text-sm">🟡 Under Admin Review</div>
                <div className="text-xs text-amber-700 mt-0.5">
                  Your request has been submitted to admin. Our team verifies submissions promptly and activates your 5% discount pass shortly.
                </div>
              </div>
            </div>
          ) : status === 'rejected' ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <AlertCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Action Needed</div>
                <div className="text-xs text-rose-700 mt-0.5">
                  {rewardData?.request?.rejectionReason || 'Please complete the remaining tasks below to re-submit.'}
                </div>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 3 Tasks List */}
          <div className="space-y-3 pt-1">
            {/* Task 1: Instagram */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <InstagramIcon size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Follow on Instagram</div>
                  <div className="text-[11px] text-gray-500">Follow our official Instagram page</div>
                </div>
              </div>

              {localTasks.instagram ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <Check size={14} strokeWidth={3} /> Done
                </span>
              ) : activeTimerPlatform === 'instagram' ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 animate-pulse">
                  <Loader2 size={13} className="animate-spin" /> Verifying ({timerSeconds}s)
                </span>
              ) : (
                <button
                  onClick={() => handleTaskClick('instagram', urls.instagram)}
                  disabled={Boolean(activeTimerPlatform) || status === 'approved' || status === 'pending_approval'}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-40"
                >
                  Follow
                </button>
              )}
            </div>

            {/* Task 2: YouTube */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <YoutubeIcon size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Subscribe on YouTube</div>
                  <div className="text-[11px] text-gray-500">Subscribe to School E-Mart Channel</div>
                </div>
              </div>

              {localTasks.youtube ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <Check size={14} strokeWidth={3} /> Done
                </span>
              ) : activeTimerPlatform === 'youtube' ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 animate-pulse">
                  <Loader2 size={13} className="animate-spin" /> Verifying ({timerSeconds}s)
                </span>
              ) : (
                <button
                  onClick={() => handleTaskClick('youtube', urls.youtube)}
                  disabled={Boolean(activeTimerPlatform) || status === 'approved' || status === 'pending_approval'}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-40"
                >
                  Subscribe
                </button>
              )}
            </div>

            {/* Task 3: Google Reviews */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Star size={20} className="fill-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">5-Star Google Review</div>
                  <div className="text-[11px] text-gray-500">Leave a review on Google Maps</div>
                </div>
              </div>

              {localTasks.google ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <Check size={14} strokeWidth={3} /> Done
                </span>
              ) : activeTimerPlatform === 'google' ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 animate-pulse">
                  <Loader2 size={13} className="animate-spin" /> Verifying ({timerSeconds}s)
                </span>
              ) : (
                <button
                  onClick={() => handleTaskClick('google', urls.google)}
                  disabled={Boolean(activeTimerPlatform) || status === 'approved' || status === 'pending_approval'}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-40"
                >
                  Review
                </button>
              )}
            </div>
          </div>

          {/* Submission Button */}
          {status !== 'approved' && status !== 'pending_approval' && (
            <div className="pt-2">
              <button
                onClick={handleSubmitForApproval}
                disabled={!allTasksCompleted || submitting || Boolean(activeTimerPlatform)}
                className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                  allTasksCompleted
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/25 active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : allTasksCompleted ? (
                  <>
                    <span>Submit for Admin Approval</span>
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <span>Complete All 3 Tasks Above to Activate</span>
                )}
              </button>
            </div>
          )}

          {/* Footer Terms */}
          <div className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5 pt-1">
            <ShieldCheck size={14} className="text-gray-400" />
            <span>5% lifetime discount applies on all orders • Borne 100% by platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialRewardModal;
