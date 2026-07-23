/**
 * Authentication Module
 * Google Sign-In with Firebase Auth (redirect flow for production reliability).
 */
import { auth } from './firebase.js';
import {
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const provider = new GoogleAuthProvider();

/**
 * Kick off Google sign-in via a full-page redirect.
 * The page will return to itself after auth; call handleRedirectResult() on load.
 */
export async function signInWithGoogle() {
    try {
        await signInWithRedirect(auth, provider);
    } catch (err) {
        console.error('[Auth] Sign-in redirect failed:', err);
        throw err;
    }
}

/**
 * Call once on page load to capture the result of a redirect sign-in.
 * Returns the user if returning from Google, null otherwise.
 */
export async function handleRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        return result ? result.user : null;
    } catch (err) {
        console.error('[Auth] Redirect result error:', err);
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

