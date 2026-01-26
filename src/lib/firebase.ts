import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 디버깅용 로그
console.log("=== Firebase 환경변수 체크 ===");
console.log("PROJECT_ID:", firebaseConfig.projectId);
console.log("==============================");

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ 반드시 export 해야 함!
export const auth = getAuth(app);
export const db = getFirestore(app);