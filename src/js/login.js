// ==================== login.js ====================
import {
    signInWithEmail, signUpWithEmail, sendPasswordReset,
    signInWithGoogle, signInWithGithub,
    signInWithGoogleOneTap, observeAuthState, checkRedirectAuth
} from "./modules/auth.js";
import { showToast } from "./modules/ui.js";

const signInTab = document.getElementById('signInTab');
const signUpTab = document.getElementById('signUpTab');
const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const signInEmail = document.getElementById('signInEmail');
const signInPassword = document.getElementById('signInPassword');
const signUpName = document.getElementById('signUpName');
const signUpEmail = document.getElementById('signUpEmail');
const signUpPassword = document.getElementById('signUpPassword');
const signUpConfirm = document.getElementById('signUpConfirm');
const signInBtn = document.getElementById('signInBtn');
const signUpBtn = document.getElementById('signUpBtn');
const forgotLink = document.getElementById('forgotLink');
const errorMsg = document.getElementById('errorMsg');
const googleBtn = document.getElementById('googleBtn');
const githubBtn = document.getElementById('githubBtn');

let currentTab = 'signin';
let captchaToken = null;
let turnstileWidgetId = null;
let turnstileRetryTimeout = null;

// ----- 1. Page Load Redirect Check -----
// Jab user Google/GitHub se login karke wapas aaye, toh yahan check hoga
async function handleRedirectResult() {
    const originalGoogle = googleBtn.innerHTML;
    const originalGithub = githubBtn.innerHTML;
    
    try {
        // Buttons ko disabled aur loading state mein daal do jab tak check ho raha hai
        googleBtn.disabled = true;
        githubBtn.disabled = true;
        googleBtn.innerHTML = `<i class="ph-bold ph-circle-notch animate-spin"></i> Wait...`;
        githubBtn.innerHTML = `<i class="ph-bold ph-circle-notch animate-spin"></i> Wait...`;

        const result = await checkRedirectAuth();
        if (result) {
            // Login successful, ab redirect kardo
            window.location.href = '/dashboard';
            return;
        }
    } catch (err) {
        let msg = 'Social login failed. Please try again.';
        if (err.code === 'auth/account-exists-with-different-credential') {
            msg = 'An account with this email already exists using a different sign-in method.';
        } else if (err.code === 'auth/network-request-failed') {
            msg = 'Network error. Check your connection.';
        }
        showError(msg);
    } finally {
        // State wapas normal kar do agar redirect se nahi aaya hai
        googleBtn.disabled = false;
        githubBtn.disabled = false;
        googleBtn.innerHTML = originalGoogle;
        githubBtn.innerHTML = originalGithub;
    }
}

// Call it immediately on script execution
handleRedirectResult();

// ----- 2. Tab Switching Logic -----
function switchTab(tab) {
    currentTab = tab;
    if (tab === 'signin') {
        signInTab.classList.add('active');
        signUpTab.classList.remove('active');
        signInForm.classList.remove('hidden');
        signUpForm.classList.add('hidden');
        errorMsg.classList.add('hidden');
        resetTurnstile();
        renderTurnstile('turnstile-container');
    } else {
        signUpTab.classList.add('active');
        signInTab.classList.remove('active');
        signUpForm.classList.remove('hidden');
        signInForm.classList.add('hidden');
        errorMsg.classList.add('hidden');
        resetTurnstile();
        renderTurnstile('turnstile-container-signup');
    }
}

signInTab.addEventListener('click', () => switchTab('signin'));
signUpTab.addEventListener('click', () => switchTab('signup'));

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
}

function hideError() {
    errorMsg.classList.add('hidden');
}

function getSubmitButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    const form = container.closest('.auth-form');
    if (!form) return null;
    return form.querySelector('.submit-btn');
}

// ----- 3. Turnstile (CAPTCHA) Logic -----
function renderTurnstile(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.turnstile) return;
    if (turnstileWidgetId !== null && turnstileWidgetId !== undefined) {
        try { turnstile.remove(turnstileWidgetId); } catch (_) {}
        turnstileWidgetId = null;
    }
    container.innerHTML = '';
    container.classList.remove('solved');
    const submitBtn = getSubmitButton(containerId);
    if (submitBtn) {
        submitBtn.classList.remove('visible');
        submitBtn.disabled = true;
    }
    try {
        turnstileWidgetId = turnstile.render(container, {
            sitekey: '0x4AAAAAADttl-ZBYJPZI8zP',
            callback: function(token) {
                captchaToken = token;
                container.classList.add('solved');
                const btn = getSubmitButton(containerId);
                if (btn) {
                    btn.classList.add('visible');
                    btn.disabled = false;
                }
            },
            'expired-callback': function() {
                captchaToken = null;
                container.classList.remove('solved');
                const btn = getSubmitButton(containerId);
                if (btn) {
                    btn.classList.remove('visible');
                    btn.disabled = true;
                }
            },
            'error-callback': function() {
                captchaToken = null;
                container.classList.remove('solved');
                const btn = getSubmitButton(containerId);
                if (btn) {
                    btn.classList.remove('visible');
                    btn.disabled = true;
                }
                if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
                turnstileRetryTimeout = setTimeout(() => renderTurnstile(containerId), 2000);
            }
        });
    } catch (e) {
        if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
        turnstileRetryTimeout = setTimeout(() => renderTurnstile(containerId), 2000);
    }
}

