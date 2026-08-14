import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GraduationCap, Check, ArrowLeft, Building2 } from 'lucide-react';

const SchoolGradePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const group = searchParams.get('group');

  const [selectedGrade, setSelectedGrade] = useState('');

  const allGrades = [
    "Play Group", "Nursery", "LKG", "UKG",
    "Class 1", "Class 2", "Class 3", "Class 4",
    "Class 5", "Class 6", "Class 7", "Class 8",
    "Class 9", "Class 10", "Class 11", "Class 12"
  ];

  const grades = useMemo(() => {
    if (!group) return allGrades;
    if (group === 'Pre-Primary') return ["Play Group", "Nursery", "LKG", "UKG"];
    if (group === 'Primary') return ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];
    if (group === 'Secondary') return ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
    return allGrades;
  }, [group]);

  useEffect(() => {
    const saved = localStorage.getItem('childInfo');
    if (saved) {
      const info = JSON.parse(saved);
      if (info.role === 'school') setSelectedGrade(info.grade || '');
    }
  }, []);

  const handleSelect = (grade) => {
    setSelectedGrade(grade);

    // Update localStorage
    const saved = localStorage.getItem('childInfo');
    const info = saved ? JSON.parse(saved) : { role: 'school' };
    info.grade = grade;
    localStorage.setItem('childInfo', JSON.stringify(info));

    // Navigation for school
    setTimeout(() => {
      navigate(`/school/products?grade=${encodeURIComponent(grade)}`);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-10 font-outfit relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-80 h-80 bg-golden-yellow/5 rounded-full blur-3xl -z-10"></div>

      <div className="px-6 pt-8 flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 active:scale-90 transition-all shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-deep-purple leading-none mb-1">
              {group ? `${group} ` : ''}Grade
            </h1>
            <p className="text-gray-400 text-[10px] font-medium leading-none">Manage supplies by grade</p>
          </div>
        </div>
      </div>

      <div className="px-8 mb-8">
        <p className="text-text-secondary text-sm leading-relaxed opacity-80 max-w-xs">
          Select a grade to view office and faculty supplies.
        </p>
      </div>

      <div className="px-6">
        <div className="grid grid-cols-2 gap-4">
          {grades.map((grade) => {
            const isSelected = selectedGrade === grade;
            return (
              <button
                key={grade}
                onClick={() => handleSelect(grade)}
                className={`relative h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 transition-all duration-300 active:scale-95 border-2 ${isSelected ? 'bg-white border-primary shadow-xl shadow-primary/10' : 'bg-white border-transparent shadow-sm'
                  }`}
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
      </div>

      <div className="mt-12 text-center opacity-30">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Institutional Management</p>
      </div>
    </div>
  );
};

export default SchoolGradePage;
