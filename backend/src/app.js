const http = require('http');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const routes = require('./routes');
const middlewares = require('./middlewares');
const { getHealth } = require('./controllers/health.controller');
const { UPLOADS_DIR } = require('./utils/fileStorage');
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

  // Homework submissions inline the completed work as base64 data URIs: up to 5 files of
  // 5mb each, which base64 inflates to ~34mb. That budget is granted only to the
  // submission route — parsing it first means the global parser below skips the body, so
  // every other route keeps the smaller limit rather than opening a 40mb surface app-wide.
  const submissionPath = /\/lms\/courses\/[^/]+\/assignments\/[^/]+\/submissions$/;
  const submissionParser = express.json({ limit: '40mb' });
  app.use((req, res, next) => {
    if (req.method === 'POST' && submissionPath.test(req.path)) {
      return submissionParser(req, res, next);
    }
    return next();
  });

  // Avatars are also posted as base64 and do not fit in the default 1mb budget.
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(middlewares.requestLogger);

  // Infra probe endpoint (load balancers); versioned API lives under API_PREFIX
  app.get('/health', getHealth);
  // Public assets only. Homework submissions deliberately live outside this directory
  // and are readable solely through the authorized attachment stream endpoint.
  app.use('/uploads', express.static(UPLOADS_DIR));
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
