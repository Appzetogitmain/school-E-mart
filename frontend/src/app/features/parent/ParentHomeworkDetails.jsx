import React, { useState } from 'react';
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Tag,
  Flag,
  FileText,
  Download,
  BookOpen,
  Bell,
  Users,
  Check,
  Bookmark,
  UploadCloud,
  Image,
  Trash2,
  Award,
  Loader2
} from 'lucide-react';
import { submitHomework } from '../../../services/parentApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import {
  filesToCompressedDataUrls,
  validateSubmissionFiles,
  MAX_FILES,
} from '../../../utils/fileUpload';

const ParentHomeworkDetails = ({ homework, childInfo, onClose, onSubmitted }) => {
  const [reminderSet, setReminderSet] = useState(false);
  const [error, setError] = useState('');

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [note, setNote] = useState('');
  // Raw API status: 'submitted' | 'graded' | 'returned' | null. Never a display label —
  // comparing these against capitalised text is what previously let a parent silently
  // overwrite work they had already handed in.
  const [submissionStatus, setSubmissionStatus] = useState(homework?.submissionStatus || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isGraded = submissionStatus === 'graded';
  const isReturned = submissionStatus === 'returned';
  const isSubmitted = submissionStatus === 'submitted';
  // Graded work is final. Returned work is explicitly being asked for again.
  const canSubmit = !isGraded && !isSubmitted;

  const statusLabel = isGraded
    ? 'Checked'
    : isReturned
      ? 'Needs Revision'
      : isSubmitted
        ? 'Submitted'
        : 'Not Submitted';

  const handleSetReminder = () => {
    setReminderSet(true);
    setTimeout(() => {
      alert('Reminder Set: You will be notified 1 day before the due date.');
    }, 400);
  };

  // Upload Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Catch what the server would reject anyway, before the parent sits through an
    // upload that ends in a failure.
    const validationError = validateSubmissionFiles([
      ...uploadedFiles.map((f) => f.raw),
      ...files,
    ]);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    const newFiles = files.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      url: URL.createObjectURL(file),
      raw: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDeleteFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUploadHomework = async () => {
    if (uploadedFiles.length === 0 && !note.trim()) {
      setError('Attach the completed homework or add a note for the teacher.');
      return;
    }

    const schoolId = childInfo?.schoolId;
    if (!schoolId || !homework?.courseId || !homework?.id) {
      setError('School or homework context is missing.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      // The teacher can only grade what actually reaches the server, so send the
      // files themselves rather than a placeholder note.
      const files = await filesToCompressedDataUrls(uploadedFiles.map((f) => f.raw));

      const submission = await submitHomework(schoolId, homework.courseId, homework.id, {
        studentId: childInfo?.studentId || undefined,
        content: note.trim() || undefined,
        files,
      });

      setSubmissionStatus(submission?.status || 'submitted');
      onSubmitted?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to submit homework. Course enrollment may be required.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#FAFAFC] z-50 flex flex-col font-outfit overflow-y-auto w-full animate-fade-in pb-24">
      {/* 1. Header Navigation Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 shrink-0 sticky top-0 z-30">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-90 transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h2 className="text-sm font-black text-gray-800">Homework Details</h2>
          <p className="text-[10px] font-bold text-gray-400">
            {[homework.classSection, homework.subject].filter((v) => v && v !== '—').join(' • ')}
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-4">

        {/* 2. Top Summary Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col md:flex-row gap-5 relative overflow-hidden">

          {/* Main Visual Image Column */}
          <div className="relative w-full md:w-36 aspect-video md:h-36 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100/50 shrink-0">
            <img
              src={homework.image || "/assets/math_homework.png"}
              alt={homework.subject}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=350&q=80";
              }}
            />

            {/* Priority Pill inside Image */}
            {homework.priority && (
              <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                homework.priority === 'High'
                  ? 'bg-[#FEF3F2] text-[#D93025] border-[#D93025]/10'
                  : homework.priority === 'Medium'
                    ? 'bg-[#FFF6ED] text-[#F2994A] border-[#F2994A]/10'
                    : 'bg-[#EBFBF0] text-[#34A853] border-[#34A853]/10'
              }`}>
                {homework.priority} Priority
              </span>
            )}
          </div>

          {/* Core Info Details Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F4EBFF] text-[#7F56D9] flex items-center justify-center">
                  <Bookmark size={15} />
                </div>
                <h3 className="text-base font-black text-gray-800 tracking-tight leading-none">
                  {homework.subject}
                </h3>
              </div>

              <span className="px-2.5 py-1 bg-[#FFF6ED] text-[#F2994A] rounded-xl text-[10px] font-black tracking-tight border border-[#F2994A]/10">
                {homework.status || 'Due Soon'}
              </span>
            </div>

            <p className="text-xs font-bold text-gray-600 mt-3 leading-relaxed">
              {homework.description}
            </p>

            {/* List coordinates metadata */}
            <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2.5 text-xs">

              {/* Assigned Date */}
              <div className="flex items-center">
                <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-300" />
                  <span>Date Assigned</span>
                </span>
                <span className="text-gray-700 font-extrabold">: {homework.assignedDate}</span>
              </div>

              {/* Due Date */}
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5">
                    <Clock size={13} className="text-gray-300" />
                    <span>Due Date</span>
                  </span>
                  <span className="text-gray-700 font-extrabold">: {homework.dueDate}</span>
                </div>
                {homework.daysRemaining && homework.daysRemaining !== '—' && (
                  <span className="text-[10px] font-black text-[#F2994A] ml-24 mt-0.5 uppercase tracking-wide">
                    ( {homework.daysRemaining} )
                  </span>
                )}
              </div>

              {/* Teacher */}
              <div className="flex items-center">
                <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5">
                  <User size={13} className="text-gray-300" />
                  <span>Teacher</span>
                </span>
                <span className="text-gray-700 font-extrabold">: {homework.teacher}</span>
              </div>

              {/* Class / Section */}
              <div className="flex items-center">
                <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-gray-300" />
                  <span>Class / Section</span>
                </span>
                <span className="text-gray-700 font-extrabold">: {homework.classSection}</span>
              </div>

              {/* Homework Type */}
              {homework.homeworkType && (
                <div className="flex items-center">
                  <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5">
                    <Tag size={13} className="text-gray-300" />
                    <span>Homework Type</span>
                  </span>
                  <span className="text-gray-700 font-extrabold">: {homework.homeworkType}</span>
                </div>
              )}

              {/* Priority */}
              {homework.priority && (
                <div className="flex items-center">
                  <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5">
                    <Flag size={13} className="text-gray-300" />
                    <span>Priority</span>
                  </span>
                  <span className={`font-extrabold ${
                    homework.priority === 'High'
                      ? 'text-red-500'
                      : homework.priority === 'Medium'
                        ? 'text-[#F2994A]'
                        : 'text-[#34A853]'
                  }`}>: {homework.priority}</span>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* 3. Description Panel */}
        {homework.description && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-2.5">
              Description
            </h4>
            <p className="text-xs font-bold text-gray-500 leading-relaxed whitespace-pre-line">
              {homework.description}
            </p>
          </div>
        )}

        {/* 4. Instructions from Teacher */}
        {homework.instructions && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-3">
              Instructions from Teacher
            </h4>
            <p className="text-xs font-bold text-gray-500 leading-relaxed whitespace-pre-line">
              {homework.instructions}
            </p>
          </div>
        )}

        {/* 5. Reference textbook */}
        {(homework.textbook || homework.chapter) && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                Reference
              </h4>
              {homework.textbook && (
                <p className="text-[11.5px] text-gray-500 font-bold leading-normal truncate">
                  Textbook: <span className="text-gray-700 font-extrabold">{homework.textbook}</span>
                </p>
              )}
              {homework.chapter && (
                <p className="text-[11px] text-gray-400 font-semibold leading-normal truncate mt-0.5">
                  Chapter: <span className="text-gray-500 font-bold">{homework.chapter}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* 8. Parental Connect Info Card */}
        <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-3xl p-4.5 flex gap-3.5 shadow-sm relative overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[#E8D7FE] flex items-center justify-center text-[#7F56D9] shrink-0">
            <Users size={16} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-gray-800 tracking-tight leading-snug">
              For Parents
            </h4>
            <p className="text-[10px] font-bold text-gray-500 leading-relaxed mt-1">
              Please help your child complete the homework on time. Encourage neat handwriting and presentation.
            </p>
          </div>
        </div>

        {/* 9. Teacher's Feedback — shown once the work has been checked or sent back */}
        {(isGraded || (isReturned && homework.feedback)) && (
          <div className={`border rounded-3xl p-5 shadow-sm flex flex-col gap-3 ${
            isGraded
              ? 'bg-[#EBFBF0] border-[#34A853]/15'
              : 'bg-[#FEF3F2] border-[#D93025]/15'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-white ${
                  isGraded ? 'text-[#34A853]' : 'text-[#D93025]'
                }`}>
                  <Award size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-800 tracking-tight leading-snug">
                    {isGraded ? "Teacher's Feedback" : 'Sent Back for Revision'}
                  </h3>
                  {homework.gradedAt && (
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                      {new Date(homework.gradedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>

              {isGraded && homework.score != null && (
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-[#34A853] leading-none">
                    {homework.score}
                    <span className="text-[10px] text-gray-400">/{homework.maxScore}</span>
                  </p>
                  {homework.letterGrade && (
                    <p className="text-[10px] font-black text-gray-500 mt-1">
                      Grade {homework.letterGrade}
                    </p>
                  )}
                </div>
              )}
            </div>

            {homework.feedback ? (
              <p className="text-xs font-bold text-gray-600 leading-relaxed whitespace-pre-line bg-white/60 rounded-2xl p-3.5">
                {homework.feedback}
              </p>
            ) : (
              <p className="text-[11px] font-bold text-gray-400">
                The teacher did not leave any remarks.
              </p>
            )}

            {isReturned && (
              <p className="text-[10px] font-black text-[#D93025] uppercase tracking-wide">
                Please correct the work and submit it again.
              </p>
            )}
          </div>
        )}

        {/* 10. Interactive Submission Section */}
        <div className="bg-[#F8F5FF] border border-[#F1EBFF] rounded-3xl p-5 shadow-sm mt-2 flex flex-col gap-4">

          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E8D7FE] text-[#6A47DE] flex items-center justify-center shrink-0 shadow-sm">
                <UploadCloud size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-800 tracking-tight leading-snug">
                  Submission
                </h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                  Upload images of your completed homework
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-tight border uppercase leading-none shrink-0 ${
              isGraded || isSubmitted
                ? 'bg-[#EBFBF0] border-[#34A853]/15 text-[#34A853]'
                : 'bg-red-50 border-red-100 text-red-500'
            }`}>
              Status: {statusLabel}
            </span>
          </div>

          {homework.isLate && (isSubmitted || isGraded) && (
            <p className="text-[10px] font-black text-[#F2994A] uppercase tracking-wide">
              This work was submitted after the due date.
            </p>
          )}

          {/* Grid upload controls and previews */}
          {canSubmit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Column 1: Choose from Gallery Clickable box */}
            <label className="border-2 border-dashed border-[#6A47DE]/25 hover:border-[#6A47DE]/40 bg-white rounded-3xl p-5 flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.99] transition-all min-h-[160px]">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-[#F4EBFF] text-[#7F56D9] flex items-center justify-center mb-2.5 shadow-sm">
                <Image size={20} className="text-[#6A47DE]" />
              </div>
              <span className="text-[11px] font-black text-gray-800 leading-snug">
                Upload from Gallery
              </span>
              <span className="text-[9px] font-semibold text-gray-400 mt-1 leading-snug">
                JPG, PNG or PDF (Max 5 MB per file, up to {MAX_FILES} files)
              </span>
              <div className="mt-3.5 px-4 py-2 border border-[#6A47DE]/20 rounded-2xl text-[10px] font-black text-[#6A47DE] hover:bg-[#6A47DE]/5 transition-colors flex items-center gap-1.5 bg-white shadow-sm">
                <Image size={11} />
                <span>Choose from Gallery</span>
              </div>
            </label>

            {/* Column 2: Uploaded Previews List */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
              {uploadedFiles.length === 0 ? (
                /* Empty state matching mockup */
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100/50 flex items-center justify-center mb-2.5 text-gray-300">
                    <FileText size={24} />
                  </div>
                  <h4 className="text-[11px] font-black text-gray-800 leading-snug">
                    No files uploaded yet
                  </h4>
                  <p className="text-[9px] font-semibold text-gray-400 mt-1 leading-snug max-w-[150px]">
                    Upload your homework images before the due date.
                  </p>
                </div>
              ) : (
                /* Dynamic Previews List / Grid */
                <div className="w-full h-full flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1.5 scrollbar-thin">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-[0_1px_5px_rgba(0,0,0,0.01)]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Thumbnail image or file badge */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                          {file.raw.type.startsWith('image/') ? (
                            <img src={file.url} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-500">
                              <FileText size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-[10px] font-black text-gray-800 truncate leading-snug">
                            {file.name}
                          </h5>
                          <p className="text-[8.5px] font-bold text-gray-400 mt-0.5">
                            {file.size}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-100 hover:border-red-100 text-gray-400 hover:text-red-500 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-sm"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          )}

          {/* Note to the teacher — optional, and the only thing to send if there are no files */}
          {canSubmit && (
            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 flex flex-col gap-2 shadow-sm">
              <label className="text-[10px] font-black text-gray-700">
                Note for the teacher <span className="text-gray-400 font-bold">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="e.g. Question 4 was difficult, I have shown my working."
                className="w-full p-3 bg-gray-50/60 border border-gray-100 focus:border-[#6A47DE]/30 focus:outline-none rounded-2xl text-[11px] font-bold text-gray-700 placeholder-gray-400 h-20 resize-none transition-all"
              />
              <span className="text-[9px] font-bold text-gray-400 self-end">{note.length}/500</span>
            </div>
          )}

          {/* Dynamic upload counter bar */}
          {canSubmit && (
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2.5 text-[10px] font-black text-gray-700 flex items-center justify-between shadow-sm">
              <span>Uploaded Files</span>
              <span className="text-[#6A47DE] font-extrabold bg-[#6A47DE]/10 px-2 py-0.5 rounded-lg text-[9.5px]">
                {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'}
              </span>
            </div>
          )}

          {/* Submission Deadline Banner */}
          {homework.dueDate && homework.dueDate !== '—' && (
            <div className="bg-[#FFF6ED] border border-[#FFE7D3] rounded-2xl p-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#FFF] text-[#F2994A] flex items-center justify-center shadow-sm shrink-0 border border-[#F2994A]/10">
                📅
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-[#F2994A] leading-tight">
                  Submission Deadline: {homework.dueDate}
                </p>
              </div>
            </div>
          )}

          {/* Parents advisory banner */}
          <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-2xl p-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-[#FFF] text-[#6A47DE] flex items-center justify-center shadow-sm shrink-0 border border-[#6A47DE]/10">
              💡
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-500 leading-normal">
                Note: Make sure the images are clear and all answers are visible.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-[11px] font-bold text-rose-500 text-center">{error}</p>
          )}

          {/* Main Action Submit Button */}
          <button
            onClick={handleUploadHomework}
            disabled={isSubmitting || !canSubmit}
            className={`w-full font-black py-3.5 rounded-3xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm disabled:cursor-not-allowed ${
              !canSubmit
                ? 'bg-[#34A853] text-white'
                : 'bg-[#6A47DE] hover:bg-[#5532C8] text-white shadow-[#6A47DE]/15'
            }`}
          >
            {isSubmitting ? (
              <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : !canSubmit ? (
              <Check size={16} />
            ) : (
              <UploadCloud size={16} />
            )}
            <span className="text-xs">
              {isSubmitting
                ? 'Uploading completed homework...'
                : isGraded
                  ? 'Checked by Teacher'
                  : isSubmitted
                    ? 'Submitted — Awaiting Check'
                    : isReturned
                      ? 'Submit Revised Homework'
                      : 'Submit Homework'}
            </span>
          </button>

        </div>

      </div>
    </div>
  );
};

export default ParentHomeworkDetails;
