import { auth } from "../config/firebase.js";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
    return signInWithPopup(auth, provider);
}

export function observeAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}

export function signOutUser() {
    return signOut(auth);
}