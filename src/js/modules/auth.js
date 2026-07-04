// ==================== auth.js ====================
import { auth } from "../config/firebase.js";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  getIdToken,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

let sessionCreated = false;
let sessionChecked = false;

export async function createSession(user) {
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

export function signInWithGoogle() {
  return signInWithRedirect(auth, googleProvider);
}

export function signInWithGithub() {
  return signInWithRedirect(auth, githubProvider);
}

export async function signInWithGoogleOneTap(credentialResponse) {
  try {
    const credential = GoogleAuthProvider.credential(credentialResponse.credential);
    const result = await signInWithCredential(auth, credential);
    await createSession(result.user);
    return result;
  } catch (error) {
    console.error("One Tap error:", error);
    throw error;
  }
}

export async function signInWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await createSession(userCredential.user);
  return userCredential;
}

export async function signUpWithEmail(email, password, displayName = '') {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  await createSession(userCredential.user);
  return userCredential;
}

export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

export function handleRedirectResult() {
  return getRedirectResult(auth).then(async (result) => {
    if (result) {
      await createSession(result.user);
      return result.user;
    }
    return null;
  }).catch((error) => {
    console.error('Redirect result error:', error);
    throw error;
  });
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