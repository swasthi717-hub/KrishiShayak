importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAmSpv8XBodr9vwgVuNjuxLpK6blDiWTh0",
  authDomain: "krishisahayak-1ee4e.firebaseapp.com",
  projectId: "krishisahayak-1ee4e",
  storageBucket: "krishisahayak-1ee4e.firebasestorage.app",
  messagingSenderId: "243676761420",
  appId: "1:243676761420:web:de79a251b222621d9413e9"
});

const messaging = firebase.messaging();

// Handles notifications when tab is closed or running in background
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "KrishiSahayak Alert";
  const options = {
    body: payload.notification?.body || "New agricultural update available.",
    icon: "/favicon.ico"
  };
  self.registration.showNotification(title, options);
});
