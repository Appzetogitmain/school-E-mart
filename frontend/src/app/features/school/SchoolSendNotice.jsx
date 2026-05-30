import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, History, Megaphone, 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignRight, Link2, Image as ImageIcon,
  Users, GraduationCap, Grid, Upload, FileText, 
  X, Info, Send, Save, Check
} from 'lucide-react';

const SchoolSendNotice = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('parents');
  const [attachments, setAttachments] = useState([
    { id: 1, name: 'PTM_Schedule_May2025.pdf', size: '245 KB' }
  ]);
  const [schedule, setSchedule] = useState('now');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleBack = () => {
    navigate('/school/admin');
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter(item => item.id !== id));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachments([
        ...attachments,
        {
          id: Date.now(),
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`
        }
      ]);
    }
  };

  const handleSendNotice = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      navigate('/school/admin');
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-36 font-outfit relative">
      {/* Top Banner Success Notification */}
      {isSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-in fade-in zoom-in slide-in-from-top-2 duration-300">
          <div className="bg-emerald-500 text-white px-5 py-4 rounded-3xl shadow-xl flex items-center gap-3.5 border border-emerald-400/20">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Check size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs font-black block leading-none">Notice Sent Successfully!</span>
              <span className="text-[10px] text-emerald-100 font-bold block mt-1">Delivered to selected audience notice board.</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="bg-white border-b border-gray-150/70 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full border border-gray-150 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all text-deep-purple"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-deep-purple flex items-center gap-1.5 leading-none">
              Send Notice
            </h1>
            <span className="text-[11px] text-gray-400 font-bold block mt-1">
              Create and send a notice to students, parents and teachers.
            </span>
          </div>
        </div>
      </div>

      {/* Form Content Area */}
      <div className="px-6 py-5 space-y-5">
        
        {/* Step 1: Notice Details */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center shadow-sm">
              1
            </div>
            <h3 className="text-xs font-black text-deep-purple uppercase tracking-wider">
              Notice Details
            </h3>
          </div>

          {/* Title input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-gray-500">
                Notice Title <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400 font-bold">
                {title.length}/100
              </span>
            </div>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="Enter notice title"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-300"
            />
          </div>

          {/* Content editor */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-gray-500 block">
              Notice Content <span className="text-red-500">*</span>
            </label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your notice here..."
              rows={6}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-300 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Step 2: Audience */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center shadow-sm">
              2
            </div>
            <h3 className="text-xs font-black text-deep-purple uppercase tracking-wider">
              Audience
            </h3>
          </div>
          <p className="text-[10px] text-gray-400 font-bold -mt-2">
            Select who should receive this notice
          </p>

          {/* Grid Selection of Audience Cards */}
          <div className="grid grid-cols-2 gap-3.5 pt-1.5">
            {/* All Parents */}
            <div 
              onClick={() => setAudience('parents')}
              className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center relative ${audience === 'parents' ? 'border-primary bg-purple-50/10' : 'border-gray-150 hover:border-gray-250 bg-white'}`}
            >
              {audience === 'parents' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
                  <Check size={10} />
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-primary mb-2.5 shadow-inner">
                <Users size={16} />
              </div>
              <span className="text-[11px] font-black text-deep-purple block">All Parents</span>
              <span className="text-[8.5px] text-gray-400 font-bold block mt-0.5">Send to all parent accounts</span>
            </div>

            {/* All Students */}
            <div 
              onClick={() => setAudience('students')}
              className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center relative ${audience === 'students' ? 'border-emerald-500 bg-emerald-50/5' : 'border-gray-150 hover:border-gray-250 bg-white'}`}
            >
              {audience === 'students' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                  <Check size={10} />
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-2.5 shadow-inner">
                <GraduationCap size={16} />
              </div>
              <span className="text-[11px] font-black text-deep-purple block">All Students</span>
              <span className="text-[8.5px] text-gray-400 font-bold block mt-0.5">Send to all student accounts</span>
            </div>

            {/* All Teachers */}
            <div 
              onClick={() => setAudience('teachers')}
              className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center relative ${audience === 'teachers' ? 'border-amber-500 bg-amber-50/5' : 'border-gray-150 hover:border-gray-250 bg-white'}`}
            >
              {audience === 'teachers' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm">
                  <Check size={10} />
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-2.5 shadow-inner">
                <Users size={16} className="rotate-12" />
              </div>
              <span className="text-[11px] font-black text-deep-purple block">All Teachers</span>
              <span className="text-[8.5px] text-gray-400 font-bold block mt-0.5">Send to all teacher accounts</span>
            </div>

            {/* Specific Section */}
            <div 
              onClick={() => setAudience('specific')}
              className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center relative ${audience === 'specific' ? 'border-blue-500 bg-blue-50/5' : 'border-gray-150 hover:border-gray-250 bg-white'}`}
            >
              {audience === 'specific' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                  <Check size={10} />
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-2.5 shadow-inner">
                <Grid size={16} />
              </div>
              <span className="text-[11px] font-black text-deep-purple block">Specific Class</span>
              <span className="text-[8.5px] text-gray-400 font-bold block mt-0.5">Select classes or sections</span>
            </div>
          </div>
        </div>

        {/* Step 3: Schedule */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center shadow-sm">
              3
            </div>
            <h3 className="text-xs font-black text-deep-purple uppercase tracking-wider">
              Schedule <span className="text-[10px] text-gray-400 font-bold normal-case ml-1">(Optional)</span>
            </h3>
          </div>
          <p className="text-[10px] text-gray-400 font-bold -mt-2">
            Choose when to send this notice
          </p>

          <div className="space-y-4 pt-1">
            {/* Send Now */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="radio"
                name="schedule"
                value="now"
                checked={schedule === 'now'}
                onChange={() => setSchedule('now')}
                className="mt-1 accent-primary"
              />
              <div>
                <span className="text-xs font-black text-deep-purple block leading-none">Send Now</span>
                <span className="text-[9px] text-gray-400 font-bold block mt-1">Notice will be sent immediately</span>
              </div>
            </label>

            {/* Schedule for Later */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="radio"
                name="schedule"
                value="later"
                checked={schedule === 'later'}
                onChange={() => setSchedule('later')}
                className="mt-1 accent-primary"
              />
              <div>
                <span className="text-xs font-black text-deep-purple block leading-none">Schedule for Later</span>
                <span className="text-[9px] text-gray-400 font-bold block mt-1">Choose date and time to send</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 p-4 flex flex-col gap-3 z-50 max-w-md mx-auto">
        <div className="flex">
          <button 
            type="button"
            onClick={handleSendNotice}
            className="w-full py-3 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Send size={14} />
            Send Notice
          </button>
        </div>

        {/* Information Banner block */}
        <div className="bg-purple-50/40 rounded-2xl p-3 flex items-start gap-2.5">
          <Info size={14} className="text-primary mt-0.5 shrink-0" />
          <p className="text-[9px] text-gray-450 font-bold leading-normal">
            Once sent, the notice will be delivered via app notification and will be visible in the notice board for selected audience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchoolSendNotice;
