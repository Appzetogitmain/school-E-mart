const env = require('./env');

module.exports = Object.freeze({
  uri: env.MONGODB_URI,
  options: Object.freeze({
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    autoIndex: env.NODE_ENV !== 'production',
  }),
});
