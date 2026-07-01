import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Eye, X, School, MapPin, Mail, User, Check, Ban, RefreshCw, Loader2, GraduationCap,
} from 'lucide-react';
import {
  listSchools,
  listPendingSchools,
  approveSchool,
  rejectSchool,
  suspendSchool,
  reactivateSchool,
} from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapAdminSchoolForList } from '../../../utils/mappers/adminSchoolMapper';

const TAB_STATUS_MAP = {
  Pending: 'prospect',
  Active: 'active',
  Suspended: 'suspended',
};

const SchoolListManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [showCount, setShowCount] = useState(10);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);

  const loadSchools = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };

      let response;
      if (activeTab === 'Pending') {
        response = await listPendingSchools(params);
      } else {
        const status = TAB_STATUS_MAP[activeTab];
        if (status) params.partnerStatus = status;
        response = await listSchools(params);
      }

      setSchools((response.data || []).map(mapAdminSchoolForList));
    } catch (err) {
      setSchools([]);
      setError(getErrorMessage(err, 'Unable to load schools'));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const runSchoolAction = async (school, action) => {
    if (!school?.mongoId) return;
    setActionId(school.mongoId);
    try {
      if (action === 'approve') await approveSchool(school.mongoId, {});
      if (action === 'reject') await rejectSchool(school.mongoId, { reason: 'Rejected by admin' });
      if (action === 'suspend') await suspendSchool(school.mongoId, { reason: 'Suspended by admin' });
      if (action === 'reactivate') await reactivateSchool(school.mongoId, {});
      await loadSchools();
      if (selectedSchool?.mongoId === school.mongoId) {
        setSelectedSchool(null);
      }
    } catch (err) {
      alert(getErrorMessage(err, `Unable to ${action} school`));
    } finally {
      setActionId(null);
    }
  };

  const filteredSchools = schools.filter((school) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      school.name.toLowerCase().includes(term) ||
      school.code.toLowerCase().includes(term) ||
      school.id.toLowerCase().includes(term) ||
      school.adminEmail.toLowerCase().includes(term) ||
      school.city.toLowerCase().includes(term)
    );
  });

  const totalCount = schools.length;
  const activeCount = schools.filter((s) => s.statusRaw === 'active').length;
  const pendingCount = schools.filter((s) => s.statusRaw === 'prospect').length;
  const suspendedCount = schools.filter((s) => s.statusRaw === 'suspended').length;

  const getStatusStyle = (status) => {
    if (status === 'Active') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Suspended') return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">School Management</h1>
            <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none">
              PARTNERS
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">
            Review partner schools, approve registrations, and manage access status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
            <School size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Schools</span>
            <span className="text-2xl font-black text-gray-900">{totalCount}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600">
            <Check size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active</span>
            <span className="text-2xl font-black text-gray-900">{activeCount}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-600">
            <GraduationCap size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pending</span>
            <span className="text-2xl font-black text-gray-900">{pendingCount}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-600">
            <Ban size={22} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Suspended</span>
            <span className="text-2xl font-black text-gray-900">{suspendedCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/75 p-3 flex flex-wrap gap-2 select-none shadow-sm">
        {['All', 'Pending', 'Active', 'Suspended'].map((tab) => {
          const isActive = activeTab === tab;
          let count = schools.length;
          if (tab === 'Pending') count = pendingCount;
          if (tab === 'Active') count = activeCount;
          if (tab === 'Suspended') count = suspendedCount;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                isActive
                  ? 'bg-[#0B1528] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200/60'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/75 p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none shadow-sm">
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-bold text-gray-400">Show</span>
          <select
            value={showCount}
            onChange={(e) => setShowCount(parseInt(e.target.value, 10))}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <span className="text-xs font-bold text-gray-400">entries</span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search school name, code, email..."
            className="w-full bg-[#F8F9FB]/60 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-gray-400 font-medium"
          />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[1.25rem] border border-gray-250/60 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span className="text-sm font-bold">Loading schools…</span>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200/80 rounded-2xl shadow-inner bg-[#FCFDFE]">
            <table className="w-full text-left text-xs font-semibold text-gray-600 border-collapse select-none">
              <thead>
                <tr className="border-b border-gray-250 bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-4 px-5">Ref No</th>
                  <th className="py-4 px-5">School Name</th>
                  <th className="py-4 px-5">Principal</th>
                  <th className="py-4 px-5">Contact</th>
                  <th className="py-4 px-5">Location</th>
                  <th className="py-4 px-5">Grades</th>
                  <th className="py-4 px-5">Registered</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-xs font-black text-gray-400">
                      No school records found.
                    </td>
                  </tr>
                ) : (
                  filteredSchools.slice(0, showCount).map((school) => (
                    <tr key={school.mongoId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-[#0B1528] text-xs">{school.id}</span>
                      </td>
                      <td className="py-4 px-5">
                        <div>
                          <span className="font-extrabold text-gray-800 text-xs block">{school.name}</span>
                          <span className="text-[9px] text-gray-400 font-bold">{school.code}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs font-bold text-gray-700">{school.principalName}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-[10px] font-bold text-gray-600">{school.adminEmail}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-[10px] font-bold text-gray-600">{school.city}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs font-extrabold text-gray-700">{school.gradesCount}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-[10px] font-bold text-gray-500">{school.registeredOn}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${getStatusStyle(school.status)}`}>
                          {school.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right pr-6">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedSchool(school)}
                            title="View school details"
                            className="w-7 h-7 rounded-xl border border-gray-250/60 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center transition-all"
                          >
                            <Eye size={12} className="stroke-[2.5]" />
                          </button>

                          {school.statusRaw === 'prospect' && (
                            <>
                              <button
                                type="button"
                                disabled={actionId === school.mongoId}
                                onClick={() => runSchoolAction(school, 'approve')}
                                title="Approve school"
                                className="w-7 h-7 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all disabled:opacity-50"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={actionId === school.mongoId}
                                onClick={() => runSchoolAction(school, 'reject')}
                                title="Reject school"
                                className="w-7 h-7 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all disabled:opacity-50"
                              >
                                <X size={12} />
                              </button>
                            </>
                          )}

                          {school.statusRaw === 'active' && (
                            <button
                              type="button"
                              disabled={actionId === school.mongoId}
                              onClick={() => runSchoolAction(school, 'suspend')}
                              title="Suspend school"
                              className="w-7 h-7 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all disabled:opacity-50"
                            >
                              <Ban size={12} />
                            </button>
                          )}

                          {school.statusRaw === 'suspended' && (
                            <button
                              type="button"
                              disabled={actionId === school.mongoId}
                              onClick={() => runSchoolAction(school, 'reactivate')}
                              title="Reactivate school"
                              className="w-7 h-7 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all disabled:opacity-50"
                            >
                              <RefreshCw size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSchool && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6">
              <div>
                <h3 className="text-base font-black text-[#0B1528]">{selectedSchool.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">School partner profile</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchool(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusStyle(selectedSchool.status)}`}>
                  {selectedSchool.status}
                </span>
                <span className="text-xs font-bold text-gray-400">Ref: {selectedSchool.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <School size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">School Code</span>
                  </div>
                  <p className="text-sm font-extrabold text-gray-800">{selectedSchool.code}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <User size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Principal</span>
                  </div>
                  <p className="text-sm font-extrabold text-gray-800">{selectedSchool.principalName}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Mail size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Admin Email</span>
                  </div>
                  <p className="text-sm font-extrabold text-gray-800 break-all">{selectedSchool.adminEmail}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <MapPin size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Address</span>
                  </div>
                  <p className="text-sm font-extrabold text-gray-800">{selectedSchool.addressLine}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <GraduationCap size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Academic Year</span>
                  </div>
                  <p className="text-sm font-extrabold text-gray-800">{selectedSchool.academicYear}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <GraduationCap size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Grades / Classes</span>
                  </div>
                  <p className="text-sm font-extrabold text-gray-800">
                    {selectedSchool.gradesCount} grades · {selectedSchool.classesCount} classes
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-end gap-2">
              {selectedSchool.statusRaw === 'prospect' && (
                <>
                  <button
                    type="button"
                    disabled={actionId === selectedSchool.mongoId}
                    onClick={() => runSchoolAction(selectedSchool, 'approve')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionId === selectedSchool.mongoId}
                    onClick={() => runSchoolAction(selectedSchool, 'reject')}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedSchool.statusRaw === 'active' && (
                <button
                  type="button"
                  disabled={actionId === selectedSchool.mongoId}
                  onClick={() => runSchoolAction(selectedSchool, 'suspend')}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 disabled:opacity-50"
                >
                  Suspend
                </button>
              )}
              {selectedSchool.statusRaw === 'suspended' && (
                <button
                  type="button"
                  disabled={actionId === selectedSchool.mongoId}
                  onClick={() => runSchoolAction(selectedSchool, 'reactivate')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 disabled:opacity-50"
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SchoolListManagement;
