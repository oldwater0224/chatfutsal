// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

 firebaseConfig = {
  apiKey: "AIzaSyDpxVdyQxL_FHCFTvbobezX8rnInITvW1E",
  authDomain: "chatfutsal-a0c1a.firebaseapp.com",
  projectId: "chatfutsal-a0c1a",
  storageBucket: "chatfutsal-a0c1a.firebasestorage.app",
  messagingSenderId: "568847381664",
  appId: "1:568847381664:web:63a554f61a6a0cc48345c5",
  measurementId: "G-L5YZQ0JGHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);