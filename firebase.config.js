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

// Your web app's Firebase configuration
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
