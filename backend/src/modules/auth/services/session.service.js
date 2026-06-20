const { NotFoundError } = require('../../../common/errors');
const { messages } = require('../../../constants');
const sessionRepository = require('../repositories/session.repository');
const auditRepository = require('../repositories/audit.repository');
const { mapSessionToDto } = require('../mappers/auth.mapper');

const sessionService = {
  async listActiveSessions(userId, currentJti) {
    const sessions = await sessionRepository.findActiveByUserId(userId);
    return sessions.map((session) =>
      mapSessionToDto({
        ...session,
        id: session._id.toString(),
        current: session.jti === currentJti,
      })
    );
  },

  async revokeSession({ userId, sessionId, currentSessionId, currentJti, requestMeta = {} }) {
    const session = await sessionRepository.findActiveByIdForUser(sessionId, userId);
    if (!session) {
      throw new NotFoundError('Session not found or already revoked', 'SESSION_NOT_FOUND');
    }

    await sessionRepository.revokeById(session._id);

    await auditRepository.log({
      actorUserId: userId,
      action: 'auth.session.revoked',
      entityType: 'AuthSession',
      entityId: session._id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      after: {
        revokedSessionId: session._id.toString(),
        currentSessionRevoked: session._id.toString() === currentSessionId,
      },
    });

    return {
      revokedSessionId: session._id.toString(),
      revokedCurrent: session.jti === currentJti,
    };
  },

  async revokeOtherSessions({ userId, currentSessionId, requestMeta = {} }) {
    const result = await sessionRepository.revokeAllForUser(userId, currentSessionId);

    await auditRepository.log({
      actorUserId: userId,
      action: 'auth.session.revoke_others',
      entityType: 'AuthSession',
      entityId: userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      after: { modifiedCount: result.modifiedCount },
    });

    return { revokedCount: result.modifiedCount || 0 };
  },
};

module.exports = sessionService;
