import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GraduationCap, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { getSchool } from '../../../services/schoolApi';
import { getChildInfoFromStorage } from '../../../utils/parentContext';

// Used to order whatever the school reports, and as the catalogue-wide list when
// the user has no school linked (guests / "explore schools").
const STANDARD_GRADES = [
  "Play Group", "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4",
  "Class 5", "Class 6", "Class 7", "Class 8",
  "Class 9", "Class 10", "Class 11", "Class 12"
];

const GRADE_GROUPS = {
  'Pre-Primary': ["Play Group", "Nursery", "LKG", "UKG"],
  Primary: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
  Secondary: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
};

const sortByStandardOrder = (list) =>
  [...list].sort((a, b) => {
    const ai = STANDARD_GRADES.indexOf(a);
    const bi = STANDARD_GRADES.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

const SelectGradePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const group = searchParams.get('group');

  const [selectedGrade, setSelectedGrade] = useState(() => getChildInfoFromStorage()?.grade || '');
  const [lastSelected] = useState(() => getChildInfoFromStorage()?.grade || '');
  const [schoolGrades, setSchoolGrades] = useState(null);
  const [loading, setLoading] = useState(true);

  // Prefer the grades the school actually offers; fall back to the standard list.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const childInfo = getChildInfoFromStorage();
      const schoolId = childInfo?.schoolId;

      if (!schoolId || schoolId === 'explore-schools') {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const school = await getSchool(schoolId);
        if (!cancelled && school?.gradesOffered?.length) {
          setSchoolGrades(sortByStandardOrder(school.gradesOffered));
        }
      } catch {
        // Leave schoolGrades null so the standard list is used.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const grades = useMemo(() => {
    const base = schoolGrades ?? STANDARD_GRADES;
    const groupGrades = group ? GRADE_GROUPS[group] : null;
    if (!groupGrades) return base;
    // Only offer grades in this group that the school actually has.
    return base.filter((grade) => groupGrades.includes(grade));
  }, [group, schoolGrades]);

  const handleSelect = (grade) => {
    setSelectedGrade(grade);
    
    const info = { ...(getChildInfoFromStorage() || {}), grade };
    localStorage.setItem('childInfo', JSON.stringify(info));

    // Instant navigation with slight delay for visual feedback
    setTimeout(() => {
      navigate(`/user/products?grade=${encodeURIComponent(grade)}`);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-10 font-outfit relative overflow-hidden">
      {/* Subtle Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-80 h-80 bg-golden-yellow/5 rounded-full blur-3xl -z-10"></div>

      {/* Top Header Navigation */}
      <div className="px-6 pt-8 flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 active:scale-90 transition-all shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-deep-purple leading-none mb-1">
              Select {group ? `${group} ` : ''}Grade
            </h1>
            <p className="text-gray-400 text-[10px] font-medium leading-none">Choose your child's class</p>
          </div>
        </div>
      </div>

      {/* Main Header Section */}
      <div className="px-8 mb-8">
        <p className="text-text-secondary text-sm leading-relaxed opacity-80 max-w-xs">
          Selecting a grade helps us show you school-specific uniforms, books, and essentials.
        </p>
      </div>

      {/* UX Hint */}
      {lastSelected && (
        <div className="px-8 mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Last selected: <span className="text-primary">{lastSelected}</span>
          </p>
        </div>
      )}

      {/* Grades Grid */}
      <div className="px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary mb-4" />
            <p className="text-sm text-gray-400">Loading grades…</p>
          </div>
        ) : grades.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-bold text-deep-purple mb-1">No grades available</p>
            <p className="text-xs text-gray-400">Your school hasn&apos;t published its class list yet.</p>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-4">
          {grades.map((grade) => {
            const isSelected = selectedGrade === grade;
            return (
              <button
                key={grade}
                onClick={() => handleSelect(grade)}
                className={`
                  relative h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2
                  transition-all duration-300 active:scale-95 border-2
                  ${isSelected 
                    ? 'bg-white border-primary shadow-xl shadow-primary/10' 
                    : 'bg-white border-transparent shadow-sm hover:shadow-md'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
                <span className={`text-[15px] font-bold ${isSelected ? 'text-primary' : 'text-deep-purple'}`}>
                  {grade}
                </span>
                <div className={`w-8 h-1 rounded-full ${isSelected ? 'bg-primary' : 'bg-gray-100 opacity-50'}`}></div>
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-12 text-center opacity-30">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">School E-Mart Essentials</p>
      </div>
    </div>
  );
};

export default SelectGradePage;
