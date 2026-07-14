// dashboard.js
import { observeAuthState } from "./modules/auth.js";
import { state } from "./modules/dashboard-state.js";
import { dom } from "./modules/dashboard-dom.js";
import { updateUserUI } from "./modules/dashboard-utils.js";
import { handleURLState } from "./modules/tabs.js";
import { loadKeys } from "./modules/api-keys.js";
import { loadDomains } from "./modules/domains.js";
import { loadGroqKey } from "./modules/groq.js";
import { loadUsage } from "./modules/usage.js";
import { initEvents } from "./modules/events.js";

observeAuthState((user) => {
  if (!user) {
    window.location.href = '/login';
    return;
  }
  state.currentUser = user;
  updateUserUI(user);
  handleURLState();
  loadKeys();
  loadDomains();
  loadGroqKey();
  loadUsage(state.currentRange);
  initEvents();
});