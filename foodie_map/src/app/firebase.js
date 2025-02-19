// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config (from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyAqNd1wjqGmt-l9i40M0mJzo_fXKraT6SU",
    authDomain: "foodiemap-62a98.firebaseapp.com",
    projectId: "foodiemap-62a98",
    storageBucket: "foodiemap-62a98.firebasestorage.app",
    messagingSenderId: "231855255141",
    appId: "1:231855255141:web:91475ff8b67871a000e08c",
    measurementId: "G-ZW8Q0KCE7T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
