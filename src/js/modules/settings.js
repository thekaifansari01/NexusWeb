// src/js/modules/settings.js
import { state } from "./dashboard-state.js";
import { showToast } from "./ui.js";
import { getAuth, reauthenticateWithCredential, updatePassword, EmailAuthProvider } from "firebase/auth";
import { signOutUser } from "./auth.js";
import { renderDeleteTurnstile, resetDeleteTurnstile } from "./dashboard-utils.js";

const auth = getAuth();

const getEl = (id) => document.getElementById(id);

export async function updateUserPassword() {
  const currentPassword = getEl("currentPassword");
  const newPassword = getEl("newPassword");
  const confirmPassword = getEl("confirmPassword");

  const currPass = currentPassword?.value.trim() || "";
  const newPass = newPassword?.value.trim() || "";
  const confirmPass = confirmPassword?.value.trim() || "";

  if (!currPass || !newPass || !confirmPass) {
    showToast("Please fill all password fields.", 3000, "warning");
    return;
  }
  if (newPass.length < 6) {
    showToast("New password must be at least 6 characters.", 3000, "warning");
    return;
  }
  if (newPass !== confirmPass) {
    showToast("Passwords do not match.", 3000, "warning");
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  const credential = EmailAuthProvider.credential(user.email, currPass);
  try {
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPass);
    showToast("Password updated successfully!", 3500, "success");
    if (currentPassword) currentPassword.value = "";
    if (newPassword) newPassword.value = "";
    if (confirmPassword) confirmPassword.value = "";
  } catch (error) {
    let msg = "Password update failed.";
    if (error.code === "auth/wrong-password") msg = "Current password is incorrect.";
    else if (error.code === "auth/too-many-requests") msg = "Too many attempts. Try again later.";
    else if (error.message) msg = error.message;
    showToast(msg, 3500, "error");
  }
}

export function openDeleteAccountModal() {
  const modal = getEl("deleteAccountModal");
  const confirmBtn = getEl("deleteConfirmBtn");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }
  if (confirmBtn) confirmBtn.disabled = true;
  renderDeleteTurnstile();
}

export function closeDeleteAccountModal() {
  const modal = getEl("deleteAccountModal");
  const confirmBtn = getEl("deleteConfirmBtn");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
  resetDeleteTurnstile();
  if (confirmBtn) confirmBtn.disabled = true;
}

export async function confirmDeleteAccount() {
  if (!state.deleteCaptchaToken) {
    showToast("Please complete the CAPTCHA.", 3000, "warning");
    return;
  }

  const confirmBtn = getEl("deleteConfirmBtn");
  const modal = getEl("deleteAccountModal");

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Deleting...';
  }

  try {
    const response = await fetch("/api/user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ captchaToken: state.deleteCaptchaToken }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Deletion failed.");
    }
    showToast("Account deleted successfully.", 4000, "success");
    if (modal) {
      modal.classList.add("hidden");
      modal.style.display = "none";
    }
    resetDeleteTurnstile();
    await signOutUser();
    window.location.href = "/";
  } catch (error) {
    showToast(error.message || "Failed to delete account.", 3500, "error");
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = "Delete Forever";
    }
  }
}