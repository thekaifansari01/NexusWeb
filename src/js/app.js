import { signInWithGoogle, signInWithGoogleOneTap, observeAuthState, signOutUser } from "./modules/auth.js";
import { updateUIForUser, updateUIForSignedOut, toggleDropdown, closeDropdown } from "./modules/ui.js";

const GOOGLE_CLIENT_ID = "69132729895-2fs9qcptsf53d8k4p124f0j0qjk7b8fn.apps.googleusercontent.com"; 

const signInBtn = document.getElementById('signInBtn');
const heroSignInBtn = document.getElementById('heroSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const avatarBtn = document.getElementById('avatarBtn');

async function handleOneTapResponse(response) {
    try {
        await signInWithGoogleOneTap(response);
    } catch (error) {
        console.error(error);
        alert('One Tap login failed. Please try the regular sign-in button.');
    }
}

signInBtn.addEventListener('click', async () => {
    try {
        await signInWithGoogle();
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            alert('Something went wrong. Please try again.');
        }
    }
});

if (heroSignInBtn) {
    heroSignInBtn.addEventListener('click', () => signInBtn.click());
}

signOutBtn.addEventListener('click', async () => {
    await signOutUser();
    if (window.google) {
        google.accounts.id.disableAutoSelect();
    }
});

avatarBtn.addEventListener('click', toggleDropdown);
document.addEventListener('click', closeDropdown);

observeAuthState((user) => {
    if (user) {
        updateUIForUser(user);
        if (window.google) {
            google.accounts.id.cancel();
        }
    } else {
        updateUIForSignedOut();
        if (window.google) {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleOneTapResponse,
                auto_select: false, 
                cancel_on_tap_outside: false
            });
            google.accounts.id.prompt();
        }
    }
});