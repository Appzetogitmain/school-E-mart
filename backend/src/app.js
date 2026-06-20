const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const corsConfig = require('./config/cors');
const securityConfig = require('./config/security');
const env = require('./config/env');
const routes = require('./routes');
const { globalLimiter } = require('./middlewares/rateLimit');
const { errorHandler, notFoundHandler } = require('./middlewares/error');

require('./database/modelRegistry');

const app = express();

app.set('trust proxy', 1);

app.use(helmet(securityConfig.helmet));
app.use(cors(corsConfig));
app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

app.use(env.API_PREFIX, routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
