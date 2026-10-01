const logger = require('../../common/logger');
const triggerService = require('./trigger.service');

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

let timeoutId = null;
let intervalId = null;

const getMsUntilNext8AM = () => {
  const now = new Date();
  const next8AM = new Date();
  next8AM.setHours(8, 0, 0, 0);
  if (now >= next8AM) {
    next8AM.setDate(next8AM.getDate() + 1);
  }
  return next8AM.getTime() - now.getTime();
};

const runBirthdayCheck = () => {
  try {
    triggerService.checkAndNotifyStudentBirthdays();
  } catch (err) {
    logger.error('Scheduled birthday check failed', { message: err.message });
  }
};

const startBirthdayScheduler = () => {
  if (timeoutId || intervalId) return;

  logger.info('Initializing Student Birthday Notification Scheduler (Scheduled for 8:00 AM daily)...');

  const msUntil8AM = getMsUntilNext8AM();

  // Schedule first run at 8:00 AM
  timeoutId = setTimeout(() => {
    timeoutId = null;
    runBirthdayCheck();

    // After first 8:00 AM run, repeat every 24 hours at 8:00 AM
    intervalId = setInterval(() => {
      runBirthdayCheck();
    }, TWENTY_FOUR_HOURS_MS);
  }, msUntil8AM);
};

const stopBirthdayScheduler = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = {
  startBirthdayScheduler,
  stopBirthdayScheduler,
  getMsUntilNext8AM,
};

