/**
 * The calendar date in the viewer's own timezone, as YYYY-MM-DD.
 *
 * Not interchangeable with `toISOString().slice(0, 10)`, which yields the UTC date:
 * in IST (UTC+5:30) that is still the previous day until 05:30 local, so attendance
 * marked early in the morning would be filed against yesterday.
 */
export const toLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
