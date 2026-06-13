importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD5q89gMuu-pybVKAlW2KGZMgAVzEqVsAU",
  authDomain: "esp8266-d9fd0.firebaseapp.com",
  databaseURL: "https://esp8266-d9fd0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "esp8266-d9fd0",
  storageBucket: "esp8266-d9fd0.firebasestorage.app",
  messagingSenderId: "415048545383",
  appId: "1:415048545383:web:b0025aa7d24ec1668210c2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Alerte ESP8266';
  self.registration.showNotification(title, {
    body: payload.notification?.body || 'Une alerte est active!',
    icon: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: 'esp8266-alert'
  });
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_ALERT') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: 'esp8266-alert'
    });
  }
});
