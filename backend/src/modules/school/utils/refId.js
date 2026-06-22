const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomSuffix = (length = 6) => {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  }
  return result;
};

const generateUserRefId = (rolePrefix) => `SEM-${rolePrefix}-${randomSuffix(6)}`;

const generateSchoolCode = (name = 'SCH') => {
  const prefix = String(name)
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  return `${prefix}-${Date.now().toString().slice(-4)}`;
};

const generateStudentRefNo = (schoolId, sequence = 1) => {
  const year = new Date().getFullYear();
  const schoolPart = String(schoolId).slice(-4).toUpperCase();
  return `STU-${year}-${schoolPart}-${String(sequence).padStart(4, '0')}`;
};

module.exports = {
  generateUserRefId,
  generateSchoolCode,
  generateStudentRefNo,
  randomSuffix,
};
