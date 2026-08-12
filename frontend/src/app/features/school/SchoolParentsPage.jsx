import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Users, Loader2, GraduationCap, UserPlus, Mail, Send, CheckCircle2, Pencil, X,
  PhoneCall, Clock, Copy, Check
} from 'lucide-react';
import {
  listParents,
  resendParentWelcome,
  resendParentWelcomeBulk,
  updateParent,
} from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { useSchoolId } from '../../../utils/schoolContext';

// View-only directory: parent accounts are created automatically when a
// student is enrolled with parent details on the Students page.
const SchoolParentsPage = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  const [parents, setParents] = useState([]);
  const [stats, setStats] = useState({ totalParents: 0, loggedInParents: 0, neverLoggedInParents: 0 });
  const [loginStatusFilter, setLoginStatusFilter] = useState('all');
  const [copiedPhone, setCopiedPhone] = useState('');
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
      const res = await listParents(schoolId, {
        limit: 500,
        loginStatus: loginStatusFilter === 'all' ? undefined : loginStatusFilter,
      });
      setParents(res.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setParents([]);
      setError(getErrorMessage(err, 'Unable to load parents'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, loginStatusFilter]);

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

  // Correcting contact details: a parent enrolled without an email (or with a
  // typo'd one) can otherwise never be mailed, and enrollment is the only other
  // place these fields are set.
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = (parent) => {
    setEditing(parent);
    setEditForm({
      name: parent.user?.name || '',
      email: parent.user?.email || '',
      phone: parent.user?.phone || '',
    });
    setEditError('');
  };

  const handleSaveEdit = async () => {
    const email = editForm.email.trim();
    const phone = editForm.phone.trim();
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setEditError('Enter a valid email address');
      return;
    }
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setEditError('Enter a valid 10-digit Indian mobile number');
      return;
    }

    setSaving(true);
    setEditError('');
    try {
      await updateParent(schoolId, editing._id, {
        name: editForm.name.trim(),
        email,
        phone,
      });
      setEditing(null);
      showToast('Parent details updated');
      await loadParents();
    } catch (err) {
      // Surfaces the server's duplicate-email/phone message as-is
      setEditError(getErrorMessage(err, 'Unable to update this parent'));
    } finally {
      setSaving(false);
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

      {/* Edit parent contact details */}
      {editing && (
        <div
          className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-5"
          onClick={() => !saving && setEditing(null)}
        >
          <div
            className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-deep-purple">Edit parent details</h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3.5">
              {[
                { key: 'name', label: 'Name', type: 'text', placeholder: 'Parent name' },
                { key: 'email', label: 'Email address', type: 'email', placeholder: 'parent@example.com' },
                { key: 'phone', label: 'Login phone number', type: 'tel', placeholder: '10-digit mobile' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={editForm[field.key]}
                    placeholder={field.placeholder}
                    onChange={(e) => setEditForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors"
                  />
                </div>
              ))}

              {editError && (
                <p className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {editError}
                </p>
              )}

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-[#3b2d7d] text-white text-xs font-black inline-flex items-center justify-center gap-2 hover:bg-[#33276b] active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
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

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 select-none">
          <button
            type="button"
            onClick={() => setLoginStatusFilter('all')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              loginStatusFilter === 'all'
                ? 'bg-purple-50 border-[#3b2d7d] ring-2 ring-[#3b2d7d]/20'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-gray-400 block">Total Registered</span>
            <span className="text-xl font-black text-[#3b2d7d] mt-1 block">{stats.totalParents}</span>
          </button>

          <button
            type="button"
            onClick={() => setLoginStatusFilter('logged_in')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              loginStatusFilter === 'logged_in'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-emerald-600 block">Logged In Users</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">{stats.loggedInParents}</span>
          </button>

          <button
            type="button"
            onClick={() => setLoginStatusFilter('never_logged_in')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              loginStatusFilter === 'never_logged_in'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-amber-700 block">Never Logged In</span>
            <span className="text-xl font-black text-amber-800 mt-1 block">{stats.neverLoggedInParents}</span>
          </button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="space-y-3">
          <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
            {[
              { key: 'all', label: `All Parents (${stats.totalParents})` },
              { key: 'logged_in', label: `Logged In (${stats.loggedInParents})` },
              { key: 'never_logged_in', label: `Never Logged In (${stats.neverLoggedInParents})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setLoginStatusFilter(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                  loginStatusFilter === tab.key
                    ? 'bg-[#3b2d7d] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

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
              const phone = parent.user?.phone || '';
              const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              const hasLoggedIn = parent.hasLoggedIn;
              return (
                <div
                  key={parent._id || parent.user?._id}
                  className="bg-white border border-gray-150 rounded-[2.2rem] p-5.5 relative flex flex-col justify-between hover:shadow-md transition-all duration-300 w-full group overflow-hidden"
                >
                  <div>
                    {/* Top Row: Avatar + Name + Login Status Badge */}
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
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

                      {/* Login Status Badge */}
                      <div>
                        {hasLoggedIn ? (
                          <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 size={11} /> Logged In
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <Clock size={11} /> Never Logged In
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Contact Info Stack */}
                    <div className="py-3.5 my-3 border-y border-gray-100 text-[11px] font-bold text-gray-500 space-y-2.5 w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-gray-400 text-sm">📞</span>
                          <span className="text-deep-purple font-extrabold">{phone || 'No phone number'}</span>
                          {phone && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(phone);
                                setCopiedPhone(phone);
                                setTimeout(() => setCopiedPhone(''), 2000);
                              }}
                              className="text-gray-400 hover:text-[#3b2d7d] transition-colors"
                              title="Copy mobile number"
                            >
                              {copiedPhone === phone ? <Check size={13} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>

                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black inline-flex items-center gap-1 shadow-sm transition-all"
                          >
                            <PhoneCall size={11} />
                            Call
                          </a>
                        )}
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

                  {/* Resend account/login email, and edit contact details */}
                  <div className="mb-3 space-y-2">
                    {parent.user?.email ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleResend(parent)}
                          disabled={sendingId === parent._id || sendingAll}
                          className="flex-1 py-2.5 rounded-xl border border-[#3b2d7d]/20 bg-[#3b2d7d]/5 text-[#3b2d7d] text-[11px] font-black inline-flex items-center justify-center gap-1.5 hover:bg-[#3b2d7d]/10 active:scale-[0.98] transition-all disabled:opacity-60"
                        >
                          {sendingId === parent._id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Mail size={13} />
                          )}
                          {sendingId === parent._id ? 'Sending…' : 'Send login email'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(parent)}
                          aria-label={`Edit ${name}'s contact details`}
                          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 inline-flex items-center justify-center hover:bg-gray-50 hover:text-[#3b2d7d] active:scale-[0.98] transition-all"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEdit(parent)}
                        className="w-full py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-black inline-flex items-center justify-center gap-1.5 hover:bg-amber-100 active:scale-[0.98] transition-all"
                      >
                        <Pencil size={12} />
                        No email on record — add one
                      </button>
                    )}
                  </div>

                  {/* Bottom Role Info */}
                  <div className="flex items-center justify-between text-[9px] font-black text-purple-300 uppercase tracking-wider w-full">
                    <span>PARENT ACCOUNT</span>
                    {hasLoggedIn && parent.lastLoginAt ? (
                      <span className="text-emerald-600 font-bold">
                        LAST LOGIN: {new Date(parent.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold">
                        NEVER LOGGED IN
                      </span>
                    )}
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
