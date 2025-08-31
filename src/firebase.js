// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// *** ADD THESE TWO LINES ***
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2OJKMS2N74QQGgVZ746QQx-ZIk0Vau4k",
  authDomain: "vexocore-task-manager.firebaseapp.com",
  projectId: "vexocore-task-manager",
  storageBucket: "vexocore-task-manager.appspot.com", // Corrected this line
  messagingSenderId: "205249255112",
  appId: "1:205249255112:web:98bd0a0bbb6c43e5b737fd",
  measurementId: "G-P8E6S7YRW1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// *** ADD THESE TWO LINES TO INITIALIZE AND EXPORT THE SERVICES ***
export const auth = getAuth(app);
export const db = getFirestore(app);

