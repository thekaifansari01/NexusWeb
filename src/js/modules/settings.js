// modules/settings.js
import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { showToast } from "./ui.js";
import { getAuth, reauthenticateWithCredential, updatePassword, EmailAuthProvider } from "firebase/auth";
import { signOutUser } from "./auth.js";
import { renderDeleteTurnstile, resetDeleteTurnstile } from "./dashboard-utils.js";

const auth = getAuth();

export async function updateUserPassword() {
  const currPass = dom.currentPassword.value.trim();
  const newPass = dom.newPassword.value.trim();
  const confirmPass = dom.confirmPassword.value.trim();
  if (!currPass || !newPass || !confirmPass) {
    showToast('Please fill all password fields.', 3000, 'warning');
    return;
  }
  if (newPass.length < 6) {
    showToast('New password must be at least 6 characters.', 3000, 'warning');
    return;
  }
  if (newPass !== confirmPass) {
    showToast('Passwords do not match.', 3000, 'warning');
    return;
  }
  const user = auth.currentUser;
  if (!user) return;
  const credential = EmailAuthProvider.credential(user.email, currPass);
  try {
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPass);
    showToast('Password updated successfully!', 3500, 'success');
    dom.currentPassword.value = '';
    dom.newPassword.value = '';
    dom.confirmPassword.value = '';
  } catch (error) {
    let msg = 'Password update failed.';
    if (error.code === 'auth/wrong-password') msg = 'Current password is incorrect.';
    else if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
    else if (error.message) msg = error.message;
    showToast(msg, 3500, 'error');
  }
}

export function openDeleteAccountModal() {
  if (dom.deleteAccountModal) {
    dom.deleteAccountModal.classList.remove('hidden');
    dom.deleteAccountModal.style.display = 'flex';
  }
  state.deleteReauthToken = 'dummy';
  if (dom.deleteConfirmBtn) dom.deleteConfirmBtn.disabled = true;
  if (dom.deletePassword && dom.deletePassword.parentElement) {
    dom.deletePassword.parentElement.classList.add('hidden');
  }
  if (dom.deleteSocialReauth) dom.deleteSocialReauth.classList.add('hidden');
  renderDeleteTurnstile();
}

export function closeDeleteAccountModal() {
  if (dom.deleteAccountModal) {
    dom.deleteAccountModal.classList.add('hidden');
    dom.deleteAccountModal.style.display = 'none';
  }
  resetDeleteTurnstile();
  state.deleteReauthToken = null;
  if (dom.deleteConfirmBtn) dom.deleteConfirmBtn.disabled = true;
}

export async function confirmDeleteAccount() {
  if (!state.deleteCaptchaToken) {
    showToast('Please complete the CAPTCHA.', 3000, 'warning');
    return;
  }
  dom.deleteConfirmBtn.disabled = true;
  dom.deleteConfirmBtn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Deleting...';
  try {
    const response = await fetch('/api/user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ captchaToken: state.deleteCaptchaToken })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Deletion failed.');
    }
    showToast('Account deleted successfully.', 4000, 'success');
    dom.deleteAccountModal.classList.add('hidden');
    resetDeleteTurnstile();
    await signOutUser();
    window.location.href = '/';
  } catch (error) {
    showToast(error.message || 'Failed to delete account.', 3500, 'error');
    dom.deleteConfirmBtn.disabled = false;
    dom.deleteConfirmBtn.innerHTML = 'Confirm Delete';
  }
}