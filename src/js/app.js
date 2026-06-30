import { signInWithGoogle, observeAuthState, signOutUser } from "./modules/auth.js";
import { updateUIForUser, updateUIForSignedOut, toggleDropdown, closeDropdown } from "./modules/ui.js";

const signInBtn = document.getElementById('signInBtn');
const heroSignInBtn = document.getElementById('heroSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const avatarBtn = document.getElementById('avatarBtn');

signInBtn.addEventListener('click', async () => {
    try {
        await signInWithGoogle();
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            alert('Something went wrong. Please try again.');
        }
    }
});

heroSignInBtn.addEventListener('click', () => signInBtn.click());

signOutBtn.addEventListener('click', async () => {
    await signOutUser();
});

avatarBtn.addEventListener('click', toggleDropdown);
document.addEventListener('click', closeDropdown);

observeAuthState((user) => {
    if (user) {
        updateUIForUser(user);
    } else {
        updateUIForSignedOut();
    }
});