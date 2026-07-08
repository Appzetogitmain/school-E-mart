import React, { useState, useEffect, useCallback } from 'react';
import { LifeBuoy, Send, Loader2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import {
  listSupportTopics,
  listMySupportTickets,
  createSupportTicket,
  getMySupportTicket,
  replyToSupportTicket,
} from '../../services/supportApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import useAuthStore from '../../store/useAuthStore';

const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-600',
  pending_customer: 'bg-amber-50 text-amber-600',
  pending_internal: 'bg-purple-50 text-purple-600',
  resolved: 'bg-emerald-50 text-emerald-600',
  closed: 'bg-gray-100 text-gray-500',
};

const SupportTickets = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [topics, setTopics] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New ticket form
  const [showForm, setShowForm] = useState(false);
  const [topicId, setTopicId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Expanded thread
  const [expandedId, setExpandedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [topicList, ticketResult] = await Promise.all([
        listSupportTopics().catch(() => []),
        listMySupportTickets({ limit: 50 }).catch(() => ({ data: [] })),
      ]);
      setTopics(topicList);
      if (topicList.length && !topicId) setTopicId(topicList[0]._id);
      setTickets(ticketResult.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your tickets'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, topicId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!topicId || !subject.trim() || !body.trim()) {
      setError('Please choose a topic and fill in the subject and message.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createSupportTicket({ topicId, subject: subject.trim(), body: body.trim() });
      setSubject('');
      setBody('');
      setShowForm(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to submit ticket'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleThread = async (ticketId) => {
    if (expandedId === ticketId) {
      setExpandedId(null);
      setThread(null);
      return;
    }
    setExpandedId(ticketId);
    setThread(null);
    try {
      const t = await getMySupportTicket(ticketId);
      setThread(t);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load conversation'));
    }
  };

  const handleReply = async (ticketId) => {
    if (!replyBody.trim()) return;
    setReplying(true);
    try {
      const updated = await replyToSupportTicket(ticketId, replyBody.trim());
      setThread(updated);
      setReplyBody('');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to send reply'));
    } finally {
      setReplying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm mb-20 text-center">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <LifeBuoy size={28} />
        </div>
        <h2 className="text-2xl font-bold text-deep-purple mb-2">Raise a Support Ticket</h2>
        <p className="text-text-secondary font-normal">Please log in to create and track your support tickets.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm mb-20">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <LifeBuoy size={24} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-deep-purple">My Support Tickets</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-2xl p-6 mb-8 space-y-4 border border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Topic</label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {topics.length === 0 && <option value="">No topics available</option>}
              {topics.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Message</label>
            <textarea
              rows="4"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your issue in detail…"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
            >
              <Send size={15} /> {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">You have no support tickets yet.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.ticketId} className="border border-gray-100 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleThread(t.ticketId)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-deep-purple truncate">{t.subject || 'Support request'}</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status] || 'bg-gray-100 text-gray-500'}`}>
                      {(t.status || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary font-normal mt-1 truncate">{t.lastMessage}</p>
                </div>
                {expandedId === t.ticketId ? <ChevronUp className="text-gray-400 shrink-0" /> : <ChevronDown className="text-gray-300 shrink-0" />}
              </button>

              {expandedId === t.ticketId && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  {!thread ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={22} className="animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 py-4 max-h-72 overflow-y-auto">
                        {thread.messages.map((m) => {
                          const mine = String(m.senderUserId) === String(thread.ownerUserId);
                          return (
                            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-primary text-white' : 'bg-gray-100 text-text-primary'}`}>
                                <p className="font-normal whitespace-pre-wrap break-words">{m.body}</p>
                                <span className={`block text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-gray-400'}`}>
                                  {m.audit?.createdAt ? new Date(m.audit.createdAt).toLocaleString() : ''}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {t.status !== 'closed' && (
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Type a reply…"
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <button
                            type="button"
                            onClick={() => handleReply(t.ticketId)}
                            disabled={replying}
                            className="bg-primary text-white p-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all"
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
