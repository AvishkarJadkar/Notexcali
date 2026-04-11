/**
 * Authentication Module
 * Google Sign-In with Firebase Auth.
 */
import { auth } from './firebase.js';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (err) {
        console.error('[Auth] Sign-in failed:', err);
        throw err;
    }
}

export async function signOut() {
    try {
        await firebaseSignOut(auth);
    } catch (err) {
        console.error('[Auth] Sign-out failed:', err);
    }
}

export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
    return auth.currentUser;
}
