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
const pageLoader = document.getElementById('pageLoader');
const typewriterText = document.getElementById('typewriter-text');
const signInEmailError = document.getElementById('signInEmailError');
const signInPasswordError = document.getElementById('signInPasswordError');
const signUpNameError = document.getElementById('signUpNameError');
const signUpEmailError = document.getElementById('signUpEmailError');
const signUpPasswordError = document.getElementById('signUpPasswordError');
const signUpConfirmError = document.getElementById('signUpConfirmError');
const strengthSeg1 = document.getElementById('strSeg1');
const strengthSeg2 = document.getElementById('strSeg2');
const strengthSeg3 = document.getElementById('strSeg3');
const strengthText = document.getElementById('strengthText');
const passwordStrength = document.getElementById('passwordStrength');

let currentTab = 'signin';
let captchaToken = null;
let turnstileWidgetId = null;
let turnstileRetryTimeout = null;
let turnstileAttempts = 0;
const MAX_TURNSTILE_RETRIES = 3;
let typewriterInterval = null;
let typewriterIndex = 0;
let isTypewriterDone = false;

function showPageLoader() {
    if (pageLoader) pageLoader.classList.remove('hidden');
}

function hidePageLoader() {
    if (pageLoader) pageLoader.classList.add('hidden');
}

function startTypewriter() {
    const text = 'AI that understands your content.';
    if (!typewriterText) return;
    typewriterText.textContent = '';
    typewriterIndex = 0;
    isTypewriterDone = false;
    if (typewriterInterval) clearInterval(typewriterInterval);
    typewriterInterval = setInterval(() => {
        if (typewriterIndex < text.length) {
            typewriterText.textContent += text.charAt(typewriterIndex);
            typewriterIndex++;
        } else {
            isTypewriterDone = true;
            clearInterval(typewriterInterval);
            typewriterInterval = null;
        }
    }, 35);
}

function autoFocusField() {
    setTimeout(() => {
        if (currentTab === 'signin') {
            if (signInEmail) signInEmail.focus();
        } else {
            if (signUpName) signUpName.focus();
        }
    }, 200);
}

function showFieldError(errorEl, message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    errorEl.classList.add('visible');
    const input = errorEl.closest('.form-group')?.querySelector('.form-input');
    if (input) input.classList.add('error');
}

