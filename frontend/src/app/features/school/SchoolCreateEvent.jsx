import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin,
  Bell, Users, GraduationCap, Grid, Info,
  Check, ArrowRight, ToggleLeft, ToggleRight,
  Pencil, Trash2, List, Loader2
} from 'lucide-react';
import { createEvent, updateEvent, getEvent, listEvents, deleteEvent, listClasses } from '../../../services/schoolApi';
import { useSchoolId } from '../../../utils/schoolContext';
import { getErrorMessage } from '../../../utils/apiHelpers';

const combineDateTime = (date, time, allDay) => {
  if (!date) return null;
  if (allDay || !time) return new Date(`${date}T00:00:00`).toISOString();
  return new Date(`${date}T${time}:00`).toISOString();
};

const AUDIENCE_MAP = {
  all: 'all',
  parents: 'parents',
  teachers: 'teachers',
  students: 'students',
  specific: 'specific_classes',
};

// Reverse lookup so an existing event's stored audience selects the right chip
const AUDIENCE_FROM_API = Object.fromEntries(
  Object.entries(AUDIENCE_MAP).map(([key, value]) => [value, key])
);

/** Split an ISO timestamp back into the date and time inputs the form uses. */
const splitDateTime = (iso) => {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

const SchoolCreateEvent = () => {
  const navigate = useNavigate();
  const schoolId = useSchoolId();
  // Same form serves both create and edit; ?eventId= switches it to edit.
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const isEditing = Boolean(eventId);
  const [loadingEvent, setLoadingEvent] = useState(false);
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [classesList, setClassesList] = useState([]);

  // Existing Events Management state
  const [existingEvents, setExistingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadSchoolEvents = useCallback(async () => {
    if (!schoolId) return;
    setLoadingEvents(true);
    try {
      const res = await listEvents(schoolId, { limit: 100 });
      const events = Array.isArray(res) ? res : (res?.data || []);
      setExistingEvents(events);
    } catch (err) {
      setExistingEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return;
    loadSchoolEvents();
  }, [schoolId, loadSchoolEvents]);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      try {
        const list = await listClasses(schoolId);
        setClassesList(list || []);
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    })();
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !eventId) return;
    let cancelled = false;

    (async () => {
      setLoadingEvent(true);
      setError('');
      try {
        const event = await getEvent(schoolId, eventId);
        if (cancelled || !event) return;
        const start = splitDateTime(event.startDate);
        const end = splitDateTime(event.endDate);

        setTitle(event.title || '');
        setDescription(event.description || '');
        setEventType(event.eventType || '');
        setStartDate(start.date);
        setStartTime(start.time);
        setEndDate(end.date);
        setEndTime(end.time);
        setVenue(event.location || '');
        setAudience(AUDIENCE_FROM_API[event.targetAudience] || 'all');
        setSelectedClass(event.targetClasses?.[0]?.classGrade || '');
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load this event'));
      } finally {
        if (!cancelled) setLoadingEvent(false);
      }
    })();

    return () => { cancelled = true; };
  }, [schoolId, eventId]);

  const handleBack = () => {
    navigate('/school/admin');
  };

  const handleDeleteEvent = async (targetId) => {
    if (!schoolId || !targetId) return;
    setDeletingId(targetId);
    try {
      await deleteEvent(schoolId, targetId);
      await loadSchoolEvents();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete event'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateEvent = async () => {
    setError('');
    if (!title.trim() || !startDate) {
      setError('Event title and start date are required.');
      return;
    }
    if (!schoolId) {
      setError('School context is missing. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      const targetAudience = AUDIENCE_MAP[audience] || 'all';
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        eventType: eventType || eventCategory || 'General',
        startDate: combineDateTime(startDate, startTime, isAllDay),
        endDate: combineDateTime(endDate || startDate, endTime || startTime, isAllDay) || undefined,
        location: venue.trim() || undefined,
        targetAudience,
        targetClasses:
          targetAudience === 'specific_classes' && selectedClass
            ? [{ classGrade: selectedClass, sections: [] }]
            : undefined,
      };

      if (isEditing) await updateEvent(schoolId, eventId, payload);
      else await createEvent(schoolId, payload);
      setIsSuccess(true);
      await loadSchoolEvents();
      setTimeout(() => {
        setIsSuccess(false);
        if (isEditing) {
          navigate('/school/create-event');
        } else {
          setTitle('');
          setDescription('');
          setEventType('');
          setStartDate('');
          setStartTime('');
          setEndDate('');
          setEndTime('');
          setVenue('');
        }
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err, isEditing ? 'Unable to update event' : 'Unable to create event'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-48 font-outfit relative">
      {/* Top Banner Success Notification */}
      {isSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-in fade-in zoom-in slide-in-from-top-2 duration-300">
          <div className="bg-emerald-500 text-white px-5 py-4 rounded-3xl shadow-xl flex items-center gap-3.5 border border-emerald-400/20">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Check size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs font-black block leading-none">
                {isEditing ? 'Event Updated Successfully!' : 'Event Created Successfully!'}
              </span>
              <span className="text-[10px] text-emerald-100 font-bold block mt-1">
                {isEditing ? 'Changes are live on the school calendar.' : 'Added to school calendar and notice board.'}
              </span>
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
              {isEditing ? 'Edit Event' : 'Create Event'}
            </h1>
            <span className="text-[11px] text-gray-400 font-bold block mt-1">
              {isEditing
                ? loadingEvent
                  ? 'Loading event…'
                  : 'Update this event on the school calendar.'
                : 'Add a new event to school calendar.'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/school/events')}
          className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-100 text-primary rounded-xl text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Calendar size={13} />
          <span>All Events ({existingEvents.length})</span>
        </button>
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
                {classesList.map(c => (
                  <option key={c.classGrade} value={c.classGrade}>{c.classGrade}</option>
                ))}
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

        {/* Step 5: Published School Events List (Edit & Delete Management) */}
        <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center shadow-sm">
                <List size={13} />
              </div>
              <div>
                <h3 className="text-xs font-black text-deep-purple uppercase tracking-wider">
                  Published School Events
                </h3>
                <p className="text-[10px] text-gray-400 font-bold">
                  {existingEvents.length} event{existingEvents.length === 1 ? '' : 's'} managed
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/school/events')}
              className="text-[10px] font-black text-primary hover:underline"
            >
              View Calendar View
            </button>
          </div>

          {loadingEvents ? (
            <div className="flex justify-center py-6 text-primary">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : existingEvents.length === 0 ? (
            <div className="text-center py-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <Calendar size={24} className="mx-auto text-gray-300 mb-1.5" />
              <p className="text-xs font-bold text-gray-400">No published events found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
              {existingEvents.map((evt) => (
                <div
                  key={evt._id}
                  className="p-3.5 bg-gray-50/70 border border-gray-200/60 rounded-2xl flex items-center justify-between gap-3 hover:border-primary/30 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-black text-deep-purple truncate">{evt.title}</h4>
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-purple-100 text-primary shrink-0">
                        {evt.eventType || 'General'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                      <span>{evt.startDate ? new Date(evt.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}</span>
                      {evt.location && <span>• {evt.location}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/school/create-event?eventId=${evt._id}`)}
                      className="p-2 rounded-xl bg-white border border-gray-200 text-deep-purple hover:bg-purple-50 hover:text-primary active:scale-95 transition-all"
                      title="Edit Event"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(evt._id)}
                      disabled={deletingId === evt._id}
                      className="p-2 rounded-xl bg-white border border-red-100 text-red-500 hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50"
                      title="Delete Event"
                    >
                      {deletingId === evt._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions Footer Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 bg-white border-t border-gray-150 p-4 flex flex-col gap-3 z-50 max-w-md mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold px-4 py-2.5 rounded-2xl">
            {error}
          </div>
        )}
        <div className="flex">
          <button
            type="button"
            onClick={handleCreateEvent}
            disabled={saving || loadingEvent}
            className="w-full py-3.5 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-60"
          >
            <Calendar size={14} />
            {saving
              ? isEditing ? 'Saving…' : 'Creating…'
              : isEditing ? 'Save Changes' : 'Create Event'}
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
