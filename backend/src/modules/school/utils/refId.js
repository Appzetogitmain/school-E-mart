const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomSuffix = (length = 6) => {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  }
  return result;
};

const generateUserRefId = (rolePrefix) => `SEM-${rolePrefix}-${randomSuffix(6)}`;

// `code` carries a unique index. The suffix used to be the last 4 digits of
// Date.now(), which repeat every 10 seconds — two schools whose names share the
// first three letters and register in the same window collided and the insert
// failed. A random suffix also means a retry actually produces a new candidate,
// which a timestamp within the same millisecond does not.
const generateSchoolCode = (name = 'SCH') => {
  const prefix = String(name)
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  return `${prefix}-${randomSuffix(4)}`;
};

const generateSchoolRefNo = () =>
  `SEM-ADM-${Math.floor(100000 + Math.random() * 900000)}`;

const generateStudentRefNo = (schoolId, sequence = 1) => {
  const year = new Date().getFullYear();
  const schoolPart = String(schoolId).slice(-4).toUpperCase();
  return `STU-${year}-${schoolPart}-${String(sequence).padStart(4, '0')}`;
};

module.exports = {
  generateUserRefId,
  generateSchoolCode,
  generateSchoolRefNo,
  generateStudentRefNo,
  randomSuffix,
};
