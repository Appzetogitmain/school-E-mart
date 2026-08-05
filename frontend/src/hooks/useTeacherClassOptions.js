import { useEffect, useState, useMemo, useCallback } from 'react';
import { listClasses } from '../services/schoolApi';
import { getErrorMessage } from '../utils/apiHelpers';
import { parseClassGrade } from '../utils/mappers/teacherMapper';

export const useTeacherClassOptions = (schoolId) => {
  const [rawClasses, setRawClasses] = useState([]);
  const [loading, setLoading] = useState(Boolean(schoolId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!schoolId) {
      setRawClasses([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    listClasses(schoolId)
      .then((data) => {
        if (!cancelled) {
          setRawClasses(data || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRawClasses([]);
          setError(getErrorMessage(err, 'Unable to load classes'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  const classLabels = useMemo(
    () => rawClasses.map((cls) => parseClassGrade(cls.classGrade)),
    [rawClasses]
  );

  const getSections = useCallback(
    (selectedClass) => {
      const match = rawClasses.find((cls) => parseClassGrade(cls.classGrade) === selectedClass);
      const sections = match?.sections?.length ? match.sections : [];
      return sections.map((section) =>
        String(section).replace(/^section\s*/i, '').trim().toUpperCase()
      );
    },
    [rawClasses]
  );

  const getSectionLabels = useCallback(
    (selectedClass) => getSections(selectedClass).map((section) => `Section ${section}`),
    [getSections]
  );

  // Subjects the teacher was actually assigned for this class+section —
  // not the school's full subject catalog.
  const getSubjects = useCallback(
    (selectedClass, selectedSection) => {
      const match = rawClasses.find((cls) => parseClassGrade(cls.classGrade) === selectedClass);
      if (!match || !selectedSection) return [];
      const rawSection = Object.keys(match.subjectsBySection || {}).find(
        (section) => String(section).replace(/^section\s*/i, '').trim().toUpperCase() === selectedSection
      );
      return rawSection ? match.subjectsBySection[rawSection] || [] : [];
    },
    [rawClasses]
  );

  return {
    classLabels,
    getSections,
    getSectionLabels,
    getSubjects,
    loading,
    error,
    hasClasses: classLabels.length > 0,
  };
};