function hideFieldError(errorEl) {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
    errorEl.classList.remove('visible');
    const input = errorEl.closest('.form-group')?.querySelector('.form-input');
    if (input) input.classList.remove('error');
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateField(input) {
    const id = input.id;
    let errorEl = null;
    let isValid = true;
    let message = '';

    if (id === 'signInEmail' || id === 'signUpEmail') {
        errorEl = id === 'signInEmail' ? signInEmailError : signUpEmailError;
        const val = input.value.trim();
        if (!val) {
            isValid = false;
            message = 'Email is required';
        } else if (!validateEmail(val)) {
            isValid = false;
            message = 'Please enter a valid email';
        }
        if (isValid) hideFieldError(errorEl);
        else showFieldError(errorEl, message);
    }

    if (id === 'signInPassword') {
        errorEl = signInPasswordError;
        const val = input.value;
        if (!val) {
            isValid = false;
            message = 'Password is required';
        }
        if (isValid) hideFieldError(errorEl);
        else showFieldError(errorEl, message);
    }

    if (id === 'signUpName') {
        errorEl = signUpNameError;
        const val = input.value.trim();
        if (!val) {
            isValid = false;
            message = 'Name is required';
        }
        if (isValid) hideFieldError(errorEl);
        else showFieldError(errorEl, message);
    }

    if (id === 'signUpPassword') {
        errorEl = signUpPasswordError;
        const val = input.value;
        if (!val) {
            isValid = false;
            message = 'Password is required';
        } else if (val.length < 6) {
            isValid = false;
            message = 'Minimum 6 characters';
        }
        if (isValid) hideFieldError(errorEl);
        else showFieldError(errorEl, message);
        updatePasswordStrength(val);
    }

    if (id === 'signUpConfirm') {
        errorEl = signUpConfirmError;
        const password = signUpPassword?.value || '';
        const val = input.value;
        if (!val) {
            isValid = false;
            message = 'Please confirm your password';
        } else if (val !== password) {
            isValid = false;
            message = 'Passwords do not match';
        }
        if (isValid) hideFieldError(errorEl);
        else showFieldError(errorEl, message);
    }

    return isValid;
}

function updatePasswordStrength(password) {
    if (!passwordStrength) return;
    if (!password || password.length === 0) {
        passwordStrength.classList.remove('visible');
        return;
    }
    passwordStrength.classList.add('visible');
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    let level = 'weak';
    let label = 'Weak';
    let color = 'weak';
    if (score >= 5) { level = 'strong'; label = 'Strong'; color = 'strong'; }
    else if (score >= 3) { level = 'medium'; label = 'Medium'; color = 'medium'; }
    else { level = 'weak'; label = 'Weak'; color = 'weak'; }
    const segs = [strengthSeg1, strengthSeg2, strengthSeg3];
    segs.forEach((seg, i) => {
        if (!seg) return;
        seg.className = 'segment';
        if (level === 'strong' || (level === 'medium' && i < 2) || (level === 'weak' && i < 1)) {
            seg.classList.add(color);
        }
    });
    if (strengthText) {
        strengthText.textContent = label;
        strengthText.className = 'strength-text ' + color;
    }
}

async function handleRedirectResult() {
    const originalGoogle = googleBtn.innerHTML;
    const originalGithub = githubBtn.innerHTML;
    showPageLoader();
    try {
        googleBtn.disabled = true;
        githubBtn.disabled = true;
        googleBtn.innerHTML = `<i class="ph-bold ph-circle-notch animate-spin"></i> Wait...`;
        githubBtn.innerHTML = `<i class="ph-bold ph-circle-notch animate-spin"></i> Wait...`;
        const result = await checkRedirectAuth();
        if (result) {
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
        googleBtn.disabled = false;
        githubBtn.disabled = false;
        googleBtn.innerHTML = originalGoogle;
        githubBtn.innerHTML = originalGithub;
        hidePageLoader();
    }
}

handleRedirectResult();

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.form-input').forEach(input => {
        input.value = '';
        const errorEl = input.closest('.form-group')?.querySelector('.field-error');
        if (errorEl) hideFieldError(errorEl);
    });
    if (tab === 'signin') {
        signInTab.classList.add('active');
        signUpTab.classList.remove('active');
        signInForm.classList.remove('hidden');
        signUpForm.classList.add('hidden');
        errorMsg.classList.add('hidden');
        resetTurnstile();
        setTimeout(() => renderTurnstile('turnstile-container'), 150);
        autoFocusField();
    } else {
        signUpTab.classList.add('active');
        signInTab.classList.remove('active');
        signUpForm.classList.remove('hidden');
        signInForm.classList.add('hidden');
        errorMsg.classList.add('hidden');
        resetTurnstile();
        setTimeout(() => renderTurnstile('turnstile-container-signup'), 150);
        autoFocusField();
    }
}

signInTab.addEventListener('click', () => switchTab('signin'));
signUpTab.addEventListener('click', () => switchTab('signup'));

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
    errorMsg.classList.add('visible');
}

function hideError() {
    errorMsg.classList.add('hidden');
    errorMsg.classList.remove('visible');
}

function getSubmitButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    const form = container.closest('.auth-form');
    if (!form) return null;
    return form.querySelector('.submit-btn');
}

