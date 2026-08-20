import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// DeshiFeed Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoJdee7p1SoW57hQgzSpWEXSsQ1lq3CWo",
  authDomain: "deshifeed-655f9.firebaseapp.com",
  projectId: "deshifeed-655f9",
  storageBucket: "deshifeed-655f9.firebasestorage.app",
  messagingSenderId: "568443213325",
  appId: "1:568443213325:web:cf29a76de480f8914d2744",
  measurementId: "G-81N4XT9G3Q",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;
