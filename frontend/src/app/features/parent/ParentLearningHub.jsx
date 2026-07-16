import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, Volume2, VolumeX, X,
  Sparkles, Award, BookOpen, Clock,
  ArrowRight, GraduationCap, CheckCircle2, Loader2
} from 'lucide-react';
import {
  listCourses,
  getResumeBookmark,
  listLessons,
  updateLessonProgress as saveLessonProgress,
} from '../../../services/lmsApi';
import { getChildInfoFromStorage } from '../../../utils/parentContext';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapCourseToLesson, mapResumeToContinueLesson } from '../../../utils/mappers/lmsMapper';

const ParentLearningHub = () => {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('All');
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
          listCourses(schoolId, { limit: 20, status: 'published' }),
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

  const subjects = useMemo(() => {
    const unique = [...new Set(lessons.featured.map((l) => l.subject).filter(Boolean))];
    return ['All', ...unique];
  }, [lessons.featured]);

  // Filter featured list based on active tab
  const filteredFeatured = activeTab === 'All'
    ? lessons.featured
    : lessons.featured.filter(l => l.subject === activeTab);

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

    // Update the selected video state too
    if (selectedVideo && selectedVideo.id === id) {
      setSelectedVideo(prev => ({ ...prev, progress: newProg }));
    }
  };

  const [savingProgress, setSavingProgress] = useState(false);
  const [progressError, setProgressError] = useState('');

  /**
   * Persist completion. These cards are courses, while the server records
   * progress per lesson — so a card without a lessonId (anything but "continue
   * watching") has its lessons resolved first, and all of them are completed.
   */
  const handleMarkCompleted = async (video) => {
    const schoolId = childInfo?.schoolId;
    const courseId = video?.courseId || video?.id;
    if (!schoolId || !courseId) return;

    setSavingProgress(true);
    setProgressError('');
    try {
      let lessonIds = video.lessonId ? [video.lessonId] : [];
      if (!lessonIds.length) {
        const lessons = await listLessons(schoolId, courseId);
        lessonIds = (lessons || []).map((l) => l?._id || l?.id).filter(Boolean);
      }
      if (!lessonIds.length) {
        throw new Error('This course has no lessons to complete yet.');
      }

      await Promise.all(
        lessonIds.map((lessonId) =>
          saveLessonProgress(schoolId, courseId, lessonId, {
            progressPercent: 100,
            studentId: childInfo?.studentId,
          })
        )
      );

      // Only reflect completion after the server has accepted it
      setVideoProgress(100);
      setIsPlaying(false);
      updateLessonProgress(video.id, 100);
    } catch (err) {
      setProgressError(getErrorMessage(err, 'Could not save your progress. Please try again.'));
    } finally {
      setSavingProgress(false);
    }
  };

  const handleStartVideo = (video) => {
    setSelectedVideo(video);
    setVideoProgress(video.progress);
    setIsPlaying(true);
  };

  const getSubjectColor = (sub) => {
    if (sub === 'Science') return { bg: 'bg-[#EBFBF0]', text: 'text-[#34A853]' };
    if (sub === 'Mathematics') return { bg: 'bg-[#F4EBFF]', text: 'text-[#7F56D9]' };
    return { bg: 'bg-[#FFF0F6]', text: 'text-[#E91E63]' };
  };

  return (
    <div className="px-6 mt-8 font-outfit select-none">

      {/* 1. Header Row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F4EBFF] text-[#7F56D9] flex items-center justify-center shadow-[0_2px_8px_rgba(127,86,217,0.12)]">
            <GraduationCap size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-800 tracking-tight leading-none">Learning Hub</h2>
          </div>
        </div>
      </div>

      {/* 2. Continue Learning banner */}
      {loading ? (
        <div className="flex items-center justify-center py-10 mb-6">
          <Loader2 size={28} className="animate-spin text-[#7F56D9]" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-500 text-center mb-6">{error}</p>
      ) : lessons.continue && (activeTab === 'All' || activeTab === lessons.continue.subject) ? (
        <div className="bg-[#FAF8FF] border border-[#F3EDFF] rounded-[2rem] p-5 shadow-[0_8px_25px_rgba(0,0,0,0.015)] relative overflow-hidden mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11.5px] font-black text-[#7F56D9] uppercase tracking-wider leading-none">
              Continue Learning
            </h3>
            <button 
              onClick={() => navigate('/user/learning-hub')}
              className="text-[10px] font-black text-[#7F56D9] flex items-center gap-1 hover:underline active:scale-95 transition-all leading-none uppercase tracking-wider"
            >
              <span>View All</span>
              <ArrowRight size={10} className="stroke-[3px]" />
            </button>
          </div>

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
                className="mt-4 px-4.5 py-2.5 bg-[#7F56D9] hover:bg-[#6A47DE] text-white text-[11px] font-black rounded-xl shadow-md shadow-[#7F56D9]/15 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer w-fit"
              >
                <Play size={11} fill="currentColor" />
                <span>Resume</span>
              </button>
            </div>

          </div>
        </div>
      ) : null}

      {/* 3. Featured Videos Grid List */}
      <div>
        <div className="flex items-center justify-between mb-4.5">
          <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider leading-none">
            Featured Videos
          </h3>
          <button
            onClick={() => navigate('/user/learning-hub')}
            className="text-[10.5px] font-black text-[#7F56D9] flex items-center gap-1 hover:underline active:scale-95 transition-all leading-none"
          >
            <span>View All</span>
            <ArrowRight size={11} />
          </button>
        </div>

        {/* Scrollable list box */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide py-1">
          {!loading && filteredFeatured.length === 0 ? (
            <div className="min-w-full bg-white border border-dashed border-gray-200 rounded-[2rem] p-8 text-center">
              <BookOpen size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-400">No courses available yet</p>
              <p className="text-xs text-gray-400 mt-1">Check back when your school publishes learning content.</p>
            </div>
          ) : (
          filteredFeatured.map((video) => (
            <div
              key={video.id}
              className="min-w-[210px] max-w-[210px] bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-gray-200/50 group active:scale-[0.99] transition-all flex flex-col justify-between shrink-0"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => handleStartVideo(video)}
                className="h-28 relative cursor-pointer overflow-hidden border-b border-gray-50 shrink-0"
              >
                <img
                  src={video.image}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.9]"
                />

                {/* Visual Glassmorphic play button */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="w-9 h-9 rounded-full bg-white/95 text-gray-700 flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    <Play size={13} fill="currentColor" className="ml-0.5 text-gray-700" />
                  </div>
                </div>

                {/* Duration badge */}
                <span className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-bold rounded-md leading-none">
                  {video.duration}
                </span>
              </div>

              {/* Content Panel */}
              <div className="p-4.5 flex-1 flex flex-col justify-between">
                <div>
                  <span className={`px-2 py-0.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider ${getSubjectColor(video.subject).bg} ${getSubjectColor(video.subject).text}`}>
                    {video.subject}
                  </span>

                  <h4 className="text-[12.5px] font-black text-gray-800 mt-2 line-clamp-1 leading-snug group-hover:text-[#7F56D9] transition-colors">
                    {video.title}
                  </h4>

                  <p className="text-[9.5px] font-bold text-gray-400 mt-1 flex items-center gap-1 leading-none">
                    <BookOpen size={10} className="text-gray-300 shrink-0" />
                    <span className="truncate">{video.chapter}</span>
                  </p>
                </div>

                {/* Bottom details card (Teacher and Progress) */}
                <div className="mt-4.5 pt-3.5 border-t border-gray-50 flex flex-col gap-2.5">
                  {/* Teacher Info */}
                  <div className="flex items-center gap-2">
                    <img
                      src={video.teacherImg}
                      alt={video.teacher}
                      className="w-5.5 h-5.5 rounded-full object-cover border border-gray-100 shrink-0"
                    />
                    <span className="text-[9.5px] font-bold text-gray-500 truncate leading-none">
                      {video.teacher}
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${video.progress >= 80 ? 'bg-[#34A853]' : 'bg-[#7F56D9]'} transition-all duration-500`}
                        style={{ width: `${video.progress}%` }}
                      />
                    </div>
                    <span className="text-[8.5px] font-black text-gray-400 w-5.5 text-right leading-noneshrink-0">
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
                  onClick={() => handleMarkCompleted(selectedVideo)}
                  disabled={videoProgress >= 100 || savingProgress}
                  className={`px-3 py-2 border rounded-xl text-[10px] font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all ${videoProgress >= 100
                      ? 'bg-[#EBFBF0] border-[#34A853]/15 text-[#34A853]'
                      : 'bg-white border-gray-100 text-[#7F56D9] hover:border-gray-200'
                    }`}
                >
                  <CheckCircle2 size={11} />
                  <span>
                    {videoProgress >= 100 ? 'Completed' : savingProgress ? 'Saving…' : 'Mark Completed'}
                  </span>
                </button>
              </div>

              {progressError && (
                <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {progressError}
                </p>
              )}

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

export default ParentLearningHub;
