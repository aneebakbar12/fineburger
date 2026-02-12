// Firebase Configuration
// Replace these values with your actual Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > SDK setup and configuration

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
   apiKey: "AIzaSyA5PAdRbFyVFkQqcqg2Z18R9i84jISIMUQ",
  authDomain: "fineburger-b1d65.firebaseapp.com",
  projectId: "fineburger-b1d65",
  storageBucket: "fineburger-b1d65.firebasestorage.app",
  messagingSenderId: "835843894036",
  appId: "1:835843894036:web:2807cd0178ad0ea53e7001",
  measurementId: "G-VRBTEWBJE2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
