import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, X, MonitorPlay, Eye, Loader2 } from 'lucide-react';
import { listPlatformTutorials, recordTutorialView } from '../../services/contentApi';
import { getErrorMessage } from '../../utils/apiHelpers';
import { mapPublicTutorial } from '../../utils/mappers/tutorialsMapper';

/**
 * "Learn more about platform" — shared body for the Student/Parent, Teacher
 * and School Profile pages. The backend scopes the list to the signed-in
 * user's role (plus anything targeted at "all"), so this component doesn't
 * need to know which portal it's rendering in beyond where "back" goes.
 */
const PlatformTutorialsView = ({ backTo, title = 'Learn More About Platform' }) => {
  const navigate = useNavigate();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await listPlatformTutorials();
        if (!cancelled) setTutorials((data || []).map(mapPublicTutorial));
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load tutorial videos'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePlay = (tutorial) => {
    setPlaying(tutorial);
    recordTutorialView(tutorial.id).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-16 font-outfit relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-b border-gray-100 z-30 px-6 py-5 flex items-center justify-between">
        <button
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-deep-purple active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-black text-deep-purple">{title}</h1>
        <div className="w-10 h-10"></div>
      </div>

      <div className="pt-24 px-6 space-y-5">
        <div className="bg-gradient-to-br from-deep-purple via-deep-purple to-[#4c489d] rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-purple-900/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
              <MonitorPlay size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black">See how School E-Mart works</h2>
              <p className="text-white/70 text-[11px] font-semibold mt-0.5">Short videos to help you get the most out of your account</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="animate-spin text-deep-purple" />
            <p className="text-xs font-bold text-gray-400">Loading videos…</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50 text-center">
            <p className="text-xs font-bold text-red-500">{error}</p>
          </div>
        ) : tutorials.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/50 text-center space-y-2">
            <MonitorPlay size={28} className="mx-auto text-gray-300" />
            <p className="text-sm font-black text-gray-500">No videos yet</p>
            <p className="text-[11px] font-bold text-gray-400">Check back soon — we're adding tutorial videos here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tutorials.map((tutorial) => (
              <button
                key={tutorial.id}
                onClick={() => handlePlay(tutorial)}
                className="w-full text-left bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden active:scale-[0.98] transition-all group"
              >
                <div className="relative aspect-video w-full bg-gray-900 overflow-hidden">
                  {tutorial.thumbnailUrl ? (
                    <img
                      src={tutorial.thumbnailUrl}
                      alt={tutorial.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <MonitorPlay size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                    <Play size={18} className="fill-deep-purple text-deep-purple ml-0.5" />
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="text-xs font-black text-gray-800 line-clamp-1">{tutorial.title}</h3>
                  {tutorial.description && (
                    <p className="text-[10px] font-semibold text-gray-400 line-clamp-2 leading-relaxed">{tutorial.description}</p>
                  )}
                  {tutorial.views > 0 && (
                    <p className="flex items-center gap-1 text-[9px] font-bold text-gray-300 pt-0.5">
                      <Eye size={10} /> {tutorial.views.toLocaleString()} views
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video player overlay */}
      {playing && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setPlaying(null)}
              className="absolute -top-12 right-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <X size={18} />
            </button>
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
              <video
                src={playing.videoUrl}
                className="w-full aspect-video"
                controls
                autoPlay
                playsInline
              />
            </div>
            <div className="mt-3 px-1">
              <h3 className="text-sm font-black text-white">{playing.title}</h3>
              {playing.description && (
                <p className="text-[11px] font-semibold text-white/60 mt-1 leading-relaxed">{playing.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformTutorialsView;
