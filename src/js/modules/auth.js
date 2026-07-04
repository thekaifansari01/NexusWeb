import { auth } from "../config/firebase.js";
import { 
  signInWithRedirect, getRedirectResult, 
  GoogleAuthProvider, GithubAuthProvider, 
  onAuthStateChanged, signOut, getIdToken, 
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

// ----- Helper: Create session cookie -----
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

// ----- Redirect Result Handler -----
// Is function ko login.js mein check karenge jab user wapas redirect hoga
export async function checkRedirectAuth() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      await createSession(result.user);
      return result;
    }
    return null;
  } catch (error) {
    console.error("Redirect auth error:", error);
    throw error;
  }
}

// ----- Google Sign-In (Redirect) -----
export function signInWithGoogle() {
  return signInWithRedirect(auth, googleProvider);
}

// ----- Google One-Tap -----
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

// ----- GitHub Sign-In (Redirect) -----
export function signInWithGithub() {
  return signInWithRedirect(auth, githubProvider);
}

// ----- Email/Password Sign-In -----
export async function signInWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await createSession(userCredential.user);
  return userCredential;
}

// ----- Email/Password Sign-Up -----
export async function signUpWithEmail(email, password, displayName = '') {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // Update profile with display name (optional)
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  await createSession(userCredential.user);
  return userCredential;
}

// ----- Forgot Password -----
export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

// ----- Auth state observer -----
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

// ----- Sign Out -----
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