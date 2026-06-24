const dns = require('dns');

// Force known public DNS resolvers to avoid local DNS issues (Atlas SRV lookups)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const { startServer } = require('./app');
const { disconnectDB } = require('./database/connection');
const { connectStateStore, disconnectStateStore } = require('./common/stateStore');
const { startOutboxWorker, stopOutboxWorker } = require('./services/outbox');
const config = require('./config');
const logger = require('./common/logger');

let server;
let outboxWorkerTimer;
let isShuttingDown = false;

const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn('Shutdown signal received', { signal });

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, config.env.SHUTDOWN_TIMEOUT_MS);

  forceExitTimer.unref();

  try {
    stopOutboxWorker(outboxWorkerTimer);

    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      logger.info('HTTP server closed');
    }

    await disconnectStateStore();
    await disconnectDB();
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  } catch (error) {
    logger.error('Error during graceful shutdown', {
      message: error.message,
      stack: error.stack,
    });
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
};

const registerProcessHandlers = () => {
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    shutdown('unhandledRejection', 1);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      message: error.message,
      stack: error.stack,
    });
    shutdown('uncaughtException', 1);
  });
};

const bootstrap = async () => {
  registerProcessHandlers();
  await connectStateStore();

  if (config.integrations.outbox.workerEnabled) {
    outboxWorkerTimer = startOutboxWorker({
      pollIntervalMs: config.integrations.outbox.pollIntervalMs,
      batchSize: config.integrations.outbox.batchSize,
    });
  }

  server = await startServer();
};

bootstrap().catch((error) => {
  logger.error('Failed to start application', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
