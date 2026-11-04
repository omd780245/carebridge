
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import { getDatabase } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8Kc1igtNnCrYNmNjYn6nXX2tN5MFBvOM",
  authDomain: "carebridge-6b68e.firebaseapp.com",
  databaseURL: "https://carebridge-6b68e-default-rtdb.firebaseio.com",
  projectId: "carebridge-6b68e",
  storageBucket: "carebridge-6b68e.firebasestorage.app",
  messagingSenderId: "284577861179",
  appId: "1:284577861179:web:a2b26b22ce99cadc01d61e",
  measurementId: "G-V9RSN6R7N8"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getDatabase(app);

// Keep users signed in on the same browser/device.
const authPersistence = setPersistence(
  auth,
  browserLocalPersistence
);

export { app, auth, db, authPersistence };
