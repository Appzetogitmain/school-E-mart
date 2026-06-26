import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, MessageSquare, Book, User, 
  Star, Check, Volume2, Send, Loader2
} from 'lucide-react';
import { createDiaryEntry } from '../../../services/schoolApi';
import { parseClassGrade, parseSection } from '../../../utils/mappers/teacherMapper';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { useTeacherSchoolId } from '../../../utils/teacherContext';
import { useTeacherClassOptions } from '../../../hooks/useTeacherClassOptions';

const TeacherDiary = () => {
  const navigate = useNavigate();
  const schoolId = useTeacherSchoolId();
  const { classLabels, getSections } = useTeacherClassOptions(schoolId);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  // Note Type: 'general', 'homework', 'behaviour', 'appreciation'
  const [noteType, setNoteType] = useState('general');
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  // Visibility: 'class' (Entire Class), 'students' (Selected Students)
  const [visibility, setVisibility] = useState('class');
  
  // Priority: 'normal', 'important', 'urgent'
  const [priority, setPriority] = useState('important');
  
  // Toggle for parent push notification
  const [notifyParents, setNotifyParents] = useState(true);
  
  // Schedule: 'now', 'later'
  const [schedule, setSchedule] = useState('now');
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const classes = classLabels;
  const sections = getSections(selectedClass);

  useEffect(() => {
    if (classLabels.length > 0 && !selectedClass) {
      setSelectedClass(classLabels[0]);
      const secs = getSections(classLabels[0]);
      if (secs.length > 0) setSelectedSection(secs[0]);
    }
  }, [classLabels, getSections, selectedClass]);

  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);

  // Note type metadata helper
  const getNoteTypeDetails = () => {
    switch (noteType) {
      case 'general':
        return { label: 'General Note', color: 'bg-purple-500', text: 'text-purple-500', bg: 'bg-purple-50' };
      case 'homework':
        return { label: 'Homework Reminder', color: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-50' };
      case 'behaviour':
        return { label: 'Behaviour', color: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-50' };
      case 'appreciation':
        return { label: 'Appreciation', color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-50' };
      default:
        return { label: 'Special Note', color: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-50' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Please enter a title and diary message.');
      return;
    }
    if (visibility === 'students') {
      setError('Selected-student notes are not available yet. Use Entire Class.');
      return;
    }
    if (!schoolId) {
      setError('School context is missing. Please sign in again.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createDiaryEntry(schoolId, {
        title: title.trim(),
        content: message.trim(),
        classGrade: parseClassGrade(selectedClass),
        section: parseSection(selectedSection),
      });
      setToastMessage('Diary note published successfully.');
      setShowToast(true);
      setTitle('');
      setMessage('');
      setTimeout(() => {
        setShowToast(false);
        navigate('/school/teacher/dashboard');
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to publish diary note'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen select-none font-outfit animate-in fade-in duration-300 pb-28 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-6 duration-300">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Check size={14} strokeWidth={3} />
          </div>
          <span className="text-xs font-black">{toastMessage || 'Diary note published successfully.'}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="px-6 pt-7 pb-4 bg-white flex items-center justify-between border-b border-gray-100 relative z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/school/teacher/dashboard')}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex items-center justify-center text-deep-purple mr-1"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-lg font-black text-deep-purple leading-none">Add Diary Note</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-1">Share a note with parents</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-6 mt-4 relative z-20">
        
        {/* 2. Class & Section Dropdown Selectors */}
        <div className="grid grid-cols-2 gap-4">
          {/* Class Selector */}
          <div className="relative">
            <label className="text-[10px] font-bold text-gray-400 block mb-1">Class</label>
            <button 
              type="button"
              onClick={() => { setIsClassOpen(!isClassOpen); setIsSectionOpen(false); }}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
            >
              <span className="text-xs font-black text-deep-purple">{selectedClass}</span>
              <span className="text-gray-400 text-xs">▼</span>
            </button>
            {isClassOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsClassOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {classes.map(cls => (
                    <button 
                      key={cls}
                      type="button"
                      onClick={() => { setSelectedClass(cls); setIsClassOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all ${selectedClass === cls ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Section Selector */}
          <div className="relative">
            <label className="text-[10px] font-bold text-gray-400 block mb-1">Section</label>
            <button 
              type="button"
              onClick={() => { setIsSectionOpen(!isSectionOpen); setIsClassOpen(false); }}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 hover:border-primary/20 active:bg-gray-50 rounded-2xl text-left flex items-center justify-between shadow-sm transition-all"
            >
              <span className="text-xs font-black text-deep-purple">{selectedSection}</span>
              <span className="text-gray-400 text-xs">▼</span>
            </button>
            {isSectionOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSectionOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {sections.map(sec => (
                    <button 
                      key={sec}
                      type="button"
                      onClick={() => { setSelectedSection(sec); setIsSectionOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all ${selectedSection === sec ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Note Type Selector Grid */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1.5">Note Type *</label>
          <div className="grid grid-cols-4 gap-2">
            
            {/* General Note */}
            <button 
              type="button"
              onClick={() => setNoteType('general')}
              className={`p-2 rounded-2xl flex flex-col items-center justify-center text-center transition-all border ${
                noteType === 'general' 
                  ? 'bg-purple-50/50 border-primary ring-2 ring-primary/10 shadow-md shadow-purple-50' 
                  : 'bg-white border-gray-200 hover:bg-gray-50/50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mb-1 shrink-0 relative">
                <MessageSquare size={14} className="text-primary" />
                {noteType === 'general' && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full" />}
              </div>
              <span className="text-[8px] font-black text-deep-purple tracking-tight leading-none">General Note</span>
            </button>

            {/* Homework Reminder */}
            <button 
              type="button"
              onClick={() => setNoteType('homework')}
              className={`p-2 rounded-2xl flex flex-col items-center justify-center text-center transition-all border ${
                noteType === 'homework' 
                  ? 'bg-orange-50/50 border-orange-400 ring-2 ring-orange-450/10 shadow-md shadow-orange-50' 
                  : 'bg-white border-gray-200 hover:bg-gray-50/50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mb-1 shrink-0 relative">
                <Book size={14} className="text-orange-500" />
                {noteType === 'homework' && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full" />}
              </div>
              <span className="text-[8px] font-black text-deep-purple tracking-tight leading-none">Homework</span>
            </button>

            {/* Behaviour */}
            <button 
              type="button"
              onClick={() => setNoteType('behaviour')}
              className={`p-2 rounded-2xl flex flex-col items-center justify-center text-center transition-all border ${
                noteType === 'behaviour' 
                  ? 'bg-rose-50/50 border-rose-450 ring-2 ring-rose-450/10 shadow-md shadow-rose-50' 
                  : 'bg-white border-gray-200 hover:bg-gray-50/50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mb-1 shrink-0 relative">
                <User size={14} className="text-rose-500" />
                {noteType === 'behaviour' && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />}
              </div>
              <span className="text-[8px] font-black text-deep-purple tracking-tight leading-none">Behaviour</span>
            </button>

            {/* Appreciation */}
            <button 
              type="button"
              onClick={() => setNoteType('appreciation')}
              className={`p-2 rounded-2xl flex flex-col items-center justify-center text-center transition-all border ${
                noteType === 'appreciation' 
                  ? 'bg-emerald-50/50 border-emerald-450 ring-2 ring-emerald-450/10 shadow-md shadow-emerald-50' 
                  : 'bg-white border-gray-200 hover:bg-gray-50/50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-1 shrink-0 relative">
                <Star size={14} className="text-emerald-500" />
                {noteType === 'appreciation' && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}
              </div>
              <span className="text-[8px] font-black text-deep-purple tracking-tight leading-none">Appreciation</span>
            </button>

          </div>
        </div>

        {/* 4. Title Input */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative">
          <label className="text-[10px] font-bold text-gray-400 block mb-1">Title *</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            required
            className="w-full text-xs font-black text-deep-purple focus:outline-none bg-transparent pr-12"
            placeholder="e.g. Science Exhibition Tomorrow"
          />
          <span className="absolute bottom-4 right-4 text-[9px] font-bold text-gray-400">
            {title.length}/100
          </span>
        </div>

        {/* 5. Diary Message */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative">
          <label className="text-[10px] font-bold text-gray-400 block mb-1">Diary Message *</label>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            required
            className="w-full text-xs font-bold text-deep-purple focus:outline-none bg-transparent h-28 resize-none pr-12 pt-1.5 transition-all"
            placeholder="Write your note description or message here..."
          />
          <span className="absolute bottom-4 right-4 text-[9px] font-bold text-gray-400">
            {message.length}/500
          </span>
        </div>


        {/* 7. Visibility Radio Cards */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={() => setVisibility('class')}
            className={`p-3.5 bg-white border rounded-2xl flex items-start gap-2.5 text-left transition-all ${
              visibility === 'class' 
                ? 'border-primary ring-2 ring-primary/10 shadow-md' 
                : 'border-gray-200 hover:bg-gray-50/50'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
              visibility === 'class' ? 'border-primary text-primary' : 'border-gray-300'
            }`}>
              {visibility === 'class' && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-deep-purple flex items-center gap-1">
                <Users size={12} className="text-primary shrink-0" /> Entire Class
              </span>
              <p className="text-[8px] text-gray-400 font-bold leading-normal mt-1">Visible to all students & parents in class</p>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setVisibility('students')}
            className={`p-3.5 bg-white border rounded-2xl flex items-start gap-2.5 text-left transition-all ${
              visibility === 'students' 
                ? 'border-primary ring-2 ring-primary/10 shadow-md' 
                : 'border-gray-200 hover:bg-gray-50/50'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
              visibility === 'students' ? 'border-primary text-primary' : 'border-gray-300'
            }`}>
              {visibility === 'students' && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-deep-purple flex items-center gap-1">
                <User size={12} className="text-primary shrink-0" /> Selected Students
              </span>
              <p className="text-[8px] text-gray-400 font-bold leading-normal mt-1">Visible to selected students only</p>
            </div>
          </button>
        </div>

        {/* 8. Priority Capsules & 9. Notify Parents toggle side-by-side/grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Priority */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
            <span className="text-[9px] font-bold text-gray-400 block mb-2 leading-none">Priority</span>
            <div className="flex gap-1.5">
              
              <button 
                type="button"
                onClick={() => setPriority('normal')}
                className={`flex-1 py-1 rounded-xl text-[8px] font-black border transition-all ${
                  priority === 'normal' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-450 ring-1 ring-emerald-400/25' 
                    : 'bg-gray-50/50 text-gray-400 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Normal
              </button>

              <button 
                type="button"
                onClick={() => setPriority('important')}
                className={`flex-1 py-1 rounded-xl text-[8px] font-black border transition-all ${
                  priority === 'important' 
                    ? 'bg-orange-50 text-orange-600 border-orange-450 ring-1 ring-orange-400/25' 
                    : 'bg-gray-50/50 text-gray-400 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Important
              </button>

              <button 
                type="button"
                onClick={() => setPriority('urgent')}
                className={`flex-1 py-1 rounded-xl text-[8px] font-black border transition-all ${
                  priority === 'urgent' 
                    ? 'bg-rose-50 text-rose-600 border-rose-450 ring-1 ring-rose-400/25' 
                    : 'bg-gray-50/50 text-gray-400 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Urgent
              </button>

            </div>
          </div>

          {/* Notify Parents Toggle */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Volume2 size={14} className="text-primary animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-gray-400 block leading-none">Notify Parents</span>
                <span className="text-[7px] text-gray-400 font-bold block mt-0.5 leading-none">Push notification</span>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => setNotifyParents(!notifyParents)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                notifyParents ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                notifyParents ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

        </div>


        {/* 11. Live Parents Preview Card */}
        <div className="mt-2.5">
          <label className="text-[10px] font-bold text-gray-400 block mb-1.5">Preview (How parents will see)</label>
          <div className="bg-[#FAF9FF] border border-[#ECE9FC] rounded-2xl p-4 shadow-sm space-y-3">
            
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-xs font-black text-deep-purple block leading-none">Mrs. Neha Sharma</span>
                  <span className="text-[8px] text-gray-450 font-bold mt-1 block leading-none">{selectedClass} - Section {selectedSection}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${getNoteTypeDetails().bg} ${getNoteTypeDetails().text}`}>
                  {getNoteTypeDetails().label}
                </span>
                
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  priority === 'urgent' 
                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                    : priority === 'important'
                      ? 'bg-orange-50 text-orange-600 border-orange-200'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  {priority}
                </span>
              </div>
            </div>

            {/* Note text content */}
            <div className="space-y-1">
              <h3 className="text-xs font-black text-deep-purple leading-snug">
                {title || 'Untitled Diary Note'}
              </h3>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed break-words whitespace-pre-line">
                {message || 'Type message above to preview description details here...'}
              </p>
            </div>

            {/* Date Footer details */}
            <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-[7px] text-gray-400 font-bold uppercase tracking-wider">
              <span>{schedule === 'now' ? 'Published Just Now' : 'Scheduled for later'}</span>
              <span>12 May 2025 • 10:30 AM</span>
            </div>

          </div>
        </div>

      </form>

      {error && (
        <p className="px-6 text-[10px] font-bold text-red-500 text-center">{error}</p>
      )}

      {/* 12. Add Diary Note Primary Button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 z-40">
        <button 
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-4 bg-primary text-white hover:bg-deep-purple active:scale-98 transition-all rounded-[1.8rem] text-sm font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.5} />}
          <span>{saving ? 'Publishing...' : 'Publish Diary Note'}</span>
        </button>
      </div>

    </div>
  );
};

export default TeacherDiary;
