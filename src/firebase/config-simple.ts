// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHhTiinFGHLRZeEOXPeso008VX7I66Z9U",
  authDomain: "topcheffantasy-f5cfe.firebaseapp.com",
  projectId: "topcheffantasy-f5cfe",
  storageBucket: "topcheffantasy-f5cfe.firebasestorage.app",
  messagingSenderId: "526737512291",
  appId: "1:526737512291:web:8bf58f39545806fe08e556",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; 