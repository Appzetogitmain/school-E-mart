/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCZsHCgnRJIcOVzMvCsVeT0vq_Pmgx1_EU',
  authDomain: 'school-e-mart.firebaseapp.com',
  projectId: 'school-e-mart',
  storageBucket: 'school-e-mart.firebasestorage.app',
  messagingSenderId: '245704085725',
  appId: '1:245704085725:web:3070c7ea6fd65aa1238b34',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'School E-Mart';
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/assets/school_logo.webp',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.route || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'FCM_NOTIFICATION_CLICK', route });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        const base = self.location.origin;
        return clients.openWindow(`${base}${route}`);
      }
    })
  );
});
