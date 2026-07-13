import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Users, Loader2, GraduationCap, UserPlus, Mail, Send, CheckCircle2
} from 'lucide-react';
import {
  listParents,
  resendParentWelcome,
  resendParentWelcomeBulk,
} from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { useSchoolId } from '../../../utils/schoolContext';

// View-only directory: parent accounts are created automatically when a
// student is enrolled with parent details on the Students page.
const SchoolParentsPage = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadParents = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      setError('School context is missing. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await listParents(schoolId, { limit: 500 });
      setParents(data || []);
    } catch (err) {
      setParents([]);
      setError(getErrorMessage(err, 'Unable to load parents'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadParents();
  }, [loadParents]);

  // Re-sending the account email: per-parent, or to everyone currently listed.
  const [sendingId, setSendingId] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const handleResend = async (parent) => {
    const parentId = parent._id;
    setSendingId(parentId);
    setError('');
    try {
      await resendParentWelcome(schoolId, parentId);
      showToast(`Login email sent to ${parent.user?.email}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to send the account email'));
    } finally {
      setSendingId(null);
    }
  };

  // Filter parents based on search query
  const filteredParents = parents.filter(p => {
    const name = (p.user?.name || '').toLowerCase();
    const phone = (p.user?.phone || '');
    const email = (p.user?.email || '').toLowerCase();
    const childNames = (p.children || []).map(c => (c.name || '').toLowerCase()).join(' ');
    const search = searchQuery.toLowerCase();
    return name.includes(search) || phone.includes(search) || email.includes(search) || childNames.includes(search);
  });

  // Only parents with an email on record can be mailed at all.
  const emailableParents = filteredParents.filter((p) => p.user?.email);

  const handleResendAll = async () => {
    if (emailableParents.length === 0) return;
    setSendingAll(true);
    setError('');
    try {
      const result = await resendParentWelcomeBulk(
        schoolId,
        emailableParents.map((p) => p._id)
      );
      showToast(
        result?.failedCount
          ? `Sent to ${result.sentCount} parent(s) • ${result.failedCount} failed`
          : `Login email sent to ${result?.sentCount ?? emailableParents.length} parent(s)`
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to send the account emails'));
    } finally {
      setSendingAll(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-12 font-outfit">

      {/* Confirmation toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300 max-w-[90vw]">
          <CheckCircle2 size={16} strokeWidth={3} className="shrink-0" />
          <span className="text-xs font-black truncate">{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#3b2d7d] text-white px-6 py-6 sticky top-0 z-50 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/school/admin')}
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-xl font-black leading-tight">Parent Accounts</h1>
              <span className="text-[12px] text-purple-200 font-bold block mt-1">
                Accounts created automatically during student enrollment
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="px-6 py-6 space-y-6">

        {/* Info strip: how parent accounts get here */}
        <div className="px-4 py-3 bg-purple-50/60 border border-purple-100 rounded-2xl text-[11px] font-bold text-[#3b2d7d]">
          Parent accounts are created automatically when you add a student with parent details.
          To register a new parent,{' '}
          <button
            type="button"
            onClick={() => navigate('/school/students')}
            className="underline font-black"
          >
            enroll a student
          </button>{' '}
          with their name and mobile number.
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center w-full">
          <Search size={16} className="absolute left-4.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parents by name, email, mobile or child..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors placeholder:text-gray-300 shadow-inner"
          />
        </div>

        {/* Bulk resend — send the account/login email to everyone currently listed */}
        {!loading && emailableParents.length > 0 && (
          <div className="bg-white border border-gray-150 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-[12px] font-black text-deep-purple leading-tight">
                Send account &amp; login email
              </h3>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                Tells parents they can log in with their mobile number and an OTP. Safe to send as often as you like.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResendAll}
              disabled={sendingAll}
              className="shrink-0 bg-[#3b2d7d] text-white px-4 py-2.5 rounded-xl text-[11px] font-black shadow-lg shadow-purple-900/10 hover:bg-purple-800 active:scale-95 transition-all inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {sendingAll ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {sendingAll
                ? 'Sending…'
                : `Send to all (${emailableParents.length})`}
            </button>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={loadParents} className="text-red-700 underline shrink-0">Retry</button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="animate-spin text-[#3b2d7d] mb-4" />
            <p className="text-sm text-gray-500 font-bold">Loading parents database...</p>
          </div>
        ) : filteredParents.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-[2.2rem] p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-[#3b2d7d]">
              <Users size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-deep-purple">No Parents Found</h3>
              <p className="text-gray-400 text-sm mt-1">
                {searchQuery
                  ? 'No matches found for your search query.'
                  : 'Parent accounts appear here automatically once you enroll students with parent details.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => navigate('/school/students')}
                className="bg-[#3b2d7d] text-white px-6 py-3 rounded-full text-xs font-black shadow-lg shadow-purple-900/10 hover:bg-purple-800 active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <UserPlus size={14} />
                Enroll a Student
              </button>
            )}
          </div>
        ) : (
          /* Parents Card Grid */
          <div className="space-y-4 w-full">
            {filteredParents.map((parent) => {
              const name = parent.user?.name || 'Unnamed Parent';
              const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <div
                  key={parent._id || parent.user?._id}
                  className="bg-white border border-gray-150 rounded-[2.2rem] p-5.5 relative flex flex-col justify-between hover:shadow-md transition-all duration-300 w-full group overflow-hidden"
                >
                  <div>
                    {/* Top Row: Initials Avatar + Name & Referral Code */}
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Initials Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3b2d7d]/5 to-purple-50 flex items-center justify-center font-black text-[#3b2d7d] text-sm shrink-0 border border-purple-100/50">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[14px] font-black text-deep-purple leading-tight truncate">
                            {name}
                          </h3>
                          {parent.referralCode && (
                            <span className="inline-block bg-purple-50 text-[#3b2d7d] text-[9px] font-black rounded-lg border border-purple-100 px-2 py-0.5 mt-1 uppercase tracking-wider">
                              Ref: {parent.referralCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Contact Info Stack */}
                    <div className="py-3.5 my-3 border-y border-gray-100 text-[11px] font-bold text-gray-500 space-y-2.5 w-full">
                      <div className="flex items-center gap-2.5">
                        <span className="text-gray-400 text-sm">📞</span>
                        <span className="text-deep-purple">{parent.user?.phone || 'No phone number'}</span>
                      </div>
                      {parent.user?.email && (
                        <div className="flex items-center gap-2.5">
                          <span className="text-gray-400 text-sm">✉️</span>
                          <span className="text-deep-purple break-all">{parent.user.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5">
                        <span className="text-gray-400 text-sm">🪪</span>
                        <span className="font-black text-[#3b2d7d]">{parent.user?.refId || '—'}</span>
                      </div>
                    </div>

                    {/* Linked children */}
                    <div className="mb-3">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">Linked Students</span>
                      {(parent.children || []).length === 0 ? (
                        <span className="text-[11px] font-bold text-gray-300">No students linked yet</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {parent.children.map((child) => (
                            <span
                              key={child._id}
                              className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black rounded-xl px-2.5 py-1"
                            >
                              <GraduationCap size={11} />
                              {child.name}
                              {child.grade ? ` • ${child.grade}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resend account/login email */}
                  <div className="mb-3">
                    {parent.user?.email ? (
                      <button
                        type="button"
                        onClick={() => handleResend(parent)}
                        disabled={sendingId === parent._id || sendingAll}
                        className="w-full py-2.5 rounded-xl border border-[#3b2d7d]/20 bg-[#3b2d7d]/5 text-[#3b2d7d] text-[11px] font-black inline-flex items-center justify-center gap-1.5 hover:bg-[#3b2d7d]/10 active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        {sendingId === parent._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Mail size={13} />
                        )}
                        {sendingId === parent._id ? 'Sending…' : 'Send login email'}
                      </button>
                    ) : (
                      <p className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-center">
                        No email on record — add one to send login details
                      </p>
                    )}
                  </div>

                  {/* Bottom Role Info */}
                  <div className="flex items-center justify-between text-[9px] font-black text-purple-300 uppercase tracking-wider w-full">
                    <span>PARENT ACCOUNT</span>
                    <span className="text-emerald-500 flex items-center gap-1 font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default SchoolParentsPage;
