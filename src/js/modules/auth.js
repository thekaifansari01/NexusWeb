import { auth } from "../config/firebase.js";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, getIdToken, signInWithCredential } from "firebase/auth";

const provider = new GoogleAuthProvider();
let sessionCreated = false;
let sessionChecked = false;

export function signInWithGoogle() {
    return signInWithPopup(auth, provider).then(async (result) => {
        await createSession(result.user);
        return result;
    });
}

export async function signInWithGoogleOneTap(googleCredentialResponse) {
    try {
        const credential = GoogleAuthProvider.credential(googleCredentialResponse.credential);
        const result = await signInWithCredential(auth, credential);
        await createSession(result.user);
        return result;
    } catch (error) {
        console.error("One Tap Sign-in error:", error);
        throw error;
    }
}

async function createSession(user) {
    const idToken = await getIdToken(user);
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
    });
    if (!response.ok) {
        throw new Error('Failed to create session');
    }
    sessionCreated = true;
}

async function checkSession() {
    try {
        const response = await fetch('/api/auth/me');
        return response.ok;
    } catch {
        return false;
    }
}

export function observeAuthState(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            if (!sessionCreated && !sessionChecked) {
                sessionChecked = true;
                const hasValidSession = await checkSession();
                if (hasValidSession) {
                    sessionCreated = true;
                } else {
                    try {
                        await createSession(user);
                    } catch (e) {
                        console.warn('Session creation failed:', e);
                    }
                }
            }
            callback(user);
        } else {
            sessionCreated = false;
            sessionChecked = false;
            callback(null);
        }
    });
}

export async function signOutUser() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        console.warn('Logout API error:', e);
    }
    sessionCreated = false;
    sessionChecked = false;
    return signOut(auth);
}