// src/js/settings-page.js
import { observeAuthState, signOutUser } from "./modules/auth.js";
import { updateUserUI } from "./modules/dashboard-utils.js";
import {
  updateUserPassword,
  openDeleteAccountModal,
  closeDeleteAccountModal,
  confirmDeleteAccount,
} from "./modules/settings.js";
import { showToast } from "./modules/ui.js";

// DOM elements (only those used for event binding)
const sidebarSignOut = document.getElementById("sidebarSignOut");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector("aside");
const updatePasswordBtn = document.getElementById("updatePasswordBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

// Mobile menu toggle
if (mobileMenuBtn && sidebar) {
  mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
    if (!sidebar.classList.contains("hidden")) {
      sidebar.classList.add("absolute", "z-50", "h-full", "w-64");
    } else {
      sidebar.classList.remove("absolute", "z-50", "h-full", "w-64");
    }
  });
}

// Sign out
if (sidebarSignOut) {
  sidebarSignOut.addEventListener("click", async () => {
    await signOutUser();
  });
}

// Password update
if (updatePasswordBtn) {
  updatePasswordBtn.addEventListener("click", updateUserPassword);
}

// Delete account flow
if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener("click", openDeleteAccountModal);
}
if (deleteCancelBtn) {
  deleteCancelBtn.addEventListener("click", closeDeleteAccountModal);
}
if (deleteConfirmBtn) {
  deleteConfirmBtn.addEventListener("click", confirmDeleteAccount);
}

// Auth observer – redirect if not logged in, otherwise update UI
observeAuthState((user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  // Update sidebar and profile with user data
  updateUserUI(user);
});