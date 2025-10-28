// src/firebase.ts

import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDxnxe2FLUc7SNlJA78YQm5kmlLLCYTN5Q",
  authDomain: "wawancara-asn-ai.firebaseapp.com",
  projectId: "wawancara-asn-ai",
  storageBucket: "wawancara-asn-ai.firebasestorage.app",
  messagingSenderId: "278462923099",
  appId: "1:278462923099:web:07925146495cb9592eda7e",
  measurementId: "G-RHTBTHXY0B"
};

// Prevent double initialization in Next.js
export const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];
