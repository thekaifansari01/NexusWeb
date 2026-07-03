import { observeAuthState, signOutUser } from "./modules/auth.js";
import { updateUIForUser, updateUIForSignedOut, toggleDropdown, closeDropdown } from "./modules/ui.js";

const signOutBtn = document.getElementById('signOutBtn');
const avatarBtn = document.getElementById('avatarBtn');

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
    }
});