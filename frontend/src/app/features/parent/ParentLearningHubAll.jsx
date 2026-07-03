import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Play, Pause, Volume2, VolumeX, X, 
  BookOpen, GraduationCap, ChevronDown, CheckCircle2, 
  Bookmark, MoreVertical, SlidersHorizontal, Clock, 
  Globe, Video, Check, Loader2
} from 'lucide-react';
import { listCourses, getResumeBookmark } from '../../../services/lmsApi';
import { getChildInfoFromStorage } from '../../../utils/parentContext';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapCourseToLesson, mapResumeToContinueLesson } from '../../../utils/mappers/lmsMapper';

const ParentLearningHubAll = () => {
  const navigate = useNavigate();

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [openDropdown, setOpenDropdown] = useState(null);
  const [filters, setFilters] = useState({
    subject: 'All',
    grade: 'All',
    language: 'All',
  });
  const [lessons, setLessons] = useState({ continue: null, featured: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      const childInfo = getChildInfoFromStorage();
      const schoolId = childInfo?.schoolId;

      if (!schoolId || schoolId === 'explore-schools') {
        setLessons({ continue: null, featured: [] });
        setLoading(false);
        return;
      }

      try {
        const [{ data: courses }, resume] = await Promise.all([
          listCourses(schoolId, { limit: 50, status: 'published' }),
          getResumeBookmark(schoolId).catch(() => null),
        ]);

        if (cancelled) return;

        const published = (courses || []).filter((c) => c.status === 'published' || !c.status);
        const featured = published.map((course) => mapCourseToLesson(course));
        const continueLesson = mapResumeToContinueLesson(resume) || (featured[0] ? { ...featured[0] } : null);

        setLessons({ continue: continueLesson, featured });
      } catch (err) {
        if (!cancelled) {
          setLessons({ continue: null, featured: [] });
          setError(getErrorMessage(err, 'Unable to load courses'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filterOptions = useMemo(() => ({
    subject: ['All', ...new Set(lessons.featured.map((v) => v.subject).filter(Boolean))],
    grade: ['All', ...new Set(lessons.featured.map((v) => v.chapter?.split('•')[0]?.trim()).filter(Boolean))],
    language: ['All', ...new Set(lessons.featured.map((v) => v.language).filter(Boolean))],
  }), [lessons.featured]);

  const getSubjectColor = (sub) => {
    if (sub === 'Science') return { bg: 'bg-[#EBFBF0]', text: 'text-[#34A853]' };
    if (sub === 'Mathematics') return { bg: 'bg-[#F4EBFF]', text: 'text-[#7F56D9]' };
    if (sub === 'English') return { bg: 'bg-[#FFF0F6]', text: 'text-[#E91E63]' };
    return { bg: 'bg-[#EAF5FF]', text: 'text-[#1A73E8]' }; // Computer Science or generic
  };

  const handleStartVideo = (video) => {
    setSelectedVideo(video);
    setVideoProgress(video.progress);
    setIsPlaying(false); // Static requirement: only plays when play clicked
  };

  const toggleBookmark = (id, e) => {
    e.stopPropagation();
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateLessonProgress = (id, newProg) => {
    setLessons((prev) => {
      const isCont = prev.continue?.id === id;
      if (isCont) {
        return {
          ...prev,
          continue: { ...prev.continue, progress: newProg },
        };
      }
      return {
        ...prev,
        featured: prev.featured.map((l) => (l.id === id ? { ...l, progress: newProg } : l)),
      };
    });

    if (selectedVideo && selectedVideo.id === id) {
      setSelectedVideo(prev => ({ ...prev, progress: newProg }));
      setVideoProgress(newProg);
    }
  };

  const handleSelectFilter = (category, value) => {
    setFilters(prev => ({ ...prev, [category]: value }));
    setOpenDropdown(null);
  };

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(prev => prev === dropdownName ? null : dropdownName);
  };

  // Filter computation
  const filteredVideos = lessons.featured.filter(video => {
    const subjectMatch = filters.subject === 'All' || video.subject === filters.subject;
    const gradeMatch = filters.grade === 'All' || (video.chapter || '').includes(filters.grade);
    const langMatch = filters.language === 'All' || video.language === filters.language;
    return subjectMatch && gradeMatch && langMatch;
  });

  return (
    <div className="px-6 py-6 font-outfit select-none bg-white min-h-screen relative pb-28">


      {/* Top Header Bar */}
      <div className="flex items-center gap-4.5 mb-6">
        <button 
          onClick={() => navigate('/user/home')}
          className="w-10 h-10 rounded-2xl border border-gray-100 hover:border-gray-200 text-gray-700 flex items-center justify-center bg-white shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <div>
          <h2 className="text-lg font-black text-gray-800 tracking-tight leading-none">Learning Hub</h2>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">All Video Classes</p>
        </div>
      </div>

      {/* 1. Continue Learning Banner */}
      <div className="bg-[#FAF8FF] border border-[#F3EDFF] rounded-[2rem] p-5 shadow-[0_8px_25px_rgba(0,0,0,0.015)] relative overflow-hidden mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-black text-[#7F56D9] uppercase tracking-wider leading-none">
            Continue Learning
          </h3>
          <button 
            onClick={() => navigate('/user/home')}
            className="text-[10px] font-black text-[#7F56D9] flex items-center gap-1.5 active:scale-95 transition-all leading-none uppercase tracking-wider hover:underline"
          >
            <span>Home</span>
            <ChevronLeft size={10} className="rotate-180" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={28} className="animate-spin text-[#7F56D9]" />
          </div>
        ) : error ? (
          <p className="text-xs text-red-500 text-center py-4">{error}</p>
        ) : !lessons.continue ? (
          <div className="text-center py-6">
            <BookOpen size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-400">No courses to continue</p>
          </div>
        ) : (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          
          {/* Visual Thumbnail Card */}
          <div 
            onClick={() => handleStartVideo(lessons.continue)}
            className="relative w-full sm:w-44 aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/50 shadow-sm cursor-pointer group shrink-0"
          >
            <img 
              src={lessons.continue.image} 
              alt={lessons.continue.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.9]"
            />
            
            {/* Overlay Glassmorphic Play button */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="w-10 h-10 rounded-full bg-white/95 text-[#7F56D9] flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                <Play size={15} fill="currentColor" className="ml-0.5" />
              </div>
            </div>

            {/* Lesson Duration Badge */}
            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-[1px] text-white text-[9px] font-bold rounded-lg leading-none">
              {lessons.continue.duration}
            </span>
          </div>

          {/* Information Column */}
          <div className="flex-1 min-w-0 w-full">
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${getSubjectColor(lessons.continue.subject).bg} ${getSubjectColor(lessons.continue.subject).text}`}>
              {lessons.continue.subject}
            </span>
            
            <h4 className="text-sm font-black text-gray-800 mt-2 truncate leading-tight">
              {lessons.continue.title}
            </h4>
            
            <p className="text-[10.5px] font-bold text-gray-400 mt-1 flex items-center gap-1.5 leading-none">
              <BookOpen size={11} className="text-gray-300" />
              <span>{lessons.continue.chapter}</span>
            </p>

            {/* Progress Slider */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-2 bg-[#EFE8FF] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#7F56D9] to-[#6A47DE] rounded-full transition-all duration-500" 
                  style={{ width: `${lessons.continue.progress}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-[#7F56D9] leading-none bg-[#7F56D9]/10 px-2 py-0.5 rounded-lg">
                {lessons.continue.progress}%
              </span>
            </div>

            {/* Resume Button */}
            <button 
              onClick={() => handleStartVideo(lessons.continue)}
              className="mt-4 px-5 py-2.5 bg-[#7F56D9] hover:bg-[#6A47DE] text-white text-[11px] font-black rounded-xl shadow-md shadow-[#7F56D9]/15 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer w-fit"
            >
              <Play size={11} fill="currentColor" />
              <span>Resume</span>
            </button>
          </div>
        </div>
        )}
      </div>

      {/* 2. Interactive Filters Grid Row */}
      <div className="relative mb-6 z-30">
        <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3 leading-none">
          Filters
        </h3>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          
          {/* Filter: Subject */}
          <div className="relative shrink-0">
            <button 
              onClick={() => toggleDropdown('subject')}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-black border flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                filters.subject !== 'All' 
                  ? 'bg-[#F4EBFF] border-[#7F56D9] text-[#7F56D9]' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <BookOpen size={12} className={filters.subject !== 'All' ? 'text-[#7F56D9]' : 'text-gray-400'} />
              <span>{filters.subject === 'All' ? 'Subject' : filters.subject}</span>
              <ChevronDown size={11} className={`transition-transform duration-200 ${openDropdown === 'subject' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter: Class */}
          <div className="relative shrink-0">
            <button 
              onClick={() => toggleDropdown('grade')}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-black border flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                filters.grade !== 'All' 
                  ? 'bg-[#F4EBFF] border-[#7F56D9] text-[#7F56D9]' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <GraduationCap size={12} className={filters.grade !== 'All' ? 'text-[#7F56D9]' : 'text-gray-400'} />
              <span>{filters.grade === 'All' ? 'Class' : filters.grade}</span>
              <ChevronDown size={11} className={`transition-transform duration-200 ${openDropdown === 'grade' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter: Language */}
          <div className="relative shrink-0">
            <button 
              onClick={() => toggleDropdown('language')}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-black border flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                filters.language !== 'All' 
                  ? 'bg-[#F4EBFF] border-[#7F56D9] text-[#7F56D9]' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Globe size={12} className={filters.language !== 'All' ? 'text-[#7F56D9]' : 'text-gray-400'} />
              <span>{filters.language === 'All' ? 'Language' : filters.language}</span>
              <ChevronDown size={11} className={`transition-transform duration-200 ${openDropdown === 'language' ? 'rotate-180' : ''}`} />
            </button>
          </div>

        </div>

        {/* Click outside overlay for open dropdowns */}
        {openDropdown && (
          <div 
            className="fixed inset-0 z-40 bg-transparent cursor-default" 
            onClick={() => setOpenDropdown(null)}
          />
        )}

        {/* Global Dropdown Rendered outside the scrolling container to prevent clipping */}
        {openDropdown && (
          <DropdownMenu 
            options={
              openDropdown === 'subject' ? filterOptions.subject :
              openDropdown === 'grade' ? filterOptions.grade : filterOptions.language
            } 
            selectedValue={
              openDropdown === 'subject' ? filters.subject :
              openDropdown === 'grade' ? filters.grade : filters.language
            } 
            onSelect={(val) => handleSelectFilter(openDropdown === 'grade' ? 'grade' : openDropdown, val)} 
            style={{
              left: openDropdown === 'subject' ? '0px' :
                    openDropdown === 'grade' ? '85px' :
                    openDropdown === 'language' ? '165px' : 'auto'
            }}
          />
        )}
      </div>

      {/* 3. All Videos Title and Dynamic List */}
      <div>
        <div className="flex items-center justify-between mb-4.5">
          <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider leading-none">
            All Videos
          </h3>
          <span className="text-[10px] font-black text-gray-400 leading-none">
            {filteredVideos.length === 0 ? 'No Classes' : `${filteredVideos.length} Videos`}
          </span>
        </div>

        {/* Video List Rows */}
        <div className="flex flex-col gap-4">
          {filteredVideos.length === 0 ? (
            <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
              <BookOpen size={30} className="text-gray-300 mb-2.5 animate-bounce" />
              <p className="text-[12px] font-black text-gray-400">No classes found matching active filters.</p>
              <button 
                onClick={() => setFilters({ subject: 'All', grade: 'All', language: 'All' })}
                className="mt-3.5 px-4.5 py-2.5 bg-[#7F56D9] text-white text-[10px] font-black rounded-xl active:scale-95 transition-all shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredVideos.map((video) => (
              <div 
                key={video.id}
                onClick={() => handleStartVideo(video)}
                className="bg-white border border-gray-100 hover:border-gray-200 rounded-[2rem] p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.015)] hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 flex gap-4 cursor-pointer relative group items-center"
              >
                {/* Thumbnail on the left */}
                <div className="w-24 aspect-video rounded-xl overflow-hidden bg-gray-50 relative shrink-0 border border-gray-100/50">
                  <img 
                    src={video.image} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.9]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="w-7 h-7 rounded-full bg-white/95 text-gray-700 flex items-center justify-center shadow shadow-black/10 group-active:scale-90 transition-transform">
                      <Play size={10} fill="currentColor" className="ml-0.5 text-gray-700" />
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[7.5px] font-bold rounded-md leading-none">
                    {video.duration}
                  </span>
                </div>

                {/* Information on the right */}
                <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${getSubjectColor(video.subject).bg} ${getSubjectColor(video.subject).text}`}>
                      {video.subject}
                    </span>
                    
                    {/* Control Icons Column far right */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => toggleBookmark(video.id, e)}
                        className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center active:scale-90 transition-all ${
                          bookmarks.has(video.id) 
                            ? 'text-[#7F56D9] bg-[#7F56D9]/10' 
                            : 'text-gray-400 hover:text-gray-600 bg-gray-50'
                        }`}
                      >
                        <Bookmark size={11} fill={bookmarks.has(video.id) ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => alert(`Options for "${video.title}" coming soon!`)}
                        className="w-6.5 h-6.5 rounded-lg text-gray-400 hover:text-gray-600 bg-gray-50 flex items-center justify-center active:scale-90 transition-all"
                      >
                        <MoreVertical size={11} />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="text-[12.5px] font-black text-gray-800 mt-1 line-clamp-1 leading-snug group-hover:text-[#7F56D9] transition-colors pr-2">
                    {video.title}
                  </h4>
                  
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5 flex items-center gap-1 leading-none">
                    <BookOpen size={9} className="text-gray-300" />
                    <span>{video.chapter}</span>
                  </p>

                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    {/* Teacher name & image */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <img 
                        src={video.teacherImg} 
                        alt={video.teacher}
                        className="w-5 h-5 rounded-full object-cover border border-gray-100"
                      />
                      <span className="text-[9px] font-bold text-gray-500 leading-none">
                        {video.teacher}
                      </span>
                    </div>

                    {/* Progress slider bar inside card */}
                    <div className="flex-1 flex items-center gap-2 max-w-[50%]">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${video.progress >= 80 ? 'bg-[#34A853]' : 'bg-[#7F56D9]'} transition-all duration-500`}
                          style={{ width: `${video.progress}%` }}
                        />
                      </div>
                      <span className="text-[8.5px] font-black text-gray-400 w-5.5 text-right shrink-0 leading-none">
                        {video.progress}%
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. PREMIUM GLASSMORPHIC VIDEO PLAYER MODAL OVERLAY */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-5 animate-fade-in"
          onClick={() => {
            setIsPlaying(false);
            setSelectedVideo(null);
          }}
        >
          <div 
            className="bg-white border border-gray-100 rounded-[2.5rem] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Screen / Video Container */}
            <div className="aspect-video relative bg-black shrink-0">
              {selectedVideo.videoUrl ? (
                <>
                  <video
                    src={selectedVideo.videoUrl}
                    poster={selectedVideo.image}
                    controls
                    autoPlay
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-contain bg-black"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={(e) => {
                      const { currentTime, duration } = e.currentTarget;
                      if (duration) setVideoProgress(Math.round((currentTime / duration) * 100));
                    }}
                  />
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setSelectedVideo(null);
                    }}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white/90 hover:text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
              <>
              <img 
                src={selectedVideo.image} 
                alt={selectedVideo.title}
                className="w-full h-full object-cover opacity-85"
              />
              
              {/* Playback HUD overlay controls */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/40 via-transparent to-black/60">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] text-white/95 font-extrabold uppercase tracking-widest bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 leading-none">
                    Class 5 Tutorial
                  </span>
                  <button 
                    onClick={() => {
                      setIsPlaying(false);
                      setSelectedVideo(null);
                    }}
                    className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white/90 hover:text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Dynamic playback simulation state indicator */}
                <div className="flex items-center justify-center">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-2xl active:scale-90 transition-transform scale-100 hover:scale-105"
                  >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                  </button>
                </div>

                {/* Sound, duration and progress bar */}
                <div className="flex items-center justify-between gap-3 text-white">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:scale-105 active:scale-95 transition-all"
                  >
                    {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>

                  {/* Scrubber slider bar */}
                  <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden relative cursor-pointer">
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-[#7F56D9] rounded-full transition-all duration-300"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>

                  <span className="text-[9px] font-black text-white/90 leading-none bg-black/35 px-1.5 py-0.5 rounded backdrop-blur-[1px]">
                    {selectedVideo.duration}
                  </span>
                </div>
              </div>
              </>
              )}
            </div>

            {/* Video Meta Info Panel */}
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
              
              <div>
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${getSubjectColor(selectedVideo.subject).bg} ${getSubjectColor(selectedVideo.subject).text}`}>
                  {selectedVideo.subject}
                </span>
                <h3 className="text-base font-black text-gray-800 mt-2 tracking-tight leading-snug">
                  {selectedVideo.title}
                </h3>
                <p className="text-[11px] font-bold text-gray-400 mt-1 flex items-center gap-1.5">
                  <Clock size={12} className="text-gray-300" />
                  <span>Instructor: {selectedVideo.teacher} • {selectedVideo.chapter}</span>
                </p>
              </div>

              {/* Progress and status HUD */}
              <div className="bg-[#FAF8FF] border border-[#F3EDFF] rounded-2xl p-4.5 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-[10px] font-black text-[#7F56D9] uppercase tracking-wider">Lesson Progress</h4>
                  <p className="text-xs font-black text-gray-700 mt-0.5">
                    {Math.round(videoProgress)}% Completed
                  </p>
                </div>
                
                {/* Complete now button */}
                <button 
                  onClick={() => {
                    updateLessonProgress(selectedVideo.id, 100);
                    alert(`🎉 Well done! "${selectedVideo.title}" marked as fully completed.`);
                  }}
                  disabled={videoProgress >= 100}
                  className={`px-3 py-2 border rounded-xl text-[10px] font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all ${
                    videoProgress >= 100 
                      ? 'bg-[#EBFBF0] border-[#34A853]/15 text-[#34A853]' 
                      : 'bg-white border-gray-100 text-[#7F56D9] hover:border-gray-200'
                  }`}
                >
                  <CheckCircle2 size={11} />
                  <span>{videoProgress >= 100 ? 'Completed' : 'Mark Completed'}</span>
                </button>
              </div>

              {/* Class summary syllabus notes */}
              <div>
                <h4 className="text-[10.5px] font-black text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen size={11} className="text-gray-400" />
                  <span>Key Concepts Learnt</span>
                </h4>
                <ul className="flex flex-col gap-2.5 pl-4 list-disc text-gray-500 text-[11px] font-bold">
                  {selectedVideo.notes.map((note, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

/* Micro Dropdown Menu Component */
const DropdownMenu = ({ options, selectedValue, onSelect, style }) => {
  return (
    <div 
      className="absolute mt-1.5 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-scale-in flex flex-col"
      style={style}
    >
      {options.map((opt) => (
        <button 
          key={opt}
          onClick={() => onSelect(opt)}
          className={`w-full px-4 py-2.5 text-left text-[11px] font-bold hover:bg-[#FAF8FF] hover:text-[#7F56D9] transition-all flex items-center justify-between cursor-pointer ${
            selectedValue === opt ? 'text-[#7F56D9] bg-[#7F56D9]/5 font-black' : 'text-gray-600'
          }`}
        >
          <span>{opt === 'None' ? 'Clear Sort' : opt}</span>
          {selectedValue === opt && <Check size={11} className="text-[#7F56D9] stroke-[3px]" />}
        </button>
      ))}
    </div>
  );
};

export default ParentLearningHubAll;
