import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging, checkMessagingSupport } from '../config/firebase';
import { ENV } from '../config/env';
import * as notificationApi from '../services/notificationApi';
import useAuthStore from '../store/useAuthStore';
import {
  getOrCreateDeviceId,
  getRegisteredToken,
  setRegisteredToken,
  isNotificationSupported,
  getNotificationPermission,
} from '../utils/fcmStorage';

const showForegroundNotification = (payload, onClick) => {
  const title = payload?.notification?.title || payload?.data?.title || 'Notification';
  const body = payload?.notification?.body || payload?.data?.body || '';
  const route = payload?.data?.route;

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/assets/school_logo.webp',
      data: { route },
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (route && onClick) onClick(route);
    };
  }
};

export const useFcm = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token: authToken } = useAuthStore();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(getNotificationPermission());
  const initRef = useRef(false);

  const navigateToRoute = useCallback(
    (route) => {
      if (route) navigate(route);
    },
    [navigate]
  );

  const registerTokenWithBackend = useCallback(
    async (fcmToken) => {
      const deviceId = getOrCreateDeviceId();
      const previous = getRegisteredToken();

      if (previous === fcmToken) return;

      await notificationApi.registerFcmToken({
        token: fcmToken,
        platform: 'web',
        deviceId,
      });
      setRegisteredToken(fcmToken);
    },
    []
  );

  const requestPermissionAndRegister = useCallback(async () => {
    if (!isAuthenticated || !authToken) return;
    if (!isNotificationSupported()) {
      setStatus('unsupported');
      return;
    }

    const supported = await checkMessagingSupport();
    if (!supported) {
      setStatus('unsupported');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      let currentPermission = Notification.permission;
      if (currentPermission === 'default') {
        currentPermission = await Notification.requestPermission();
      }
      setPermission(currentPermission);

      if (currentPermission === 'denied') {
        setStatus('denied');
        return;
      }

      if (currentPermission !== 'granted') {
        setStatus('idle');
        return;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;

      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        setStatus('unsupported');
        return;
      }

      const fcmToken = await getToken(messaging, {
        vapidKey: ENV.FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!fcmToken) {
        setStatus('error');
        setError('Failed to obtain FCM token');
        return;
      }

      await registerTokenWithBackend(fcmToken);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'FCM registration failed');
    }
  }, [isAuthenticated, authToken, registerTokenWithBackend]);

  const unregister = useCallback(async () => {
    const deviceId = getOrCreateDeviceId();
    const registered = getRegisteredToken();
    try {
      if (registered) {
        await notificationApi.unregisterFcmToken({ token: registered, deviceId });
      }
    } catch {
      // Best-effort cleanup
    } finally {
      setRegisteredToken(null);
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      initRef.current = false;
      return;
    }

    if (initRef.current) return;
    initRef.current = true;
    requestPermissionAndRegister();
  }, [isAuthenticated, requestPermissionAndRegister]);

  useEffect(() => {
    let unsubscribe = () => {};

    const setupForegroundListener = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        showForegroundNotification(payload, navigateToRoute);
      });
    };

    if (isAuthenticated && permission === 'granted') {
      setupForegroundListener();
    }

    return () => unsubscribe();
  }, [isAuthenticated, permission, navigateToRoute]);

  useEffect(() => {
    const handleSwMessage = (event) => {
      if (event.data?.type === 'FCM_NOTIFICATION_CLICK' && event.data?.route) {
        navigateToRoute(event.data.route);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleSwMessage);
  }, [navigateToRoute]);

  return {
    status,
    error,
    permission,
    requestPermissionAndRegister,
    unregister,
  };
};
