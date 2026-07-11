export const flattenClassesForList = (classes = [], academicYear = '') =>
  classes.flatMap((cls) => {
    const sections = cls?.sections?.length ? cls.sections : ['-'];

    return sections.map((section) => {
      const teacherInfo = cls?.classTeachers?.[section];
      return {
        id: `${cls.classGrade}-${section}`,
        className: cls.classGrade,
        academicYear: academicYear || '—',
        section: section === '-' ? '-' : section,
        classTeacher: teacherInfo?.name || teacherInfo?.designation || 'Not Assigned',
        teacherProfileId: teacherInfo?.teacherProfileId,
      };
    });
  });
