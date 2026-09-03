import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "./lib/supabase"; // your existing supabase-js client

const firebaseConfig = {
  apiKey: "AIzaSyAmSpv8XBodr9vwgVuNjuxLpK6blDiWTh0",
  authDomain: "krishisahayak-1ee4e.firebaseapp.com",
  projectId: "krishisahayak-1ee4e",
  storageBucket: "krishisahayak-1ee4e.firebasestorage.app",
  messagingSenderId: "243676761420",
  appId: "1:243676761420:web:de79a251b222621d9413e9",
  measurementId: "G-5R6YZ0N3MZ"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

function detectPlatform() {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "web";
}

export async function requestAndSaveFCMToken(userId) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope'
    });

    const token = await getToken(messaging, {
      vapidKey: "BDK88O5CeKerTOwCr5qHDQNJvxwpBF_HHVRf0UGdvZ5MZOh36NfBs-bvUcFEV5A0zZqE0c4e_2KZCMVnzefEhPE",
      serviceWorkerRegistration: registration
    });

    if (token && userId) {
      const { error } = await supabase
        .from("device_tokens")
        .upsert(
          {
            user_id: userId,
            fcm_token: token,
            platform: detectPlatform(),
            last_seen_at: new Date().toISOString()
          },
          { onConflict: "user_id,fcm_token" }
        );

      if (error) {
        console.error("Error saving device token:", error);
        return;
      }
 
      console.log("FCM token saved to device_tokens successfully");
    }
  } catch (error) {
    console.error("Error securing FCM token:", error);
  }
}

export function listenForForegroundMessages(onNotification) {
  return onMessage(messaging, (payload) => {
    onNotification(
      payload.notification?.title,
      payload.notification?.body
    );
  });
}