const fs = require('fs');
const path = require('path');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const loggerConfig = require('../../config/logger');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const ensureLogDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const buildConsoleFormat = () =>
  combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ timestamp: ts, level, message, stack, ...meta }) => {
      const metaKeys = Object.keys(meta).filter((key) => key !== 'service');
      const metaStr = metaKeys.length ? ` ${JSON.stringify(meta)}` : '';
      const stackStr = stack ? `\n${stack}` : '';
      return `[${ts}] ${level}: ${message}${metaStr}${stackStr}`;
    })
  );

const buildJsonFormat = () =>
  combine(timestamp(), errors({ stack: true }), json());

const createWinstonLogger = () => {
  ensureLogDirectory(loggerConfig.dir);

  const jsonFormat = buildJsonFormat();
  const consoleFormat = buildConsoleFormat();

  const transports = [
    new winston.transports.Console({
      level: loggerConfig.level,
      format: loggerConfig.isProduction ? jsonFormat : consoleFormat,
    }),
  ];

  if (loggerConfig.isProduction) {
    transports.push(
      new DailyRotateFile({
        dirname: loggerConfig.dir,
        filename: 'application-%DATE%.log',
        datePattern: loggerConfig.rotation.datePattern,
        maxFiles: loggerConfig.rotation.maxFiles,
        maxSize: loggerConfig.rotation.maxSize,
        level: loggerConfig.level,
        format: jsonFormat,
      }),
      new DailyRotateFile({
        dirname: loggerConfig.dir,
        filename: 'error-%DATE%.log',
        datePattern: loggerConfig.rotation.datePattern,
        maxFiles: loggerConfig.rotation.errorMaxFiles,
        level: 'error',
        format: jsonFormat,
      })
    );
  }

  const exceptionTransport = loggerConfig.isProduction
    ? [
        new DailyRotateFile({
          dirname: loggerConfig.dir,
          filename: 'exceptions-%DATE%.log',
          datePattern: loggerConfig.rotation.datePattern,
          maxFiles: loggerConfig.rotation.errorMaxFiles,
          format: jsonFormat,
        }),
      ]
    : [new winston.transports.Console({ format: consoleFormat })];

  const rejectionTransport = loggerConfig.isProduction
    ? [
        new DailyRotateFile({
          dirname: loggerConfig.dir,
          filename: 'rejections-%DATE%.log',
          datePattern: loggerConfig.rotation.datePattern,
          maxFiles: loggerConfig.rotation.errorMaxFiles,
          format: jsonFormat,
        }),
      ]
    : [new winston.transports.Console({ format: consoleFormat })];

  return winston.createLogger({
    level: loggerConfig.level,
    defaultMeta: { service: loggerConfig.serviceName },
    transports,
    exceptionHandlers: exceptionTransport,
    rejectionHandlers: rejectionTransport,
    exitOnError: false,
  });
};

const winstonLogger = createWinstonLogger();

const log = (level, message, meta) => {
  if (meta && Object.keys(meta).length > 0) {
    winstonLogger.log(level, message, meta);
  } else {
    winstonLogger.log(level, message);
  }
};

module.exports = {
  error: (message, meta) => log('error', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  info: (message, meta) => log('info', message, meta),
  debug: (message, meta) => log('debug', message, meta),
  stream: {
    write: (message) => {
      winstonLogger.info(message.trim());
    },
  },
  winston: winstonLogger,
};
