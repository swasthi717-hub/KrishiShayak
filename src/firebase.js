import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "../lib/supabase"; // your existing supabase-js client

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

export async function requestAndSaveFCMToken(userId) {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BDK88O5CeKerTOwCr5qHDQNJvxwpBF_HHVRf0UGdvZ5MZOh36NfBs-bvUcFEV5A0zZqE0c4e_2KZCMVnzefEhPE"
      });

      if (token && userId) {
        // Save to Supabase DB profiles table
        await supabase
          .from("profiles")
          .update({ fcm_token: token })
          .eq("id", userId);

        console.log("FCM Token saved successfully:", token);
      }
    }
  } catch (error) {
    console.error("Error securing FCM token:", error);
  }
}
