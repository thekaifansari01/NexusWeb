import { auth } from "../config/firebase.js";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, getIdToken } from "firebase/auth";

const provider = new GoogleAuthProvider();
let sessionCreated = false;

export function signInWithGoogle() {
    return signInWithPopup(auth, provider).then(async (result) => {
        await createSession(result.user);
        return result;
    });
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

export function observeAuthState(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user && !sessionCreated) {
            try {
                await createSession(user);
            } catch (e) {
                console.warn('Session creation failed:', e);
            }
        }
        callback(user);
    });
}

export async function signOutUser() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        console.warn('Logout API error:', e);
    }
    sessionCreated = false;
    return signOut(auth);
}