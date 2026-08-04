import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, Bookmark, Edit2, 
  Tag, Flag, FileText, Paperclip, Info, BookOpen, 
  Trash2, Plus, Save, File, Check, Loader2, Award
} from 'lucide-react';
import { createAssignment } from '../../../services/lmsApi';
import { listSubjects } from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { parseClassGrade, parseSection } from '../../../utils/mappers/teacherMapper';
import { ensureCourse } from '../../../utils/teacherApiHelpers';
import { useAuthUser, useTeacherSchoolId } from '../../../utils/teacherContext';
import { useTeacherClassOptions } from '../../../hooks/useTeacherClassOptions';
import { filesToCompressedDataUrls, validateSubmissionFiles } from '../../../utils/fileUpload';

const TeacherHomework = () => {
  const navigate = useNavigate();
  const schoolId = useTeacherSchoolId();
  const authUser = useAuthUser();
  const { classLabels, getSections } = useTeacherClassOptions(schoolId);
  const fileInputRef = React.useRef(null);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectsList, setSubjectsList] = useState([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!schoolId) return;
    listSubjects(schoolId)
      .then((res) => {
        const labels = (res.data || []).map((s) => s.label).filter(Boolean);
        setSubjectsList(labels);
        if (labels.length > 0) {
          setSubject((prev) => (prev && labels.includes(prev) ? prev : labels[0]));
        }
      })
      .catch(() => setSubjectsList([]));
  }, [schoolId]);

  const [dateAssigned, setDateAssigned] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [homeworkType, setHomeworkType] = useState('Written');
  const [priority, setPriority] = useState('High');
  // The score the teacher grades out of. Previously fixed at 100, which made it
  // impossible to set homework marked out of anything else.
  const [maxScore, setMaxScore] = useState('100');
  
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  
  const [textbook, setTextbook] = useState('');
  const [chapter, setChapter] = useState('');
  
  // Attachments Mock State (Starts empty)
  const [attachments, setAttachments] = useState([]);

  const [showToast, setShowToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const classes = classLabels;
  const sections = getSections(selectedClass);
  const subjects = subjectsList;
  const homeworkTypes = ['Written', 'Reading', 'Project', 'Online Quiz'];
  const priorities = ['High', 'Medium', 'Low'];

  // 2. Dropdown Toggles
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  // Handlers
  const handleDeleteAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  useEffect(() => {
    if (classLabels.length > 0 && !selectedClass) {
      setSelectedClass(classLabels[0]);
      const secs = getSections(classLabels[0]);
      if (secs.length > 0) setSelectedSection(secs[0]);
    }
  }, [classLabels, getSections, selectedClass]);

  const handleAddAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleAttachmentSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validationError = validateSubmissionFiles([
      ...attachments.map((att) => att.file),
      ...files,
    ]);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    const newAttachments = files.map((file, idx) => ({
      id: Date.now() + idx,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      file,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const handleAddHomework = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a homework title');
      return;
    }
    if (!schoolId) {
      setError('School context is missing. Please log in again.');
      return;
    }

    const parsedMaxScore = Number(maxScore);
    if (!Number.isFinite(parsedMaxScore) || parsedMaxScore <= 0) {
      setError('Enter the marks this homework is out of');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const classGrade = parseClassGrade(selectedClass);
      const section = parseSection(selectedSection);
      const course = await ensureCourse(schoolId, {
        classGrade,
        section,
        subject,
        instructorName: authUser?.name,
        instructorUserId: authUser?.id,
      });

      const reference = {
        ...(textbook.trim() ? { textbook: textbook.trim() } : {}),
        ...(chapter.trim() ? { chapter: chapter.trim() } : {}),
      };

      const files = await filesToCompressedDataUrls(attachments.map((att) => att.file));

      await createAssignment(schoolId, course._id || course.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        dueDate: dueDate || undefined,
        assignedDate: dateAssigned || undefined,
        classGrade,
        section,
        homeworkType,
        priority,
        ...(Object.keys(reference).length ? { reference } : {}),
        maxScore: parsedMaxScore,
        status: 'published',
        files,
      });

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/school/teacher/dashboard');
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to add homework'));
    } finally {
      setSaving(false);
    }
  };

  // Helper: Format nice day left subtext
  const getDaysLeft = () => {
    if (!dateAssigned || !dueDate) return '';
    const d1 = new Date(dateAssigned);
    const d2 = new Date(dueDate);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `( ${diffDays} DAYS LEFT )`;
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen select-none font-outfit animate-in fade-in duration-300 pb-28 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-6 duration-300">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Check size={14} strokeWidth={3} />
          </div>
          <span className="text-xs font-black">Homework Added Successfully!</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="px-6 pt-7 pb-4 bg-white flex items-center border-b border-gray-100 relative z-30">
        <button 
          onClick={() => navigate('/school/teacher/dashboard')}
          className="w-10 h-10 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex items-center justify-center text-deep-purple mr-4"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="text-lg font-black text-deep-purple leading-none">Add Homework</h1>
      </div>

      <form onSubmit={handleAddHomework} className="space-y-4 px-6 mt-4 relative z-20">
        {error && (
          <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600">
            {error}
          </div>
        )}
        
        {/* 2. Class & Section Dropdown Selectors */}
        <div className="grid grid-cols-2 gap-4">
          {/* Class Dropdown */}
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

          {/* Section Dropdown */}
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

        {/* 3. Subject Selector */}
        <div className="relative">
          <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Bookmark size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-gray-400 block leading-none">Subject *</span>
              <button 
                type="button"
                onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                className="w-full text-left text-xs font-black text-deep-purple mt-1 flex items-center justify-between"
              >
                <span>{subject}</span>
                <span className="text-gray-400 text-xs mr-1">▼</span>
              </button>
            </div>
          </div>
          {isSubjectOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSubjectOpen(false)} />
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {subjects.map(sub => (
                  <button 
                    key={sub}
                    type="button"
                    onClick={() => { setSubject(sub); setIsSubjectOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all ${subject === sub ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 4. Homework Title */}
        <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <Edit2 size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold text-gray-400 block leading-none mb-1">Homework Title *</span>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full text-xs font-black text-deep-purple focus:outline-none placeholder-gray-400"
              placeholder="e.g. Fractions Worksheet"
            />
          </div>
        </div>

        {/* 5. Assigned Date & Due Date Fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* Assigned Date */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm relative">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold text-gray-400 block leading-none">Date Assigned *</span>
              <input 
                type="date"
                value={dateAssigned}
                onChange={(e) => setDateAssigned(e.target.value)}
                required
                className="w-full text-[10px] font-black text-deep-purple mt-1 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col justify-between shadow-sm relative">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-gray-400 block leading-none">Due Date *</span>
                <input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full text-[10px] font-black text-deep-purple mt-1 focus:outline-none bg-transparent"
                />
              </div>
            </div>
            {dateAssigned && dueDate && (
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-wider block mt-1.5 pl-0.5">
                {getDaysLeft()}
              </span>
            )}
          </div>
        </div>

        {/* 5b. Marks this homework is graded out of */}
        <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <Award size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-gray-400 block leading-none">Total Marks *</span>
            <input
              type="number"
              min={1}
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              required
              className="w-full text-xs font-black text-deep-purple mt-1 focus:outline-none bg-transparent"
              placeholder="e.g. 20"
            />
          </div>
        </div>

        {/* 6. Type and Priority Selectors */}
        <div className="grid grid-cols-2 gap-4">
          {/* Homework Type Dropdown */}
          <div className="relative">
            <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Tag size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-gray-400 block leading-none">Homework Type *</span>
                <button 
                  type="button"
                  onClick={() => { setIsTypeOpen(!isTypeOpen); setIsPriorityOpen(false); }}
                  className="w-full text-left text-[11px] font-black text-deep-purple mt-1 flex items-center justify-between"
                >
                  <span className="truncate">{homeworkType}</span>
                  <span className="text-gray-400 text-[10px] ml-1">▼</span>
                </button>
              </div>
            </div>
            {isTypeOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsTypeOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {homeworkTypes.map(type => (
                    <button 
                      key={type}
                      type="button"
                      onClick={() => { setHomeworkType(type); setIsTypeOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all ${homeworkType === type ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Priority Dropdown */}
          <div className="relative">
            <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Flag size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-gray-400 block leading-none">Priority *</span>
                <button 
                  type="button"
                  onClick={() => { setIsPriorityOpen(!isPriorityOpen); setIsTypeOpen(false); }}
                  className="w-full text-left text-[11px] font-black text-deep-purple mt-1 flex items-center justify-between"
                >
                  <span className="truncate">{priority}</span>
                  <span className="text-gray-400 text-[10px] ml-1">▼</span>
                </button>
              </div>
            </div>
            {isPriorityOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsPriorityOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {priorities.map(prio => (
                    <button 
                      key={prio}
                      type="button"
                      onClick={() => { setPriority(prio); setIsPriorityOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all ${priority === prio ? 'text-primary bg-primary/5 font-black' : 'text-deep-purple hover:bg-gray-50'}`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 7. Homework Description */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block leading-none">Homework Description *</span>
              <span className="text-[8px] text-gray-400 mt-1 block">Describe the homework details</span>
            </div>
          </div>
          
          <div className="relative">
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              required
              className="w-full p-4 bg-gray-50/50 border border-gray-150 focus:border-primary/20 focus:outline-none rounded-2xl text-xs font-bold text-deep-purple placeholder-gray-400 h-28 resize-none transition-all"
              placeholder="Enter comprehensive homework description..."
            />
            <span className="absolute bottom-3.5 right-4 text-[9px] font-bold text-gray-400">
              {description.length}/500
            </span>
          </div>
        </div>

        {/* 8. Attachments */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Paperclip size={18} className="text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block leading-none">Attachments</span>
              <span className="text-[8px] text-gray-400 mt-1 block">Upload helpful references or PDFs</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between bg-red-50/60 border border-red-100 rounded-xl px-3 py-2 flex-1 min-w-[160px] max-w-[220px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <File size={16} className="text-red-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-deep-purple truncate">{att.name}</p>
                        <p className="text-[8px] text-gray-400 font-bold leading-none mt-0.5">{att.size}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="text-red-400 hover:text-red-600 active:scale-90 transition-all p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleAttachmentSelected}
            />
            <button
              type="button"
              onClick={handleAddAttachment}
              className="w-32 py-2 border border-dashed border-primary/45 hover:border-primary active:scale-95 transition-all rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black text-primary bg-primary/5 shadow-sm"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Add More</span>
            </button>
          </div>
        </div>

        {/* 9. Instructions for Students */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Info size={18} className="text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block leading-none">Instructions for Students</span>
              <span className="text-[8px] text-gray-400 mt-1 block">Helpful guidance points</span>
            </div>
          </div>
          
          <div className="relative">
            <textarea 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value.slice(0, 500))}
              className="w-full p-4 bg-gray-50/50 border border-gray-150 focus:border-primary/20 focus:outline-none rounded-2xl text-xs font-bold text-deep-purple placeholder-gray-400 h-28 resize-none transition-all"
              placeholder="e.g. • Show all working steps..."
            />
            <span className="absolute bottom-3.5 right-4 text-[9px] font-bold text-gray-400">
              {instructions.length}/500
            </span>
          </div>
        </div>

        {/* 10. Reference (Optional) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block leading-none">Reference (Optional)</span>
              <span className="text-[8px] text-gray-400 mt-1 block">Textbook or chapter names</span>
            </div>
          </div>
          
          <div className="space-y-2.5 pt-1">
            <div>
              <label className="text-[9px] font-bold text-gray-400 block mb-1">Textbook</label>
              <input 
                type="text" 
                value={textbook}
                onChange={(e) => setTextbook(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-150 focus:border-primary/20 focus:outline-none rounded-xl text-xs font-bold text-deep-purple"
                placeholder="e.g. Mathematics - Grade 5"
              />
            </div>
            
            <div>
              <label className="text-[9px] font-bold text-gray-400 block mb-1">Chapter (Optional)</label>
              <input 
                type="text" 
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-150 focus:border-primary/20 focus:outline-none rounded-xl text-xs font-bold text-deep-purple"
                placeholder="e.g. Fractions and Decimals"
              />
            </div>
          </div>
        </div>

      </form>

      {/* 11. Add Homework Primary Button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 z-40">
        <button 
          type="submit"
          onClick={handleAddHomework}
          disabled={saving}
          className="w-full py-4 bg-primary text-white hover:bg-deep-purple active:scale-98 transition-all rounded-[1.8rem] text-sm font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} strokeWidth={2.5} />}
          <span>{saving ? 'Saving...' : 'Add Homework'}</span>
        </button>
      </div>

    </div>
  );
};

export default TeacherHomework;
