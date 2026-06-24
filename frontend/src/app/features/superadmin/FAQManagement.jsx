import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  HelpCircle, Edit3, Trash2, Plus, Download, Search, X, ChevronRight, CheckCircle, Loader2
} from 'lucide-react';
import { listFaqs, createFaq, updateFaq, deleteFaq } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapFaqForAdmin } from '../../../utils/mappers/adminCmsMapper';

const FAQManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form states (Add)
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Form states (Edit Modal)
  const [editingFaq, setEditingFaq] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  // Filtering states
  const [showCount, setShowCount] = useState('10');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listFaqs({ limit: 100 });
      setFaqs((data || []).map(mapFaqForAdmin));
    } catch (err) {
      setFaqs([]);
      setError(getErrorMessage(err, 'Unable to load FAQs'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const handleAddFaq = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      alert('Please fill out both FAQ Question and Answer.');
      return;
    }

    setSaving(true);
    try {
      const created = await createFaq({
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
        category: 'General',
        audience: 'all',
        status: 'active',
      });
      setFaqs((prev) => [...prev, mapFaqForAdmin(created)]);
      setNewQuestion('');
      setNewAnswer('');
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to create FAQ'));
    } finally {
      setSaving(false);
    }
  };

  // Trigger edit modal
  const handleStartEdit = (faq) => {
    setEditingFaq(faq);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editQuestion.trim() || !editAnswer.trim() || !editingFaq?.mongoId) {
      alert('Please fill out both FAQ Question and Answer.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateFaq(editingFaq.mongoId, {
        question: editQuestion.trim(),
        answer: editAnswer.trim(),
      });
      setFaqs((prev) =>
        prev.map((f) => (f.mongoId === editingFaq.mongoId ? mapFaqForAdmin(updated) : f))
      );
      setEditingFaq(null);
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to update FAQ'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (faq) => {
    if (!window.confirm('Are you sure you want to delete this FAQ entry?')) return;
    try {
      await deleteFaq(faq.mongoId || faq.id);
      setFaqs((prev) => prev.filter((f) => f.mongoId !== faq.mongoId));
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to delete FAQ'));
    }
  };

  // Export FAQ CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,FAQ Question,FAQ Answer\n';
    
    filteredFaqs.forEach(f => {
      csvContent += `${f.id},"${f.question.replace(/"/g, '""')}","${f.answer.replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faq_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search filter
  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">FAQ</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              KNOWLEDGE BASE
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Manage frequently asked questions, customer support guidelines, and merchant catalog help pages.</p>
        </div>

        {/* Breadcrumb right align */}
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Home</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">Dashboard</span>
        </div>
      </div>

      {/* TWO COLUMN GRID PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ADD FAQ */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider border-b border-gray-100 pb-3 select-none">
            Add FAQ
          </h3>

          <form onSubmit={handleAddFaq} className="space-y-4 text-xs font-bold text-gray-700">
            
            {/* FAQ Question */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">FAQ Question</label>
              <input
                type="text"
                required
                placeholder="Enter FAQ Question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
            </div>

            {/* FAQ Answer */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">FAQ Answer</label>
              <textarea
                rows="6"
                required
                placeholder="Enter FAQ Answer"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-semibold"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 select-none">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-xs"
              >
                <Plus size={13} className="stroke-[2.5]" />
                <span>Add FAQ</span>
              </button>
            </div>

          </form>

        </div>

        {/* RIGHT COLUMN: VIEW FAQ LIST */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider border-b border-gray-100 pb-3 select-none">
            View FAQ
          </h3>

          {/* Filtering control row */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-gray-600 select-none pb-2 border-b border-gray-50">
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Show</span>
              <select
                value={showCount}
                onChange={(e) => setShowCount(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none cursor-pointer font-bold"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            {/* Export CSV & Search Input */}
            <div className="flex items-center gap-3">
              
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 bg-white border border-[#0B1528] hover:bg-gray-50 text-[#0B1528] px-4 py-2 rounded-xl transition-all shadow-2xs font-extrabold"
              >
                <Download size={13} className="text-indigo-600" />
                <span>Export</span>
              </button>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search:"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-xs font-bold"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

            </div>

          </div>

          {/* TABLE LOG MATRIX */}
          <div className="overflow-x-auto border border-gray-150 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                  <th className="px-4 py-3 w-20">ID</th>
                  <th className="px-4 py-3">FAQ Question</th>
                  <th className="px-4 py-3">FAQ Answer</th>
                  <th className="px-4 py-3 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
                {filteredFaqs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400 font-extrabold select-none">
                      No FAQs recorded in this category.
                    </td>
                  </tr>
                ) : (
                  filteredFaqs.slice(0, parseInt(showCount)).map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Hex ID */}
                      <td className="px-4 py-4 text-gray-400 font-extrabold tabular-nums select-all">
                        {f.id}
                      </td>

                      {/* FAQ Question */}
                      <td className="px-4 py-4 text-gray-900 font-extrabold select-text">
                        {f.question}
                      </td>

                      {/* FAQ Answer */}
                      <td className="px-4 py-4 text-gray-400 font-medium max-w-[240px] truncate select-text">
                        {f.answer}
                      </td>

                      {/* Actions side-by-side */}
                      <td className="px-4 py-4 text-center select-none whitespace-nowrap">
                        <div className="inline-flex gap-2">
                          
                          {/* Edit button (black background) */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(f)}
                            className="bg-black hover:bg-slate-800 text-white p-2 rounded-xl shadow-xs transition-all"
                          >
                            <Edit3 size={12} className="stroke-[2.5]" />
                          </button>

                          {/* Delete button (red background) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteFaq(f)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow-xs transition-all"
                          >
                            <X size={12} className="stroke-[2.5]" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer pagination */}
          <div className="flex items-center justify-between gap-4 select-none pt-2 text-xs font-bold text-gray-500">
            <span>
              Showing 1 to {Math.min(filteredFaqs.length, parseInt(showCount))} of {filteredFaqs.length} entries
            </span>

            <div className="inline-flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 cursor-pointer">
                &lt;
              </button>
              <span className="w-8 h-8 rounded-lg bg-[#0B1528] text-white flex items-center justify-center text-xs font-black shadow-xs">
                {currentPage}
              </span>
              <button className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 cursor-pointer">
                &gt;
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* CENTERED EDIT FAQ MODAL DIALOG */}
      {editingFaq && createPortal(
        <div className="fixed inset-0 bg-[#0B1528]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] select-none animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-250 shadow-2xl max-w-md w-full overflow-hidden text-left transform scale-100 transition-all">
            
            {/* Title Banner */}
            <div className="bg-[#0B1528] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Edit FAQ</h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Modify query ID: #{editingFaq.id}.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs font-bold text-gray-700">
              
              {/* Question field */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">FAQ Question</label>
                <input
                  type="text"
                  required
                  placeholder="Enter FAQ Question"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
                />
              </div>

              {/* Answer field */}
              <div className="space-y-1.5">
                <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">FAQ Answer</label>
                <textarea
                  rows="5"
                  required
                  placeholder="Enter FAQ Answer"
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-semibold"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs transition-all"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* FOOTER COPYRIGHT BAR */}
      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">Healthy Delight</span>
        </p>
      </div>

    </div>
  );
};

export default FAQManagement;
