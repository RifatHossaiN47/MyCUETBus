// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from "@env";

// Firebase configuration via environment variables (.env)
// Ensure you have these keys in your .env file (see env.example)
const X = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY || X.FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN || X.FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DATABASE_URL || X.FIREBASE_DATABASE_URL,
  projectId: FIREBASE_PROJECT_ID || X.FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET || X.FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    FIREBASE_MESSAGING_SENDER_ID || X.FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID || X.FIREBASE_APP_ID,
};

// Basic validation to help during setup
const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.warn(
    `Missing Firebase env values: ${missing.join(", ")}. Check your .env file.`
  );
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // If already initialized, just get the existing instance
  auth = getAuth(app);
}

const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
