const http = require('http');
const path = require('path');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const routes = require('./routes');
const middlewares = require('./middlewares');
const { getHealth } = require('./controllers/health.controller');
const logger = require('./common/logger');

require('./database/modelRegistry');

const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(middlewares.requestId);
  app.use(helmet(config.security.helmet));
  app.use(cors(config.cors));
  app.use(compression(config.security.compression));

  // Razorpay webhooks require the raw body for signature verification
  const razorpayWebhookRoutes = require('./webhooks/razorpay/razorpayWebhook.routes');
  app.use(
    '/api/webhooks/razorpay',
    express.raw({ type: 'application/json', limit: '1mb' }),
    razorpayWebhookRoutes
  );
  const deliveryWebhookRoutes = require('./routes/deliveryWebhookRoutes');
  app.use('/api/delivery', express.raw({ type: '*/*', limit: '1mb' }), deliveryWebhookRoutes);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(middlewares.requestLogger);

  // Infra probe endpoint (load balancers); versioned API lives under API_PREFIX
  app.get('/health', getHealth);
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
  app.use(config.env.API_PREFIX, routes);

  app.use(middlewares.notFoundHandler);
  app.use(middlewares.errorHandler);

  return app;
};

const app = createApp();

const startServer = async () => {
  const { connectDB } = require('./database/connection');

  await connectDB(config.database.uri);

  const server = http.createServer(app);

  server.listen(config.env.PORT, () => {
    logger.info('HTTP server started', {
      port: config.env.PORT,
      environment: config.env.NODE_ENV,
      apiPrefix: config.env.API_PREFIX,
      version: config.app.version,
    });
  });

  return server;
};

module.exports = {
  app,
  createApp,
  startServer,
};
