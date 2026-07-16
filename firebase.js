import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB8tlZbDOL9EcoJPoe92xpf306Hg0eyrQ",
  authDomain: "virethos.firebaseapp.com",
  projectId: "virethos",
  storageBucket: "virethos.firebasestorage.app",
  messagingSenderId: "393578524180",
  appId: "1:393578524180:web:eee62ea9314a78524dc101"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);