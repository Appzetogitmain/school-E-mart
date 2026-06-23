const { withTransaction } = require('../../../database');

const isTransactionUnsupported = (error) =>
  error?.message?.includes('replica set') ||
  error?.message?.includes('mongos') ||
  error?.code === 20 ||
  error?.codeName === 'IllegalOperation';

/**
 * Runs callback inside a MongoDB transaction when supported; otherwise runs sequentially.
 */
const runAtomic = async (callback) => {
  try {
    return await withTransaction(callback);
  } catch (error) {
    if (!isTransactionUnsupported(error)) throw error;
    return callback(null);
  }
};

module.exports = { runAtomic, isTransactionUnsupported };
