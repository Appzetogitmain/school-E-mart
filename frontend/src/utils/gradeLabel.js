// Turns whatever a child profile calls its class ("NURSERY", "nursery", "5", "Class 5",
// "5th", "Std 5", "Play Group", "UKG") into the exact grade tag vendors pick in the
// product form ("Play Group", "Nursery", "LKG", "UKG", "Class 1" ... "Class 12").
//
// Returns undefined when the label is not one of those (e.g. a school-specific name such
// as "KG2" or "Pre-Nursery"). Callers must then NOT filter by grade: guessing would hide
// every grade-tagged product from that child.
export const normalizeGradeLabel = (raw) => {
  if (raw === null || raw === undefined) return undefined;
  // Some profiles store the section with the class ("Nursery - A", "Class 5 (B)").
  const withoutSection = String(raw).trim().replace(/\s*[-–(]\s*[a-z]\)?$/i, '');
  const compact = withoutSection.toLowerCase().replace(/[\s._-]+/g, '');
  if (!compact) return undefined;

  if (compact === 'playgroup' || compact === 'pg') return 'Play Group';
  if (compact === 'nursery') return 'Nursery';
  if (compact === 'lkg') return 'LKG';
  if (compact === 'ukg') return 'UKG';

  const match = compact.match(/^(?:class|grade|std|standard)?0*(\d{1,2})(?:st|nd|rd|th)?$/);
  if (match) {
    const number = Number(match[1]);
    if (number >= 1 && number <= 12) return `Class ${number}`;
  }
  return undefined;
};
