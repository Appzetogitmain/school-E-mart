const toISOString = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60_000);

const addHours = (date, hours) => new Date(date.getTime() + hours * 3_600_000);

const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000);

module.exports = {
  toISOString,
  addMinutes,
  addHours,
  addDays,
};
