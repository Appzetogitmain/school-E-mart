import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, MapPin, 
  Bell, Users, GraduationCap, Grid, Info, 
  Check, ArrowRight, ToggleLeft, ToggleRight
} from 'lucide-react';

const SchoolCreateEvent = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [reminder, setReminder] = useState('');
  const [audience, setAudience] = useState('specific');
  const [selectedClass, setSelectedClass] = useState('');
  const [visibleOnCalendar, setVisibleOnCalendar] = useState(true);
  const [publishToNoticeBoard, setPublishToNoticeBoard] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleBack = () => {
    navigate('/school/admin');
  };

  const handleCreateEvent = () => {
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
              <span className="text-xs font-black block leading-none">Event Created Successfully!</span>
              <span className="text-[10px] text-emerald-100 font-bold block mt-1">Added to school calendar and notice board.</span>
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
              Create Event
            </h1>
            <span className="text-[11px] text-gray-400 font-bold block mt-1">
              Add a new event to school calendar.
            </span>
          </div>
        </div>
      </div>

      {/* Form Content Area */}
      <div className="px-6 py-5 space-y-5">
        
        {/* Step 1: Basic Information */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center shadow-sm">
              1
            </div>
            <h3 className="text-xs font-black text-deep-purple uppercase tracking-wider">
              Basic Information
            </h3>
          </div>

          {/* Event Title */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-gray-500">
                Event Title <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400 font-bold">
                {title.length}/100
              </span>
            </div>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="Enter event title"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-300"
            />
          </div>

          {/* Event Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-gray-500 block">
              Event Description <span className="text-red-500">*</span>
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write event description here..."
              rows={4}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-300 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Step 2: Event Details */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center shadow-sm">
              2
            </div>
            <h3 className="text-xs font-black text-deep-purple uppercase tracking-wider">
              Event Details
            </h3>
          </div>

          {/* Event Type & Category */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500">
                Event Type <span className="text-red-500">*</span>
              </label>
              <select 
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select event type</option>
                <option value="academic">Academic</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
                <option value="parent-teacher">PTM Meeting</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500">
                Event Category <span className="text-red-500">*</span>
              </label>
              <select 
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select category</option>
                <option value="primary">Primary School</option>
                <option value="secondary">Secondary School</option>
                <option value="all">All School</option>
              </select>
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500">
                End Date <span className="text-red-500">*</span>
              </label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Venue */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-gray-500">Venue / Location</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Enter venue or location (Optional)"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* All Day & Reminder */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-150 rounded-2xl">
              <div>
                <span className="text-xs font-black text-deep-purple block leading-none">All Day Event</span>
                <span className="text-[9px] text-gray-400 font-bold block mt-1">For the whole day</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsAllDay(!isAllDay)}
                className="text-primary hover:scale-105 active:scale-95 transition-all"
              >
                {isAllDay ? <ToggleRight size={38} /> : <ToggleLeft size={38} className="text-gray-300" />}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500">Reminder</label>
              <select 
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select reminder</option>
                <option value="15">15 Minutes Before</option>
                <option value="30">30 Minutes Before</option>
                <option value="60">1 Hour Before</option>
                <option value="1440">1 Day Before</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Audience */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center shadow-sm">
              3
            </div>
            <h3 className="text-xs font-black text-deep-purple uppercase tracking-wider">
              Audience
            </h3>
          </div>
          <p className="text-[10px] text-gray-400 font-bold -mt-2">
            Select who should see this event.
          </p>

          {/* Horizontal / Grid Audience Selections */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
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
              <span className="text-[8.5px] text-gray-400 font-bold block mt-0.5">All parent accounts</span>
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
              <span className="text-[8.5px] text-gray-400 font-bold block mt-0.5">All student accounts</span>
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
              <span className="text-[8.5px] text-gray-400 font-bold block mt-0.5">All teacher accounts</span>
            </div>

            {/* Specific Class */}
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

          {/* Select Classes dropdown */}
          {audience === 'specific' && (
            <div className="space-y-1.5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[11px] font-black text-gray-500">
                Select Classes / Sections <span className="text-red-500">*</span>
              </label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-deep-purple focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select classes or sections</option>
                <option value="grade-1">Class 1 - Section A</option>
                <option value="grade-2">Class 2 - Section B</option>
                <option value="grade-3">Class 3 - Section A</option>
              </select>
            </div>
          )}
        </div>

        {/* Step 4: Additional Options */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center shadow-sm">
              4
            </div>
            <h3 className="text-xs font-black text-deep-purple uppercase tracking-wider">
              Additional Options
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-150 rounded-2xl">
              <div>
                <span className="text-xs font-black text-deep-purple block leading-none">Visible On Calendar</span>
                <span className="text-[9px] text-gray-400 font-bold block mt-1.5">Show this event on calendar</span>
              </div>
              <button 
                type="button"
                onClick={() => setVisibleOnCalendar(!visibleOnCalendar)}
                className="text-primary hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                {visibleOnCalendar ? <ToggleRight size={38} /> : <ToggleLeft size={38} className="text-gray-300" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-150 rounded-2xl">
              <div>
                <span className="text-xs font-black text-deep-purple block leading-none">Publish to Notice Board</span>
                <span className="text-[9px] text-gray-400 font-bold block mt-1.5">Show this on notice board</span>
              </div>
              <button 
                type="button"
                onClick={() => setPublishToNoticeBoard(!publishToNoticeBoard)}
                className="text-primary hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                {publishToNoticeBoard ? <ToggleRight size={38} /> : <ToggleLeft size={38} className="text-gray-300" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 p-4 flex flex-col gap-3 z-50 max-w-md mx-auto">
        <div className="flex">
          <button 
            type="button"
            onClick={handleCreateEvent}
            className="w-full py-3.5 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Calendar size={14} />
            Create Event
          </button>
        </div>

        {/* Information Banner block */}
        <div className="bg-purple-50/40 rounded-2xl p-3 flex items-start gap-2.5">
          <Info size={14} className="text-primary mt-0.5 shrink-0" />
          <p className="text-[9px] text-gray-450 font-bold leading-normal">
            Once created, the event will be visible in calendar and to the selected audience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchoolCreateEvent;
