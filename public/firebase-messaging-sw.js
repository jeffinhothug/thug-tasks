// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDaVSC2sYNvcfSK0dVcAG-JYREZ_ObVlG4",
  authDomain: "thug-tasks-jeffinho.firebaseapp.com",
  projectId: "thug-tasks-jeffinho",
  storageBucket: "thug-tasks-jeffinho.firebasestorage.app",
  messagingSenderId: "571030014512",
  appId: "1:571030014512:web:1319de39fec34cf4253bf5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em background: ', payload);
  
  const notificationTitle = payload.notification.title || 'Novo Alerta Thug Tasks';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
