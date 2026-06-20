const env = require('../../config/env');

const levels = ['error', 'warn', 'info', 'debug'];
const currentLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

const shouldLog = (level) => levels.indexOf(level) <= levels.indexOf(currentLevel);

const formatMeta = (meta) => {
  if (!meta) return '';
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ' [meta-unserializable]';
  }
};

const log = (level, message, meta) => {
  if (!shouldLog(level)) return;
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`;
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

module.exports = {
  error: (message, meta) => log('error', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  info: (message, meta) => log('info', message, meta),
  debug: (message, meta) => log('debug', message, meta),
};
