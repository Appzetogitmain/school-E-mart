const mongoose = require('mongoose');
const logger = require('../common/logger');

const withTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};

const withTransactionRetry = async (callback, maxAttempts = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await withTransaction(callback);
    } catch (error) {
      lastError = error;
      const isTransient =
        error.hasErrorLabel?.('TransientTransactionError') ||
        error.code === 112 ||
        error.errorLabels?.includes('TransientTransactionError');

      if (!isTransient || attempt === maxAttempts) {
        throw error;
      }

      logger.warn('Transient transaction error, retrying', {
        attempt,
        maxAttempts,
        message: error.message,
      });
    }
  }

  throw lastError;
};

module.exports = {
  withTransaction,
  withTransactionRetry,
};
