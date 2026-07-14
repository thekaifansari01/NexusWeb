// src/js/modules/init.js
import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { loadKeys } from "./api-keys.js";
import { loadDomains } from "./domains.js";
import { loadGroqKey } from "./groq.js";
import { loadUsage } from "./usage.js";
import { loadPlanInfo } from "./plan.js";
import { updateUserUI } from "./dashboard-utils.js";
import { handleURLState } from "./tabs.js";

export function initDashboard(user) {
  state.currentUser = user;
  updateUserUI(user);
  handleURLState();
  loadKeys();
  loadDomains();
  loadGroqKey();
  loadUsage();
  loadPlanInfo();
  if (dom.deleteAccountModal) {
    dom.deleteAccountModal.classList.add('hidden');
    dom.deleteAccountModal.style.display = 'none';
  }
}