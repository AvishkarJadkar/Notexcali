/**
 * Firebase Configuration & Initialization
 * Central module — exports auth and firestore instances.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyC9sD7P40zi0PCp4AtE0dAS8gvgjhuOHz0",
    authDomain: "notexcali.firebaseapp.com",
    projectId: "notexcali",
    storageBucket: "notexcali.firebasestorage.app",
    messagingSenderId: "166506299843",
    appId: "1:166506299843:web:f45f3507496b23edaf3d76",
    measurementId: "G-KE8L49C3PL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

console.log('🔥 Firebase initialized');
