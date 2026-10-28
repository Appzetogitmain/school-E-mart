import React, { useState, useEffect, useCallback } from 'react';
import {
  Award, Save, Loader2, CheckCircle2, AlertCircle, Phone, ExternalLink,
  Search, Check, X, Clock, RefreshCw, UserCheck, ShieldAlert
} from 'lucide-react';
import {
  getSocialRewardConfig,
  updateSocialRewardConfig,
  getSocialRewardRequests,
  approveSocialRewardRequest,
  rejectSocialRewardRequest
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

const InstagramIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
  </svg>
);

const SocialRewardsManagement = () => {
  // Configuration State
  const [isActive, setIsActive] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(5);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');

  // Requests Table State
  const [requests, setRequests] = useState([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // UI State
  const [configLoading, setConfigLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // Load Config
  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const config = await getSocialRewardConfig();
      if (config) {
        setIsActive(Boolean(config.isActive));
        setDiscountPercent(config.discountPercent || 5);
        setInstagramUrl(config.instagramUrl || '');
        setYoutubeUrl(config.youtubeUrl || '');
        setGoogleReviewUrl(config.googleReviewUrl || '');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load reward configuration'));
    } finally {
      setConfigLoading(false);
    }
  }, []);

  // Load Requests Table
  const loadRequests = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await getSocialRewardRequests({
        page,
        limit,
        status: statusFilter,
        search,
      });
      setRequests(res.data || []);
      setTotalRequests(res.pagination?.total || 0);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load customer requests'));
    } finally {
      setTableLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Instant Auto-Save for Master Program Switch
  const handleToggleActive = async (newVal) => {
    setIsActive(newVal);
    setError('');
    try {
      await updateSocialRewardConfig({
        isActive: newVal,
        discountPercent: Number(discountPercent) || 5,
        instagramUrl: instagramUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
      });
      showToast(newVal ? '5% Privilege Program is now Live & Active!' : '5% Privilege Program is now Disabled across the app.');
    } catch (err) {
      setIsActive(!newVal);
      setError(getErrorMessage(err, 'Failed to update program switch'));
    }
  };

  // Handle Save Configuration
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    setError('');
    try {
      await updateSocialRewardConfig({
        isActive,
        discountPercent: Number(discountPercent) || 5,
        instagramUrl: instagramUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
      });
      showToast('Program configuration & links updated successfully!');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save configuration'));
    } finally {
      setSavingConfig(false);
    }
  };

  // Handle Approve Request
  const handleApprove = async (id, name) => {
    if (!window.confirm(`Are you sure you want to approve 5% lifetime discount for ${name}?`)) {
      return;
    }
    setActionLoadingId(id);
    try {
      await approveSocialRewardRequest(id);
      showToast(`Discount approved for ${name}!`);
      loadRequests();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to approve request'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Request
  const handleReject = async (id, name) => {
    const reason = window.prompt(`Enter rejection reason for ${name}:`, 'Incomplete social tasks verification');
    if (reason === null) return;

    setActionLoadingId(id);
    try {
      await rejectSocialRewardRequest(id, reason);
      showToast(`Request rejected for ${name}.`);
      loadRequests();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to reject request'));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white shadow-xl animate-fade-in font-medium text-sm">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">5% Lifetime Social Privilege Program</h1>
              <p className="text-sm text-gray-500">
                Manage social follow links, master activation switch, and review parent reward approvals.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
            isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {isActive ? 'Program Live & Active' : 'Program Disabled'}
          </span>
          <button
            onClick={() => { loadConfig(); loadRequests(); }}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Master Configuration Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>⚙️ Program Configuration & Links</span>
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Set social profile destinations. Disabling the master switch will automatically hide the Golden Card from parent app and deactivate discount at cart/checkout.
        </p>

        {configLoading ? (
          <div className="py-12 flex justify-center items-center text-gray-400 gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span>Loading program settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200/70">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Master Program Switch</div>
                  <div className="text-xs text-gray-500">Enable or disable 5% reward card across the entire app</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => handleToggleActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5B3FD6]"></div>
                </label>
              </div>

              {/* Discount Percentage */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Lifetime Discount Percent (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 font-bold text-center focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6] outline-none"
                    required
                  />
                  <span className="text-xs text-gray-500 font-medium">Applied on subtotal, absorbed 100% by platform</span>
                </div>
              </div>

              {/* Instagram URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <InstagramIcon size={14} className="text-pink-600" />
                  Instagram Profile URL
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/schoolemart"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6] outline-none"
                  required
                />
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <YoutubeIcon size={14} className="text-red-600" />
                  YouTube Channel URL
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@schoolemart"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6] outline-none"
                  required
                />
              </div>

              {/* Google Review Link */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ExternalLink size={14} className="text-blue-600" />
                  Google Review / Maps URL
                </label>
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/schoolemart/review"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6] outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5B3FD6] hover:bg-[#4C34B8] text-white font-medium text-sm transition shadow-sm disabled:opacity-50"
              >
                {savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Program Settings</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Section 2: Customer Approvals & Lead Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>👥 Customer Submissions & Approval Queue</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#5B3FD6] text-xs font-semibold">
                {totalRequests} Total
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Verify customer social follows, call parents directly for relationship building, and approve their 5% lifetime pass.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[260px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, phone, school..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#5B3FD6]/20 focus:border-[#5B3FD6] outline-none"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending_approval', label: 'Pending Approval' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'in_progress', label: 'In Progress (Tasks Incomplete)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'border-[#5B3FD6] text-[#5B3FD6] bg-purple-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {tableLoading ? (
            <div className="py-16 flex flex-col justify-center items-center text-gray-400 gap-2">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-sm">Loading customer requests...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <UserCheck size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No requests found in this view.</p>
              <p className="text-xs text-gray-400 mt-1">When parents complete the 3 social tasks on their app, their requests will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Customer & Phone</th>
                  <th className="py-3 px-6">School / Child</th>
                  <th className="py-3 px-6 text-center">Tasks Status</th>
                  <th className="py-3 px-6">Submitted Date</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50/50 transition">
                    {/* Customer & Direct Phone Calling */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{req.customerName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{req.phone}</span>
                        <a
                          href={`tel:${req.phone}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition"
                          title="Call parent directly"
                        >
                          <Phone size={11} />
                          <span>Call</span>
                        </a>
                      </div>
                    </td>

                    {/* School / Child info */}
                    <td className="py-4 px-6">
                      <div className="text-xs font-medium text-gray-800">{req.schoolName || 'General Parent'}</div>
                      <div className="text-[11px] text-gray-400">{req.studentName ? `Child: ${req.studentName}` : 'No child linked'}</div>
                    </td>

                    {/* Tasks Checklist */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          title={req.tasks?.instagram ? 'Instagram: Completed' : 'Instagram: Pending'}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            req.tasks?.instagram ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-300'
                          }`}
                        >
                          IG
                        </span>
                        <span
                          title={req.tasks?.youtube ? 'YouTube: Completed' : 'YouTube: Pending'}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            req.tasks?.youtube ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-300'
                          }`}
                        >
                          YT
                        </span>
                        <span
                          title={req.tasks?.google ? 'Google Review: Completed' : 'Google Review: Pending'}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            req.tasks?.google ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-300'
                          }`}
                        >
                          G
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-xs text-gray-500">
                      {req.submittedAt ? (
                        <div>
                          <div>{new Date(req.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div className="text-[11px] text-gray-400">{new Date(req.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">In progress</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      {req.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={12} strokeWidth={3} /> Approved (Active)
                        </span>
                      )}
                      {req.status === 'pending_approval' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          <Clock size={12} /> Pending Approval
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200" title={req.rejectionReason}>
                          <X size={12} strokeWidth={3} /> Rejected
                        </span>
                      )}
                      {req.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          In Progress
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      {actionLoadingId === req._id ? (
                        <Loader2 size={16} className="animate-spin inline text-[#5B3FD6]" />
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          {req.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(req._id, req.customerName)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm"
                            >
                              Approve
                            </button>
                          )}
                          {req.status !== 'rejected' && (
                            <button
                              onClick={() => handleReject(req._id, req.customerName)}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalRequests > limit && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing page {page} of {Math.ceil(totalRequests / limit)}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(totalRequests / limit)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialRewardsManagement;
