import { auth, signOutUser } from "./modules/auth.js";

const loginBtn = document.getElementById('signInBtn');
const avatarContainer = document.getElementById('userArea');
const avatarBtn = document.getElementById('avatarBtn');
const avatarImg = document.getElementById('userAvatar');
const avatarInitials = document.getElementById('avatarInitials');
const dropdownName = document.getElementById('dropdownName');
const dropdownEmail = document.getElementById('userEmail');
const avatarDropdown = document.getElementById('avatarDropdown');
const signOutBtn = document.getElementById('signOutBtn');

const heroSignInBtn = document.getElementById('heroSignInBtn');
const heroDashboardBtn = document.getElementById('heroDashboardBtn');
const footerSignInBtn = document.getElementById('footerSignInBtn');
const footerDashboardBtn = document.getElementById('footerDashboardBtn');

const mobileLoginBtn = document.getElementById('mobileLoginBtn');
const mobileSignOutBtn = document.getElementById('mobileSignOutBtn');
const hamburger = document.getElementById('nx-hamburgerBtn');
const mobileMenu = document.getElementById('nx-mobileMenu');
const navbarPanel = document.getElementById('nx-navbar');

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function updateUI(user) {
    if (user) {
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        const email = user.email || 'user@example.com';

        if (loginBtn) loginBtn.classList.add('hidden');
        if (avatarContainer) avatarContainer.classList.remove('hidden');
        if (dropdownName) dropdownName.textContent = displayName;
        if (dropdownEmail) dropdownEmail.textContent = email;

        if (user.photoURL && avatarImg && avatarInitials) {
            avatarImg.src = user.photoURL;
            avatarImg.classList.remove('hidden');
            avatarInitials.classList.add('hidden');
        } else if (avatarInitials && avatarImg) {
            avatarInitials.textContent = getInitials(displayName);
            avatarInitials.classList.remove('hidden');
            avatarImg.classList.add('hidden');
        }

        if (heroSignInBtn) heroSignInBtn.classList.add('hidden');
        if (heroDashboardBtn) heroDashboardBtn.classList.remove('hidden');
        if (footerSignInBtn) footerSignInBtn.classList.add('hidden');
        if (footerDashboardBtn) footerDashboardBtn.classList.remove('hidden');

        if (mobileLoginBtn) {
            mobileLoginBtn.href = '/dashboard';
            mobileLoginBtn.className = 'nx-btn-primary-mobile';
            mobileLoginBtn.innerHTML = '<i class="ph-bold ph-layout-dashboard"></i> Dashboard';
        }
        if (mobileSignOutBtn) mobileSignOutBtn.classList.remove('hidden');

    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (avatarContainer) avatarContainer.classList.add('hidden');
        if (avatarDropdown) avatarDropdown.classList.remove('open');

        if (heroSignInBtn) heroSignInBtn.classList.remove('hidden');
        if (heroDashboardBtn) heroDashboardBtn.classList.add('hidden');
        if (footerSignInBtn) footerSignInBtn.classList.remove('hidden');
        if (footerDashboardBtn) footerDashboardBtn.classList.add('hidden');

        if (mobileLoginBtn) {
            mobileLoginBtn.href = '/login';
            mobileLoginBtn.className = 'nx-btn-ghost-mobile';
            mobileLoginBtn.innerHTML = '<i class="ph-bold ph-sign-in"></i> Login';
        }
        if (mobileSignOutBtn) mobileSignOutBtn.classList.add('hidden');
    }
}

import { onAuthStateChanged } from "firebase/auth";
onAuthStateChanged(auth, updateUI);

if (avatarBtn && avatarDropdown) {
    avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarDropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!avatarBtn.contains(e.target) && !avatarDropdown.contains(e.target)) {
            avatarDropdown.classList.remove('open');
        }
    });
}

const triggerSignOut = async () => {
    await signOutUser();
    if (avatarDropdown) avatarDropdown.classList.remove('open');
    if (mobileMenu && mobileMenu.classList.contains('open')) {
        toggleMobileMenu(false);
    }
    if (window.google) {
        google.accounts.id.disableAutoSelect();
        google.accounts.id.cancel();
    }
};

if (signOutBtn) signOutBtn.addEventListener('click', triggerSignOut);
if (mobileSignOutBtn) mobileSignOutBtn.addEventListener('click', triggerSignOut);

function toggleMobileMenu(forceState) {
    if (!mobileMenu || !hamburger) return;
    const isOpen = forceState !== undefined ? forceState : !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => toggleMobileMenu());
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMobileMenu(false));
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (mobileMenu && mobileMenu.classList.contains('open')) toggleMobileMenu(false);
        if (avatarDropdown && avatarDropdown.classList.contains('open')) avatarDropdown.classList.remove('open');
    }
});

let scrollToken = false;
if (navbarPanel) {
    window.addEventListener('scroll', () => {
        if (!scrollToken) {
            window.requestAnimationFrame(() => {
                navbarPanel.classList.toggle('scrolled', window.scrollY > 20);
                scrollToken = false;
            });
            scrollToken = true;
        }
    }, { passive: true });
}