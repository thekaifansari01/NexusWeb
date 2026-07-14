// src/js/modules/events.js
import { dom } from "./dashboard-dom.js";
import { state } from "./dashboard-state.js";
import { switchTab, toggleMobileSidebar, handleURLState } from "./tabs.js";
import { signOutUser } from "./auth.js";
import { closeCaptchaModal } from "./dashboard-utils.js";
import { showToast } from "./ui.js";
import { loadKeys, openCreateKeyModal, closeCreateKeyModal } from "./api-keys.js";
import { loadDomains, openAddDomainModal, closeAddDomainModal } from "./domains.js";
import { loadGroqKey, handleGroqInput, cancelGroqEdit, toggleGroqVisibility, saveGroqKeyHandler, deleteGroqKeyHandler } from "./groq.js";
import { loadUsage, filterLogs, applyFilter, loadMoreLogs, sortLogs, exportLogs } from "./usage.js";
import { updateUserPassword, openDeleteAccountModal, closeDeleteAccountModal, confirmDeleteAccount } from "./settings.js";
import { addDomain } from "./firestore.js";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase.js";

export function initEvents() {
  dom.tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId, true);
    });
  });

  if (dom.mobileMenuBtn && dom.sidebar) {
    dom.mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
  }

  window.addEventListener('popstate', handleURLState);

  if (dom.sidebarSignOut) {
    dom.sidebarSignOut.addEventListener('click', async () => {
      await signOutUser();
    });
  }

  dom.createKeyBtn.addEventListener('click', () => {
    if (dom.createKeyForm.classList.contains('hidden')) openCreateKeyModal(true);
    else closeCreateKeyModal(true);
  });

  dom.cancelKeyBtn.addEventListener('click', () => closeCreateKeyModal(true));

  dom.saveKeyBtn.addEventListener('click', async () => {
    const name = dom.keyNameInput.value.trim();
    if (!name) {
      showToast('Please enter a name for the key.', 3000, 'warning');
      return;
    }
    if (!state.captchaToken) {
      showToast('Please complete the CAPTCHA.', 3000, 'warning');
      return;
    }
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name,
          captchaToken: state.captchaToken
        })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || 'Failed to create key.', 3500, 'error');
        return;
      }
      showToast(`API key "${name}" created successfully!`, 3500, 'success');
      closeCreateKeyModal(true);
      loadKeys();
    } catch (error) {
      showToast('Network error. Please try again.', 3500, 'error');
    }
  });

  dom.keyNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !dom.saveKeyBtn.classList.contains('hidden')) dom.saveKeyBtn.click();
  });

  dom.addDomainBtn.addEventListener('click', () => {
    if (dom.addDomainForm.classList.contains('hidden')) openAddDomainModal(true);
    else closeAddDomainModal(true);
  });

  dom.cancelDomainBtn.addEventListener('click', () => closeAddDomainModal(true));

  dom.saveDomainBtn.addEventListener('click', async () => {
    let domain = dom.domainInput.value.trim();
    if (!domain) {
      showToast('Please enter a domain name.', 3000, 'warning');
      return;
    }
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    if (!domain.includes('.') || domain.length < 4) {
      showToast('Please enter a valid domain (e.g., example.com).', 3000, 'warning');
      return;
    }
    try {
      await addDomain(state.currentUser.uid, domain);
      showToast(`Domain "${domain}" added successfully!`, 3500, 'success');
      closeAddDomainModal(true);
      loadDomains();
    } catch (error) {
      if (error.message === 'Domain already exists') {
        showToast(`Domain "${domain}" already exists.`, 3000, 'warning');
      } else if (error.message === 'Maximum 10 domains allowed') {
        showToast('Maximum 10 domains allowed. Remove some first.', 3500, 'warning');
      } else {
        showToast('Failed to add domain. Please try again.', 3500, 'error');
      }
    }
  });

  dom.domainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') dom.saveDomainBtn.click();
  });

  if (dom.toggleGroqBtn) {
    dom.toggleGroqBtn.addEventListener('click', toggleGroqVisibility);
  }

  if (dom.groqInput) {
    dom.groqInput.addEventListener('input', handleGroqInput);
  }

  if (dom.cancelGroqBtn) {
    dom.cancelGroqBtn.addEventListener('click', cancelGroqEdit);
  }

  if (dom.saveGroqBtn) {
    dom.saveGroqBtn.addEventListener('click', saveGroqKeyHandler);
  }

  if (dom.deleteGroqBtn) {
    dom.deleteGroqBtn.addEventListener('click', deleteGroqKeyHandler);
  }

  dom.captchaModalCancel.addEventListener('click', closeCaptchaModal);

  dom.captchaModalConfirm.addEventListener('click', async () => {
    if (!state.captchaToken) {
      showToast('Please complete the CAPTCHA.', 3000, 'warning');
      return;
    }
    if (!state.pendingAction) {
      closeCaptchaModal();
      return;
    }
    try {
      await state.pendingAction(state.pendingActionData);
      closeCaptchaModal();
    } catch (error) {
      showToast(error.message || 'Action failed.', 3500, 'error');
      closeCaptchaModal();
    }
  });

  if (dom.updatePasswordBtn) {
    dom.updatePasswordBtn.addEventListener('click', updateUserPassword);
  }

  if (dom.deleteAccountBtn) {
    dom.deleteAccountBtn.addEventListener('click', openDeleteAccountModal);
  }

  dom.deleteCancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeDeleteAccountModal();
  });

  dom.deleteConfirmBtn.addEventListener('click', confirmDeleteAccount);

  dom.rangeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.rangeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentRange = parseInt(btn.dataset.range);
      loadUsage(state.currentRange);
    });
  });

  if (dom.exportBtn) {
    dom.exportBtn.addEventListener('click', exportLogs);
  }

  if (dom.logSearchInput) {
    dom.logSearchInput.addEventListener('input', () => {
      const query = dom.logSearchInput.value.toLowerCase().trim();
      filterLogs(query);
    });
  }

  document.querySelectorAll('[data-sort]').forEach(el => {
    el.addEventListener('click', () => {
      sortLogs(el.dataset.sort);
    });
  });

  dom.filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      applyFilter(chip.dataset.filter, chip.textContent.trim().toLowerCase());
    });
  });

  if (dom.loadMoreBtn) {
    dom.loadMoreBtn.addEventListener('click', loadMoreLogs);
  }
}