// =================================================================
// NEXUS NAVBAR MODULE ENGINE (Isolated Selectors)
// =================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// Firebase App Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCfa1fP3XGvWUVy0LQJvQH0qYp2hOkHzfU",
    authDomain: "trynexus-6db37.firebaseapp.com",
    projectId: "trynexus-6db37",
    storageBucket: "trynexus-6db37.firebasestorage.app",
    messagingSenderId: "754293000577",
    appId: "1:754293000577:web:09677142cdd844b8421ed1",
    measurementId: "G-4LGHBLFG60"
};

// Initialize Firebase Core
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements Extraction (Using Protected Prefixed IDs)
const loginBtn = document.getElementById('nx-loginBtn');
const avatarContainer = document.getElementById('nx-avatarContainer');
const avatarBtn = document.getElementById('nx-avatarBtn');
const avatarImg = document.getElementById('nx-avatarImg');
const avatarInitials = document.getElementById('nx-avatarInitials');
const dropdownName = document.getElementById('nx-dropdownName');
const dropdownEmail = document.getElementById('nx-dropdownEmail');
const avatarDropdown = document.getElementById('nx-avatarDropdown');
const signOutBtn = document.getElementById('nx-signOutBtn');

// Mobile UI Element Targets
const mobileLoginBtn = document.getElementById('nx-mobileLoginBtn');
const mobileSignOutBtn = document.getElementById('nx-mobileSignOutBtn');
const hamburger = document.getElementById('nx-hamburgerBtn');
const mobileMenu = document.getElementById('nx-mobileMenu');
const navbarPanel = document.getElementById('nx-navbar');

// Helper: Process User Name Initials safely
function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

// Main Dynamic State Manager
function updateNavbarAuthUI(user) {
    if (user) {
        // Desktop Authenticated UI Update
        if(loginBtn) loginBtn.classList.add('hidden');
        if(avatarContainer) avatarContainer.classList.remove('hidden');

        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        const email = user.email || 'user@example.com';
        
        if(dropdownName) dropdownName.textContent = displayName;
        if(dropdownEmail) dropdownEmail.textContent = email;

        if (user.photoURL && avatarImg && avatarInitials) {
            avatarImg.src = user.photoURL;
            avatarImg.classList.remove('hidden');
            avatarInitials.classList.add('hidden');
        } else if (avatarInitials && avatarImg) {
            avatarInitials.textContent = getInitials(displayName);
            avatarInitials.classList.remove('hidden');
            avatarImg.classList.add('hidden');
        }

        // Mobile Authenticated UI Upgrade
        if (mobileLoginBtn) {
            mobileLoginBtn.href = '/dashboard';
            mobileLoginBtn.className = 'nx-btn-primary-mobile';
            mobileLoginBtn.innerHTML = '<i class="ph-bold ph-layout-dashboard"></i> Dashboard';
        }
        if (mobileSignOutBtn) mobileSignOutBtn.classList.remove('hidden');

    } else {
        // Guest State Restoration
        if(loginBtn) loginBtn.classList.remove('hidden');
        if(avatarContainer) avatarContainer.classList.add('hidden');

        if (mobileLoginBtn) {
            mobileLoginBtn.href = '/login';
            mobileLoginBtn.className = 'nx-btn-ghost-mobile';
            mobileLoginBtn.innerHTML = '<i class="ph-bold ph-sign-in"></i> Login';
        }
        if (mobileSignOutBtn) mobileSignOutBtn.classList.add('hidden');
    }
}

// Listen to Global Auth Changes
onAuthStateChanged(auth, updateNavbarAuthUI);

// UI Event: Toggle Avatar Dropdown panel safely
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

// Logic: Core Authentication Log Out Sequence
const triggerSignOutSequence = async () => {
    try {
        await signOut(auth);
        if(avatarDropdown) avatarDropdown.classList.remove('open');
        if (mobileMenu && mobileMenu.classList.contains('open')) {
            executeMobileMenuState(false);
        }
    } catch (err) {
        console.error('Sign out failed:', err);
    }
};

if (signOutBtn) signOutBtn.addEventListener('click', triggerSignOutSequence);
if (mobileSignOutBtn) mobileSignOutBtn.addEventListener('click', triggerSignOutSequence);

// UI Event: Toggle Mobile Overlay States
function executeMobileMenuState(forceState) {
    if(!mobileMenu || !hamburger) return;
    const isNowOpen = forceState !== undefined ? forceState : !mobileMenu.classList.contains('open');
    
    mobileMenu.classList.toggle('open', isNowOpen);
    hamburger.classList.toggle('open', isNowOpen);
    hamburger.setAttribute('aria-expanded', isNowOpen);
    document.body.style.overflow = isNowOpen ? 'hidden' : '';
}

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => executeMobileMenuState());
    
    // Auto-Dismiss overlay menu panels upon hyperlink activation
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => executeMobileMenuState(false));
    });
}

// Accessibility Integration: Escape Key monitors
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (mobileMenu && mobileMenu.classList.contains('open')) executeMobileMenuState(false);
        if (avatarDropdown && avatarDropdown.classList.contains('open')) avatarDropdown.classList.remove('open');
    }
});

// Performance Engineering: High Frequency Throttled Scroll Engine
let scrollToken = false;
if(navbarPanel) {
    window.addEventListener('scroll', () => {
        if (!scrollToken) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 20) {
                    navbarPanel.classList.add('scrolled');
                } else {
                    navbarPanel.classList.remove('scrolled');
                }
                scrollToken = false;
            });
            scrollToken = true;
        }
    }, { passive: true });
}