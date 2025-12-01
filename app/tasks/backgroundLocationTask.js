import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, set, getDatabase } from "firebase/database";
import { initializeApp, getApps, getApp } from "firebase/app";

export const BACKGROUND_TASK_NAME = "MYCUETBUS_BG_LOCATION";

const sanitizeKey = (name) => (name ?? "").replace(/[.#$/\[\]]/g, "_");

// Firebase config - must be re-initialized in background context
const firebaseConfig = {
  apiKey: "AIzaSyB2AXpqei62-QbMKcBjtN_EZBOiuwKbAj0",
  authDomain: "mycuetbus.firebaseapp.com",
  databaseURL:
    "https://mycuetbus-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mycuetbus",
  storageBucket: "mycuetbus.firebasestorage.app",
  messagingSenderId: "431639775523",
  appId: "1:431639775523:web:4a25dd14ba6a08f048e496",
};

// Ensure Firebase is initialized in background task context
const getFirebaseDatabase = () => {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return getDatabase(app);
  } catch (error) {
    console.error("Firebase init error in background:", error);
    return null;
  }
};

let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

TaskManager.defineTask(BACKGROUND_TASK_NAME, async ({ data, error }) => {
  console.log(
    "🔄 Background task triggered at:",
    new Date().toLocaleTimeString()
  );

  if (error) {
    console.error("❌ BG task error:", error);
    consecutiveErrors++;
    return;
  }

  const { locations } = data || {};
  if (!locations?.length) {
    console.warn("⚠️ No locations in data");
    return;
  }

  // Retry mechanism with exponential backoff
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount <= maxRetries) {
    try {
      const busName = await AsyncStorage.getItem("BUS_NAME");
      console.log("📦 Bus name from storage:", busName);

      if (!busName) {
        console.warn("⚠️ No bus name found in storage");
        return;
      }

      const database = getFirebaseDatabase();
      if (!database) {
        console.error("❌ Failed to initialize Firebase in background");
        return;
      }

      const key = sanitizeKey(busName);
      const loc = locations[0];

      // Validate coordinates
      if (!loc?.coords?.latitude || !loc?.coords?.longitude) {
        console.error("❌ Invalid location data");
        return;
      }

      if (
        Math.abs(loc.coords.latitude) > 90 ||
        Math.abs(loc.coords.longitude) > 180
      ) {
        console.error("❌ Invalid coordinates:", loc.coords);
        return;
      }

      console.log(
        `📍 Sending location: lat=${loc.coords.latitude.toFixed(
          6
        )}, lng=${loc.coords.longitude.toFixed(6)}`
      );

      const locationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy || 0,
        speed: loc.coords.speed || 0,
        heading: loc.coords.heading || 0,
        timestamp: Date.now(),
        deviceType: "student_share",
        sharedBy: "Background",
      };

      // Set with timeout
      await Promise.race([
        set(ref(database, `buses/${key}`), locationData),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Firebase write timeout")), 10000)
        ),
      ]);

      console.log(
        `✅ BG location updated for ${busName} at ${new Date().toLocaleTimeString()}`
      );
      consecutiveErrors = 0; // Reset on success
      return; // Success, exit retry loop
    } catch (e) {
      retryCount++;
      consecutiveErrors++;
      console.error(
        `❌ BG write failed (attempt ${retryCount}/${maxRetries + 1}):`,
        e.message || e
      );

      if (retryCount <= maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount - 1) * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("❌ Max retries reached. Giving up.");
      }

      // If too many consecutive errors, log warning
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(
          `⚠️ WARNING: ${consecutiveErrors} consecutive errors. Check network/Firebase.`
        );
      }
    }
  }
});

// Log that task is registered
console.log(`✓ Background task '${BACKGROUND_TASK_NAME}' registered`);

// Dummy default export to satisfy expo-router (this file is imported for side effects)
export default function BackgroundLocationTask() {
  return null;
}
