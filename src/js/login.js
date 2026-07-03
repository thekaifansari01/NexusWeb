import { 
  signInWithEmail, signUpWithEmail, sendPasswordReset,
  signInWithGoogle, signInWithGithub, 
  signInWithGoogleOneTap, observeAuthState, signOutUser 
} from "./modules/auth.js";
import { showToast } from "./modules/ui.js";

// DOM Elements
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

// ----- Tab switching -----
function switchTab(tab) {
  currentTab = tab;
  if (tab === 'signin') {
    signInTab.classList.add('active');
    signUpTab.classList.remove('active');
    signInForm.classList.remove('hidden');
    signUpForm.classList.add('hidden');
    errorMsg.textContent = '';
  } else {
    signUpTab.classList.add('active');
    signInTab.classList.remove('active');
    signUpForm.classList.remove('hidden');
    signInForm.classList.add('hidden');
    errorMsg.textContent = '';
  }
}

signInTab.addEventListener('click', () => switchTab('signin'));
signUpTab.addEventListener('click', () => switchTab('signup'));

// ----- Show error -----
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
  setTimeout(() => errorMsg.classList.add('hidden'), 5000);
}

// ----- Sign In -----
signInBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = signInEmail.value.trim();
  const password = signInPassword.value.trim();
  if (!email || !password) {
    showError('Please fill in all fields.');
    return;
  }
  try {
    await signInWithEmail(email, password);
    window.location.href = '/dashboard';
  } catch (err) {
    console.error(err);
    if (err.code === 'auth/user-not-found') {
      showError('No account found with this email.');
    } else if (err.code === 'auth/wrong-password') {
      showError('Incorrect password.');
    } else if (err.code === 'auth/too-many-requests') {
      showError('Too many failed attempts. Try again later.');
    } else {
      showError('Sign in failed. Please try again.');
    }
  }
});

// ----- Sign Up -----
signUpBtn.addEventListener('click', async (e) => {
  e.preventDefault();
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

  try {
    await signUpWithEmail(email, password, name);
    window.location.href = '/dashboard';
  } catch (err) {
    console.error(err);
    if (err.code === 'auth/email-already-in-use') {
      showError('This email is already registered. Please sign in.');
    } else if (err.code === 'auth/weak-password') {
      showError('Password is too weak.');
    } else {
      showError('Sign up failed. Please try again.');
    }
  }
});

// ----- Forgot Password -----
forgotLink.addEventListener('click', (e) => {
  e.preventDefault();
  const email = signInEmail.value.trim();
  if (!email) {
    showError('Please enter your email address first.');
    return;
  }
  sendPasswordReset(email)
    .then(() => {
      showToast('Password reset email sent! Check your inbox.', 4000, 'success');
    })
    .catch((err) => {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        showError('No account found with this email.');
      } else {
        showError('Failed to send reset email. Try again.');
      }
    });
});

// ----- Google Sign-In -----
googleBtn.addEventListener('click', async () => {
  try {
    await signInWithGoogle();
    window.location.href = '/dashboard';
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showError('Google sign-in failed. Please try again.');
    }
  }
});

// ----- GitHub Sign-In -----
githubBtn.addEventListener('click', async () => {
  try {
    await signInWithGithub();
    window.location.href = '/dashboard';
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showError('GitHub sign-in failed. Please try again.');
    }
  }
});

// ----- Auto-redirect if already logged in -----
observeAuthState((user) => {
  if (user) {
    window.location.href = '/dashboard';
  }
});

// ----- One-Tap (only if not on mobile, optional) -----
// Google One-Tap will be initialized globally in login.html
window.handleOneTap = async (response) => {
  try {
    await signInWithGoogleOneTap(response);
    window.location.href = '/dashboard';
  } catch (err) {
    console.warn('One-Tap failed, user can use regular buttons.');
  }
};

// ----- Enter key support -----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (currentTab === 'signin') signInBtn.click();
    else signUpBtn.click();
  }
});