import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Loader2, Plus, Pencil, Trash2, MapPin, Users, CheckCircle2, X,
} from 'lucide-react';
import { listEvents, deleteEvent } from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { useSchoolId } from '../../../utils/schoolContext';

// Events could previously only be created — the "Events & Calendar" menu promised
// management but linked straight to the create form, so nothing could be
// corrected or removed once published.
const formatWhen = (event) => {
  if (!event?.startDate) return 'Date not set';
  const start = new Date(event.startDate);
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  const date = start.toLocaleDateString('en-IN', opts);
  const time = start.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${date} • ${time}`;
};

const SchoolEventsPage = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadEvents = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      setError('School context is missing. Please log in again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await listEvents(schoolId, { limit: 200 });
      setEvents(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setEvents([]);
      setError(getErrorMessage(err, 'Unable to load events'));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDelete = async (event) => {
    setDeletingId(event._id);
    setError('');
    try {
      await deleteEvent(schoolId, event._id);
      setConfirming(null);
      showToast('Event deleted');
      await loadEvents();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete this event'));
      setConfirming(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-12 font-outfit">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 max-w-[90vw]">
          <CheckCircle2 size={16} strokeWidth={3} className="shrink-0" />
          <span className="text-xs font-black truncate">{toast}</span>
        </div>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-5"
          onClick={() => !deletingId && setConfirming(null)}
        >
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-deep-purple">Delete this event?</h3>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={!!deletingId}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-60"
              >
                <X size={15} />
              </button>
            </div>
            <p className="text-[11px] font-bold text-gray-500 mb-5">
              “{confirming.title}” will be removed from the school calendar. This cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={!!deletingId}
                className="flex-1 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 text-xs font-black disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirming)}
                disabled={!!deletingId}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white text-xs font-black inline-flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-60"
              >
                {deletingId && <Loader2 size={13} className="animate-spin" />}
                {deletingId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#3b2d7d] text-white px-6 py-6 sticky top-0 z-50 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/school/more')}
              aria-label="Back"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight">Events & Calendar</h1>
              <p className="text-[11px] font-bold text-white/60 mt-0.5">
                {loading ? 'Loading…' : `${events.length} event${events.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/school/create-event')}
            aria-label="Create event"
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      <div className="px-5 pt-5">
        {error && (
          <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20 text-[#3b2d7d]">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm font-black text-gray-400">No events yet</p>
            <button
              type="button"
              onClick={() => navigate('/school/create-event')}
              className="mt-4 px-5 py-2.5 rounded-2xl bg-[#3b2d7d] text-white text-[11px] font-black"
            >
              Create the first event
            </button>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {events.map((event) => (
              <div
                key={event._id}
                className="bg-white border border-gray-150 rounded-[1.8rem] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-black text-deep-purple leading-tight truncate">
                      {event.title}
                    </h3>
                    <p className="text-[11px] font-bold text-gray-400 mt-1">{formatWhen(event)}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#3b2d7d] bg-purple-50 border border-purple-100 rounded-lg px-2 py-1 shrink-0">
                    {event.eventType || 'General'}
                  </span>
                </div>

                {event.description && (
                  <p className="text-[11px] font-bold text-gray-500 mt-2.5 line-clamp-2">{event.description}</p>
                )}

                <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-bold text-gray-400">
                  {event.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={11} /> {event.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={11} /> {event.targetAudience || 'all'}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/school/create-event?eventId=${event._id}`)}
                    className="flex-1 py-2.5 rounded-xl border border-[#3b2d7d]/20 bg-[#3b2d7d]/5 text-[#3b2d7d] text-[11px] font-black inline-flex items-center justify-center gap-1.5 hover:bg-[#3b2d7d]/10 active:scale-[0.98] transition-all"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(event)}
                    aria-label={`Delete ${event.title}`}
                    className="px-3.5 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-600 inline-flex items-center justify-center hover:bg-red-100 active:scale-[0.98] transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolEventsPage;
