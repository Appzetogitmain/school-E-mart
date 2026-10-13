import React, { useState, useEffect } from 'react';
import { Cake, Sparkles, Gift, PartyPopper, Users, GraduationCap, ChevronRight, Check } from 'lucide-react';
import { getTodayBirthdays, wishBirthday } from '../../services/schoolApi';
import { useSchoolId } from '../../utils/schoolContext';
import { toAbsoluteUrl } from '../../utils/url';
import { getErrorMessage } from '../../utils/apiHelpers';

const TodayBirthdaysWidget = ({ 
  schoolId, 
  classGrade, 
  section, 
  variant = 'dashboard', // 'dashboard' | 'events'
  className = ''
}) => {
  const fallbackSchoolId = useSchoolId();
  const effectiveSchoolId = schoolId || fallbackSchoolId;

  const [birthdays, setBirthdays] = useState({ students: [], teachers: [], totalToday: 0 });
  const [loading, setLoading] = useState(true);
  const [wishedMap, setWishedMap] = useState({});
  const [sendingMap, setSendingMap] = useState({});
  const [wishError, setWishError] = useState('');

  useEffect(() => {
    let active = true;
    if (!effectiveSchoolId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getTodayBirthdays(effectiveSchoolId)
      .then((res) => {
        if (!active) return;
        setBirthdays(res || { students: [], teachers: [], totalToday: 0 });
        setWishedMap(Object.fromEntries([
          ...(res?.students || []).map((student) => [`student:${student.id}`, Boolean(student.wished)]),
          ...(res?.teachers || []).map((teacher) => [`teacher:${teacher.id}`, Boolean(teacher.wished)]),
        ]));
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Unable to load today birthdays:', err?.message);
        setBirthdays({ students: [], teachers: [], totalToday: 0 });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [effectiveSchoolId]);

  const handleWish = async (type, id) => {
    const key = `${type}:${id}`;
    if (sendingMap[key] || wishedMap[key]) return;
    setSendingMap((prev) => ({ ...prev, [key]: true }));
    setWishError('');
    try {
      await wishBirthday(effectiveSchoolId, type, id);
      setWishedMap((prev) => ({ ...prev, [key]: true }));
      // Keep student in the array marked as wished so it NEVER disappears
      setBirthdays((prev) => {
        if (type === 'student') {
          return {
            ...prev,
            students: (prev.students || []).map((s) => (String(s.id) === String(id) ? { ...s, wished: true } : s)),
          };
        }
        return {
          ...prev,
          teachers: (prev.teachers || []).map((t) => (String(t.id) === String(id) ? { ...t, wished: true } : t)),
        };
      });
    } catch (error) {
      setWishError(getErrorMessage(error, 'Unable to send birthday wish'));
    } finally {
      setSendingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const { students, teachers, totalToday } = birthdays;

  // Filter or highlight matching student class if provided (e.g. for Teacher Dashboard)
  const isClassMatch = (student) => {
    if (!classGrade) return false;
    const cleanStudentGrade = String(student.classGrade || '').replace(/\D/g, '');
    const cleanFilterGrade = String(classGrade || '').replace(/\D/g, '');
    const gradeMatch = cleanStudentGrade && cleanFilterGrade && cleanStudentGrade === cleanFilterGrade;
    if (!section) return gradeMatch;
    const secMatch = String(student.section || '').trim().toLowerCase() === String(section || '').trim().toLowerCase();
    return gradeMatch && secMatch;
  };

  if (loading) {
    return (
      <div className={`p-4 bg-gradient-to-r from-amber-50/50 via-purple-50/40 to-pink-50/50 border border-amber-200/60 rounded-[2rem] animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-200/50" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-amber-200/50 rounded-full w-40" />
            <div className="h-2.5 bg-amber-200/30 rounded-full w-24" />
          </div>
        </div>
      </div>
    );
  }

  // If no birthdays today:
  if (totalToday === 0) {
    if (variant === 'events') {
      return (
        <div className={`p-5 bg-white border border-gray-200/80 rounded-[2rem] shadow-sm flex items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center shrink-0">
              <Cake size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black text-deep-purple flex items-center gap-1.5">
                Today's Birthdays
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">0 Today</span>
              </h3>
              <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                No student or teacher birthdays on this date.
              </p>
            </div>
          </div>
          <span className="text-lg">🎈</span>
        </div>
      );
    }

    // Default dashboard compact empty state
    return (
      <div className={`p-4 bg-white/90 border border-gray-100 rounded-[1.8rem] shadow-sm flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Cake size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-700">No Birthdays Today</h4>
            <p className="text-[10px] text-gray-400 font-medium">All students & teachers have birthdays on other dates.</p>
          </div>
        </div>
        <span className="text-sm opacity-60">🎈</span>
      </div>
    );
  }

  // When birthdays exist:
  return (
    <div className={`bg-gradient-to-br from-amber-50/70 via-white to-purple-50/60 border border-amber-200/70 rounded-[2.2rem] p-5 shadow-lg shadow-amber-500/5 relative overflow-hidden ${className}`}>
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-200/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Cake size={20} className="animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-deep-purple tracking-tight">Today's Birthdays</h2>
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={10} /> {totalToday} {totalToday === 1 ? 'Celebration' : 'Celebrations'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Celebrate today's special day with your school community! 🎉</p>
          </div>
        </div>
      </div>

      {/* Cards List */}
      {wishError && <p role="alert" className="mb-3 text-xs font-semibold text-red-600">{wishError}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
        {/* Student Birthdays */}
        {students.map((student) => {
          const inClass = isClassMatch(student);
          const isWished = Boolean(wishedMap[`student:${student.id}`] ?? student.wished);

          return (
            <div 
              key={`student-${student.id}`}
              className={`p-3.5 bg-white border ${
                isWished
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : inClass 
                    ? 'border-primary/40 ring-2 ring-primary/10' 
                    : 'border-amber-100'
              } rounded-2xl shadow-sm flex items-center justify-between gap-3 transition-all hover:shadow-md`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  {student.avatarUrl ? (
                    <img 
                      src={toAbsoluteUrl(student.avatarUrl)} 
                      alt={student.name} 
                      className="w-11 h-11 rounded-2xl object-cover border border-amber-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 font-black flex items-center justify-center text-sm border border-amber-200">
                      {student.name ? student.name.slice(0, 2).toUpperCase() : 'ST'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm border border-white">
                    🎂
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs font-black text-gray-900 truncate">{student.name}</h3>
                    {inClass && (
                      <span className="px-1.5 py-0.2 bg-primary/10 text-primary rounded-md text-[9px] font-black">
                        In Your Class ⭐
                      </span>
                    )}
                    {isWished && (
                      <span className="px-1.5 py-0.2 bg-emerald-100/90 text-emerald-700 rounded-md text-[9px] font-black border border-emerald-200">
                        Wished ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5 truncate flex items-center gap-1">
                    <GraduationCap size={11} className="text-amber-500" />
                    <span>Class {student.classGrade || 'N/A'}{student.section ? `-${student.section}` : ''}</span>
                    {student.rollNo && <span>• Roll #{student.rollNo}</span>}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleWish('student', student.id)}
                disabled={isWished || sendingMap[`student:${student.id}`]}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all flex items-center gap-1 active:scale-95 ${
                  isWished 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-black cursor-default' 
                    : sendingMap[`student:${student.id}`]
                      ? 'bg-amber-100 text-amber-700 border border-amber-200 cursor-wait'
                      : 'bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-sm hover:opacity-95'
                }`}
              >
                {isWished ? (
                  <>
                    <Check size={12} strokeWidth={3} /> Wished!
                  </>
                ) : sendingMap[`student:${student.id}`] ? (
                  <span>Sending…</span>
                ) : (
                  <>
                    <PartyPopper size={12} /> Wish 🎉
                  </>
                )}
              </button>
            </div>
          );
        })}

        {/* Teacher Birthdays */}
        {teachers.map((teacher) => {
          const isWished = Boolean(wishedMap[`teacher:${teacher.id}`] ?? teacher.wished);

          return (
            <div 
              key={`teacher-${teacher.id}`}
              className={`p-3.5 bg-white border ${
                isWished
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-purple-100'
              } rounded-2xl shadow-sm flex items-center justify-between gap-3 transition-all hover:shadow-md`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  {teacher.avatarUrl ? (
                    <img 
                      src={toAbsoluteUrl(teacher.avatarUrl)} 
                      alt={teacher.name} 
                      className="w-11 h-11 rounded-2xl object-cover border border-purple-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-sm border border-purple-200">
                      {teacher.name ? teacher.name.slice(0, 2).toUpperCase() : 'TR'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm border border-white">
                    🌟
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs font-black text-gray-900 truncate">{teacher.name}</h3>
                    <span className="px-1.5 py-0.2 bg-purple-50 text-purple-600 rounded-md text-[9px] font-black border border-purple-100">
                      Staff 🎈
                    </span>
                    {isWished && (
                      <span className="px-1.5 py-0.2 bg-emerald-100/90 text-emerald-700 rounded-md text-[9px] font-black border border-emerald-200">
                        Wished ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5 truncate flex items-center gap-1">
                    <Users size={11} className="text-purple-500" />
                    <span>{teacher.designation || 'Staff'}</span>
                    {teacher.department && <span>• {teacher.department}</span>}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleWish('teacher', teacher.id)}
                disabled={isWished || sendingMap[`teacher:${teacher.id}`]}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all flex items-center gap-1 active:scale-95 ${
                  isWished 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-black cursor-default' 
                    : sendingMap[`teacher:${teacher.id}`]
                      ? 'bg-purple-100 text-purple-700 border border-purple-200 cursor-wait'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm hover:opacity-95'
                }`}
              >
                {isWished ? (
                  <>
                    <Check size={12} strokeWidth={3} /> Wished!
                  </>
                ) : sendingMap[`teacher:${teacher.id}`] ? (
                  <span>Sending…</span>
                ) : (
                  <>
                    <PartyPopper size={12} /> Wish 🎉
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TodayBirthdaysWidget;
