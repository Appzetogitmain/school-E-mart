const { getMessaging, isFirebaseConfigured } = require('../../config/firebase');
const logger = require('../../common/logger');
const tokenService = require('./token.service');

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

const stringifyData = (data = {}) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value == null ? '' : String(value)])
  );

const buildMessage = ({ token, notification, data }) => ({
  token,
  notification: notification
    ? {
        title: notification.title,
        body: notification.body,
        ...(notification.image ? { imageUrl: notification.image } : {}),
      }
    : undefined,
  data: stringifyData(data),
  webpush: {
    fcmOptions: {
      link: data?.route ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}${data.route}` : undefined,
    },
  },
});

const fcmService = {
  isEnabled() {
    return isFirebaseConfigured();
  },

  async sendToToken(token, { notification, data } = {}) {
    const messaging = getMessaging();
    if (!messaging) {
      logger.debug('FCM skipped — Firebase not configured');
      return { success: false, skipped: true };
    }

    try {
      const messageId = await messaging.send(buildMessage({ token, notification, data }));
      await tokenService.touchToken(token);
      return { success: true, messageId };
    } catch (error) {
      const code = error?.code || error?.errorInfo?.code;
      if (code && INVALID_TOKEN_CODES.has(code)) {
        await tokenService.deactivateToken(token);
      }
      logger.warn('FCM send failed', { code, message: error.message });
      return { success: false, error: error.message, code };
    }
  },

  async sendToTokens(tokens, payload) {
    const uniqueTokens = [...new Set((tokens || []).filter(Boolean))];
    if (!uniqueTokens.length) return { successCount: 0, failureCount: 0, responses: [] };

    const messaging = getMessaging();
    if (!messaging) {
      return { successCount: 0, failureCount: uniqueTokens.length, skipped: true, responses: [] };
    }

    const message = {
      notification: payload.notification
        ? {
            title: payload.notification.title,
            body: payload.notification.body,
            ...(payload.notification.image ? { imageUrl: payload.notification.image } : {}),
          }
        : undefined,
      data: stringifyData(payload.data),
      webpush: {
        fcmOptions: {
          link: payload.data?.route
            ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}${payload.data.route}`
            : undefined,
        },
      },
    };

    const batchResponse = await messaging.sendEachForMulticast({
      tokens: uniqueTokens,
      ...message,
    });

    const invalidTokens = [];
    batchResponse.responses.forEach((response, index) => {
      if (response.success) return;
      const code = response.error?.code;
      if (code && INVALID_TOKEN_CODES.has(code)) {
        invalidTokens.push(uniqueTokens[index]);
      }
    });

    if (invalidTokens.length) {
      await tokenService.deactivateTokens(invalidTokens);
    }

    const successTokens = uniqueTokens.filter((_, i) => batchResponse.responses[i]?.success);
    if (successTokens.length) {
      await tokenService.touchTokens(successTokens);
    }

    return {
      successCount: batchResponse.successCount,
      failureCount: batchResponse.failureCount,
      responses: batchResponse.responses,
    };
  },

  async sendToTopic(topic, payload) {
    const messaging = getMessaging();
    if (!messaging) return { success: false, skipped: true };

    const messageId = await messaging.send({
      topic,
      notification: payload.notification
        ? {
            title: payload.notification.title,
            body: payload.notification.body,
            ...(payload.notification.image ? { imageUrl: payload.notification.image } : {}),
          }
        : undefined,
      data: stringifyData(payload.data),
    });

    return { success: true, messageId };
  },
};

module.exports = fcmService;
