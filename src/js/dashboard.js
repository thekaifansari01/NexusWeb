// src/js/dashboard.js
import { observeAuthState } from "./modules/auth.js";
import { initDashboard } from "./modules/init.js";

observeAuthState((user) => {
  if (!user) {
    window.location.href = '/login';
    return;
  }
  initDashboard(user);
});