function renderTurnstile(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.turnstile) {
        if (turnstileAttempts < MAX_TURNSTILE_RETRIES) {
            turnstileAttempts++;
            if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
            turnstileRetryTimeout = setTimeout(() => renderTurnstile(containerId), 2000);
        } else {
            showToast('CAPTCHA temporarily unavailable. Please refresh the page.', 4000, 'error');
        }
        return;
    }
    if (turnstileWidgetId !== null && turnstileWidgetId !== undefined) {
        try { turnstile.remove(turnstileWidgetId); } catch (_) {}
        turnstileWidgetId = null;
    }
    container.innerHTML = '';
    container.classList.remove('solved', 'show');
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
                turnstileAttempts = 0;
            },
            'expired-callback': function() {
                captchaToken = null;
                container.classList.remove('solved');
                const btn = getSubmitButton(containerId);
                if (btn) {
                    btn.classList.remove('visible');
                    btn.disabled = true;
                }
                showToast('Verification expired, please re-verify.', 3000, 'warning');
            },
            'error-callback': function() {
                captchaToken = null;
                container.classList.remove('solved');
                const btn = getSubmitButton(containerId);
                if (btn) {
                    btn.classList.remove('visible');
                    btn.disabled = true;
                }
                if (turnstileAttempts < MAX_TURNSTILE_RETRIES) {
                    turnstileAttempts++;
                    if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
                    turnstileRetryTimeout = setTimeout(() => renderTurnstile(containerId), 2000);
                } else {
                    showToast('CAPTCHA temporarily unavailable. Please refresh the page.', 4000, 'error');
                }
            }
        });
        setTimeout(() => container.classList.add('show'), 50);
    } catch (e) {
        if (turnstileAttempts < MAX_TURNSTILE_RETRIES) {
            turnstileAttempts++;
            if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
            turnstileRetryTimeout = setTimeout(() => renderTurnstile(containerId), 2000);
        } else {
            showToast('CAPTCHA temporarily unavailable. Please refresh the page.', 4000, 'error');
        }
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
    turnstileAttempts = 0;
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

async function handleEmailSignIn(e) {
    e.preventDefault();
    hideError();
    const email = signInEmail.value.trim();
    const password = signInPassword.value.trim();
    let hasError = false;
    if (!email) {
        showFieldError(signInEmailError, 'Email is required');
        hasError = true;
    } else if (!validateEmail(email)) {
        showFieldError(signInEmailError, 'Please enter a valid email');
        hasError = true;
    } else {
        hideFieldError(signInEmailError);
    }
    if (!password) {
        showFieldError(signInPasswordError, 'Password is required');
        hasError = true;
    } else {
        hideFieldError(signInPasswordError);
    }
    if (hasError) return;
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
        signInBtn.classList.add('success');
        signInBtn.innerHTML = '<i class="ph-bold ph-check-circle"></i> Signed In';
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 500);
    } catch (err) {
        signInBtn.disabled = false;
        signInBtn.classList.remove('loading', 'success');
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
    const password = signUpPassword.value;
    const confirm = signUpConfirm.value;
    let hasError = false;
    if (!name) {
        showFieldError(signUpNameError, 'Name is required');
        hasError = true;
    } else {
        hideFieldError(signUpNameError);
    }
    if (!email) {
        showFieldError(signUpEmailError, 'Email is required');
        hasError = true;
    } else if (!validateEmail(email)) {
        showFieldError(signUpEmailError, 'Please enter a valid email');
        hasError = true;
    } else {
        hideFieldError(signUpEmailError);
    }
    if (!password) {
        showFieldError(signUpPasswordError, 'Password is required');
        hasError = true;
    } else if (password.length < 6) {
        showFieldError(signUpPasswordError, 'Minimum 6 characters');
        hasError = true;
    } else {
        hideFieldError(signUpPasswordError);
    }
    if (!confirm) {
        showFieldError(signUpConfirmError, 'Please confirm your password');
        hasError = true;
    } else if (confirm !== password) {
        showFieldError(signUpConfirmError, 'Passwords do not match');
        hasError = true;
    } else {
        hideFieldError(signUpConfirmError);
    }
    if (hasError) return;
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
        signUpBtn.classList.add('success');
        signUpBtn.innerHTML = '<i class="ph-bold ph-check-circle"></i> Account Created';
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 500);
    } catch (err) {
        signUpBtn.disabled = false;
        signUpBtn.classList.remove('loading', 'success');
        signUpBtn.innerHTML = '<i class="ph-bold ph-user-plus"></i> Create Account';
        let msg = 'Sign up failed. Please try again.';
        if (err.code === 'auth/email-already-in-use') {
            msg = 'This email is already registered. <a href="#" id="signInLinkFromError" style="color:#a855f7; font-weight:700;">Sign in instead?</a>';
            showError(msg);
            const link = document.getElementById('signInLinkFromError');
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    switchTab('signin');
                });
            }
            resetTurnstile();
            renderTurnstile('turnstile-container-signup');
            return;
        } else if (err.code === 'auth/weak-password') msg = 'Password is too weak. Use at least 6 characters.';
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

forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    hideError();
    const email = signInEmail.value.trim();
    if (!email) {
        showFieldError(signInEmailError, 'Please enter your email address first');
        signInEmail.classList.add('error');
        setTimeout(() => {
            signInEmail.classList.remove('error');
        }, 2000);
        return;
    }
    if (!validateEmail(email)) {
        showFieldError(signInEmailError, 'Please enter a valid email address');
        return;
    }
    try {
        await sendPasswordReset(email);
        showToast('Password reset email sent! Check your inbox.', 4000, 'success');
        forgotLink.classList.add('highlight');
        setTimeout(() => forgotLink.classList.remove('highlight'), 2000);
    } catch (err) {
        let msg = 'Failed to send reset email.';
        if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
        else if (err.message) msg = err.message;
        showError(msg);
    }
});

function getSocialErrorMessage(err) {
    const code = err.code;
    const map = {
        'auth/popup-closed-by-user': 'Popup was closed before completing sign-in.',
        'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/cancelled-popup-request': 'Another sign-in attempt is already in progress.',
        'auth/account-exists-with-different-credential': 'An account with this email already exists using a different sign-in method.'
    };
    return map[code] || err.message || `${label} sign-in failed. Please try again.`;
}

async function executeSocialLogin(providerFn, buttonElement, label) {
    hideError();
    const originalHtml = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = `<i class="ph-bold ph-circle-notch animate-spin"></i> Redirecting...`;
    try {
        await providerFn();
    } catch (err) {
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalHtml;
        const msg = getSocialErrorMessage(err);
        showError(msg);
    }
}

googleBtn.addEventListener('click', () => executeSocialLogin(signInWithGoogle, googleBtn, 'Google'));
githubBtn.addEventListener('click', () => executeSocialLogin(signInWithGithub, githubBtn, 'GitHub'));

const inputFields = [signInEmail, signInPassword, signUpName, signUpEmail, signUpPassword, signUpConfirm];
inputFields.forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
        if (errorMsg.classList.contains('visible')) {
            hideError();
        }
        const errorEl = input.closest('.form-group')?.querySelector('.field-error');
        if (errorEl && !errorEl.classList.contains('hidden')) {
            const id = input.id;
            if (id === 'signInEmail' || id === 'signUpEmail') {
                const val = input.value.trim();
                if (val && validateEmail(val)) {
                    hideFieldError(errorEl);
                }
            } else if (id === 'signInPassword' || id === 'signUpName') {
                if (input.value.trim()) {
                    hideFieldError(errorEl);
                }
            } else if (id === 'signUpPassword') {
                if (input.value.length >= 6) {
                    hideFieldError(errorEl);
                }
                updatePasswordStrength(input.value);
                if (signUpConfirm && signUpConfirm.value) {
                    const pass = input.value;
                    const confirm = signUpConfirm.value;
                    const confirmError = signUpConfirm.closest('.form-group')?.querySelector('.field-error');
                    if (confirmError && pass !== confirm) {
                        showFieldError(confirmError, 'Passwords do not match');
                    } else if (confirmError) {
                        hideFieldError(confirmError);
                    }
                }
            } else if (id === 'signUpConfirm') {
                const password = signUpPassword?.value || '';
                const val = input.value;
                if (val && val === password) {
                    hideFieldError(errorEl);
                }
            }
        }
    });
    input.addEventListener('blur', () => {
        validateField(input);
    });
});

observeAuthState((user) => {
    if (user) {
        window.location.href = '/dashboard';
    } else {
        renderTurnstile('turnstile-container');
        startTypewriter();
        autoFocusField();
        hidePageLoader();
    }
});

window.handleOneTap = async (response) => {
    try {
        await signInWithGoogleOneTap(response);
        window.location.href = '/dashboard';
    } catch (err) {
        console.warn('One-Tap failed, user can use regular buttons.');
    }
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (currentTab === 'signin') {
            if (!signInBtn.disabled && signInBtn.classList.contains('visible')) {
                signInBtn.click();
            } else {
                showToast('Please complete the CAPTCHA first.', 3000, 'warning');
            }
        } else {
            if (!signUpBtn.disabled && signUpBtn.classList.contains('visible')) {
                signUpBtn.click();
            } else {
                showToast('Please complete the CAPTCHA first.', 3000, 'warning');
            }
        }
    }
});