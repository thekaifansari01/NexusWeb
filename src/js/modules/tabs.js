// src/js/modules/tabs.js
import { dom } from "./dashboard-dom.js";
import { openCreateKeyModal, closeCreateKeyModal } from "./api-keys.js";
import { openAddDomainModal, closeAddDomainModal } from "./domains.js";

export function switchTab(tabId, updateHistory = true) {
  const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (!btn) return;
  dom.tabBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  dom.tabContents.forEach(tab => tab.classList.add('hidden'));
  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) activeTab.classList.remove('hidden');
  dom.breadcrumbCurrent.textContent = btn.textContent.trim();
  if (window.innerWidth < 768 && dom.sidebar) {
    dom.sidebar.classList.add('hidden');
    dom.sidebar.classList.remove('absolute', 'z-50', 'h-full', 'w-64');
  }
  if (updateHistory) {
    const url = new URL(window.location);
    url.searchParams.set('tab', tabId);
    url.searchParams.delete('action');
    window.history.pushState({ tab: tabId }, '', url);
  }
}

export function handleURLState() {
  const url = new URL(window.location);
  const tab = url.searchParams.get('tab') || 'overview';
  const action = url.searchParams.get('action');
  switchTab(tab, false);
  if (tab === 'api-keys' && action === 'create-key') {
    openCreateKeyModal(false);
  } else {
    closeCreateKeyModal(false);
  }
  if (tab === 'domains' && action === 'add-domain') {
    openAddDomainModal(false);
  } else {
    closeAddDomainModal(false);
  }
}

export function toggleMobileSidebar() {
  dom.sidebar.classList.toggle('hidden');
  if (!dom.sidebar.classList.contains('hidden')) {
    dom.sidebar.classList.add('absolute', 'z-50', 'h-full', 'w-64');
  } else {
    dom.sidebar.classList.remove('absolute', 'z-50', 'h-full', 'w-64');
  }
}