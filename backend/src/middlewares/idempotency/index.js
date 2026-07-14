const IdempotencyKey = require('../../database/models/IdempotencyKey');
const { BadRequestError, ConflictError } = require('../../common/errors');
const asyncHandler = require('../../utils/asyncHandler');
const { sha256 } = require('../../utils/crypto');

const IDEMPOTENCY_HEADER = 'idempotency-key';
const ALT_IDEMPOTENCY_HEADER = 'x-idempotency-key';

const extractIdempotencyKey = (req) => {
  const key = req.headers[IDEMPOTENCY_HEADER] || req.headers[ALT_IDEMPOTENCY_HEADER];
  return key ? String(key).trim() : null;
};

/**
 * Ensures write endpoints are not processed twice with the same idempotency key.
 * Attach `req.idempotency` for downstream handlers to finalize after success.
 */
const requireIdempotencyKey =
  (scope, { ttlMs = 24 * 60 * 60 * 1000 } = {}) =>
  asyncHandler(async (req, res, next) => {
    const key = extractIdempotencyKey(req);
    if (!key || key.length < 8 || key.length > 128) {
      throw new BadRequestError(
        'Idempotency-Key header is required (8–128 characters)',
        null,
        'IDEMPOTENCY_KEY_REQUIRED'
      );
    }

    const expiresAt = new Date(Date.now() + ttlMs);
    const userId = req.auth?.userId || null;

    try {
      await IdempotencyKey.create({
        key,
        scope,
        userId,
        expiresAt,
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictError('Duplicate request detected', 'IDEMPOTENCY_CONFLICT');
      }
      throw error;
    }

    req.idempotency = {
      key,
      scope,
      expiresAt,
      complete: async (payload) => {
        const responseHash = sha256(JSON.stringify(payload));
        await IdempotencyKey.updateOne({ key, scope }, { $set: { responseHash } });
      },
    };

    return next();
  });

module.exports = {
  requireIdempotencyKey,
  extractIdempotencyKey,
};