function resetTurnstile() {
    try {
        if (turnstileWidgetId !== null && turnstileWidgetId !== undefined && window.turnstile) {
            turnstile.remove(turnstileWidgetId);
            turnstileWidgetId = null;
        }
    } catch (e) {}
    captchaToken = null;
    if (turnstileRetryTimeout) {
        clearTimeout(turnstileRetryTimeout);
        turnstileRetryTimeout = null;
    }
}

async function verifyCaptcha(token) {
    const res = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.error || 'CAPTCHA verification failed');
    }
    return true;
}

// ----- 4. Email/Password Auth Logic -----
async function handleEmailSignIn(e) {
    e.preventDefault();
    hideError();
    const email = signInEmail.value.trim();
    const password = signInPassword.value.trim();
    if (!email || !password) {
        showError('Please fill in all fields.');
        return;
    }
    if (!captchaToken) {
        showError('Please complete the CAPTCHA.');
        return;
    }
    signInBtn.disabled = true;
    signInBtn.classList.add('loading');
    signInBtn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Verifying...';
    try {
        await verifyCaptcha(captchaToken);
        signInBtn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Signing in...';
        await signInWithEmail(email, password);
        window.location.href = '/dashboard';
    } catch (err) {
        signInBtn.disabled = false;
        signInBtn.classList.remove('loading');
        signInBtn.innerHTML = '<i class="ph-bold ph-sign-in"></i> Sign In';
        let msg = 'Sign in failed. Please try again.';
        if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
        else if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
        else if (err.code === 'auth/too-many-requests') msg = 'Too many failed attempts. Try again later.';
        else if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
        else if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
        else if (err.message) msg = err.message;
        showError(msg);
        resetTurnstile();
        renderTurnstile('turnstile-container');
    }
}

async function handleEmailSignUp(e) {
    e.preventDefault();
    hideError();
    const name = signUpName.value.trim();
    const email = signUpEmail.value.trim();
    const password = signUpPassword.value.trim();
    const confirm = signUpConfirm.value.trim();
    if (!email || !password || !confirm) {
        showError('Please fill in all fields.');
        return;
    }
    if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
    }
    if (password !== confirm) {
        showError('Passwords do not match.');
        return;
    }
    if (!captchaToken) {
        showError('Please complete the CAPTCHA.');
        return;
    }
    signUpBtn.disabled = true;
    signUpBtn.classList.add('loading');
    signUpBtn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Verifying...';
    try {
        await verifyCaptcha(captchaToken);
        signUpBtn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Creating account...';
        await signUpWithEmail(email, password, name);
        window.location.href = '/dashboard';
    } catch (err) {
        signUpBtn.disabled = false;
        signUpBtn.classList.remove('loading');
        signUpBtn.innerHTML = '<i class="ph-bold ph-user-plus"></i> Create Account';
        let msg = 'Sign up failed. Please try again.';
        if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered. Please sign in.';
        else if (err.code === 'auth/weak-password') msg = 'Password is too weak. Use at least 6 characters.';
        else if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
        else if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
        else if (err.message) msg = err.message;
        showError(msg);
        resetTurnstile();
        renderTurnstile('turnstile-container-signup');
    }
}

signInBtn.addEventListener('click', handleEmailSignIn);
signUpBtn.addEventListener('click', handleEmailSignUp);

// ----- 5. Forgot Password Logic -----
forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    hideError();
    const email = signInEmail.value.trim();
    if (!email) {
        showError('Please enter your email address first.');
        return;
    }
    try {
        await sendPasswordReset(email);
        showToast('Password reset email sent! Check your inbox.', 4000, 'success');
    } catch (err) {
        let msg = 'Failed to send reset email.';
        if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
        else if (err.message) msg = err.message;
        showError(msg);
    }
});

// ----- 6. Social Login (Redirect) Logic -----
async function executeSocialLogin(providerFn, buttonElement, label) {
    hideError();
    const originalHtml = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = `<i class="ph-bold ph-circle-notch animate-spin"></i> Redirecting...`;
    
    try {
        // Ye browser ko directly Google/Github par bhej dega
        await providerFn(); 
    } catch (err) {
        // Sirf tab run hoga agar redirect initialize karne mein koi error aaya
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalHtml;
        let msg = `${label} sign-in failed. Please try again.`;
        if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
        else if (err.message) msg = err.message;
        showError(msg);
    }
}

googleBtn.addEventListener('click', () => executeSocialLogin(signInWithGoogle, googleBtn, 'Google'));
githubBtn.addEventListener('click', () => executeSocialLogin(signInWithGithub, githubBtn, 'GitHub'));

// ----- 7. General Auth State Observer -----
observeAuthState((user) => {
    if (user) {
        window.location.href = '/dashboard';
    } else {
        renderTurnstile('turnstile-container');
    }
});

// ----- 8. Google One-Tap Callback -----
window.handleOneTap = async (response) => {
    try {
        await signInWithGoogleOneTap(response);
        window.location.href = '/dashboard';
    } catch (err) {
        console.warn('One-Tap failed, user can use regular buttons.');
    }
};

// ----- 9. Enter Key Support -----
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (currentTab === 'signin') {
            if (!signInBtn.disabled) signInBtn.click();
        } else {
            if (!signUpBtn.disabled) signUpBtn.click();
        }
    }
});