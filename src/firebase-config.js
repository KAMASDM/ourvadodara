// =============================================
// src/firebase-config.js
// Real Firebase configuration for Our Vadodara News
// =============================================

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
// Configuration loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Validate required Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.databaseURL) {
  console.error("CRITICAL ERROR: Firebase environment variables are not set.");
  alert("Firebase configuration is missing. The app cannot start. Please check your .env file.");
  throw new Error("Firebase configuration is missing.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const firebaseAuth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Initialize messaging for push notifications
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  // Messaging not available in this environment
}

export const fcmMessaging = messaging;

// Configure auth providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Export Firebase Auth functions
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  PhoneAuthProvider,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";

// Export Firebase Database functions
export { 
  ref, 
  update, 
  remove, 
  push, 
  set, 
  get, 
  onValue, 
  off,
  serverTimestamp,
  increment
} from "firebase/database";

// Export Firebase Storage functions
export {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

// Export Firebase Messaging functions
export {
  getToken,
  onMessage
} from "firebase/messaging";

// Default export
export default app;