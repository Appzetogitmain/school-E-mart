const app = require('./app');
const connectDB = require('./database/connection');
const env = require('./config/env');
const logger = require('./common/logger');

const startServer = async () => {
  await connectDB(env.MONGODB_URI);

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`, {
      env: env.NODE_ENV,
      apiPrefix: env.API_PREFIX,
    });
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', { message: error.message });
  process.exit(1);
});
