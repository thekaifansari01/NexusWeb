import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { showToast } from "./ui.js";
import { getApiKeys, deleteApiKey } from "./firestore.js";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase.js";
import { showSkeleton, hideSkeleton, showStatSkeletons, showCaptchaModal, resetTurnstile, renderTurnstile, updateWithTransition } from "./dashboard-utils.js";

export async function loadKeys() {
  if (!state.currentUser) return;
  showStatSkeletons();
  showSkeleton('keysContainer', 'keys');
  showSkeleton('overviewKeysContainer', 'overview');
  dom.emptyState.classList.add('hidden');
  try {
    const keys = await getApiKeys(state.currentUser.uid);
    hideSkeleton('keysContainer');
    hideSkeleton('overviewKeysContainer');
    renderKeys(keys);
    renderOverviewKeys(keys);
    updateStats(keys);
  } catch (error) {
    hideSkeleton('keysContainer');
    hideSkeleton('overviewKeysContainer');
    showToast('Failed to load keys. Please refresh the page.', 3500, 'error');
  }
}

function updateStats(keys) {
  const total = keys.length;
  const active = keys.filter(k => k.status === 'active').length;
  const revoked = keys.filter(k => k.status === 'revoked').length;
  updateWithTransition(dom.totalKeysEl, total);
  updateWithTransition(dom.activeKeysEl, active);
  updateWithTransition(dom.revokedKeysEl, revoked);
  updateWithTransition(dom.keysTotalEl, total);
  updateWithTransition(dom.keysActiveEl, active);
  updateWithTransition(dom.keysRevokedEl, revoked);
}

function renderOverviewKeys(keys) {
  if (!dom.overviewKeysContainer) return;
  hideSkeleton('overviewKeysContainer');
  dom.overviewKeysContainer.innerHTML = '';
  if (keys.length === 0) {
    dom.overviewKeysContainer.innerHTML = '<p class="text-sm text-zinc-500 font-medium">No keys created yet.</p>';
    return;
  }
  keys.slice(0, 3).forEach(key => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5';
    const isActive = key.status === 'active';
    const keyPreview = key?.key ? key.key.slice(0, 8) + '...' : 'N/A';
    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]'}"></div>
        <span class="text-sm text-white font-bold">${key.name}</span>
      </div>
      <span class="text-xs font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded-md">${keyPreview}</span>
    `;
    dom.overviewKeysContainer.appendChild(div);
  });
}

function renderKeys(keys) {
  hideSkeleton('keysContainer');
  const items = dom.keysContainer.querySelectorAll('.key-card');
  items.forEach(el => el.remove());
  if (keys.length === 0) {
    dom.emptyState.classList.remove('hidden');
    return;
  }
  dom.emptyState.classList.add('hidden');
  keys.forEach((key, index) => {
    const card = document.createElement('div');
    card.className = `key-card fade-in-up flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-900/30 hover:border-primary/20 transition-all shadow-md`;
    card.style.animationDelay = `${index * 0.04}s`;
    const left = document.createElement('div');
    left.className = 'flex-1 min-w-0';
    const nameRow = document.createElement('div');
    nameRow.className = 'flex items-center gap-3 flex-wrap';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'text-lg font-bold text-white tracking-wide';
    nameSpan.textContent = key.name;
    nameRow.appendChild(nameSpan);
    const isActive = key.status === 'active';
    const badge = document.createElement('span');
    badge.className = `px-2.5 py-1 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 uppercase tracking-wider ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`;
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}"></span> ${isActive ? 'Active' : 'Revoked'}`;
    nameRow.appendChild(badge);
    left.appendChild(nameRow);
    const metaRow = document.createElement('div');
    metaRow.className = 'flex items-center gap-4 mt-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider';
    if (key.createdAt) {
      const d = key.createdAt.toDate ? key.createdAt.toDate() : new Date(key.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      metaRow.innerHTML = `<span><i class="ph-bold ph-calendar-blank mr-1"></i> ${dateStr} at ${timeStr}</span>`;
    } else {
      metaRow.innerHTML = `<span><i class="ph-bold ph-calendar-blank mr-1"></i> Recently created</span>`;
    }
    left.appendChild(metaRow);
    const keyValRow = document.createElement('div');
    keyValRow.className = 'mt-3 flex items-center gap-3';
    const keyText = document.createElement('span');
    keyText.className = 'font-mono text-sm text-zinc-400 bg-black/50 px-3 py-1.5 rounded-xl border border-white/5';
    const masked = key?.key ? key.key.slice(0, 8) + '••••••••••••' : '••••••••';
    keyText.textContent = masked;
    keyValRow.appendChild(keyText);
    const copyBtn = document.createElement('button');
    copyBtn.className = 'w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors';
    copyBtn.innerHTML = '<i class="ph-bold ph-copy text-sm"></i>';
    copyBtn.title = 'Copy key';
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (key?.key) {
        await navigator.clipboard.writeText(key.key);
        showToast('Key copied to clipboard!', 2500, 'success');
      } else {
        showToast('Key not available.', 3000, 'warning');
      }
    });
    keyValRow.appendChild(copyBtn);
    left.appendChild(keyValRow);
    card.appendChild(left);
    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-2 flex-shrink-0 mt-4 md:mt-0';
    const toggleBtn = document.createElement('button');
    toggleBtn.className = `px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isActive ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`;
    toggleBtn.textContent = isActive ? 'Revoke' : 'Activate';
    toggleBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      showCaptchaModal(
        isActive ? 'Revoke API Key' : 'Activate API Key',
        isActive ? `Are you sure you want to revoke "${key.name}"?` : `Are you sure you want to activate "${key.name}"?`,
        async () => {
          const newStatus = isActive ? 'revoked' : 'active';
          const action = newStatus === 'active' ? 'activated' : 'revoked';
          await updateDoc(doc(db, 'apiKeys', key.id), { status: newStatus });
          showToast(`Key "${key.name}" ${action}!`, 3000, 'success');
          loadKeys();
        }
      );
    });
    actions.appendChild(toggleBtn);
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'w-10 h-10 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all';
    deleteBtn.innerHTML = '<i class="ph-bold ph-trash text-lg"></i>';
    deleteBtn.title = 'Delete permanently';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      showCaptchaModal(
        'Delete API Key',
        `Are you sure you want to permanently delete "${key.name}"?`,
        async () => {
          await deleteApiKey(key.id);
          showToast(`Key "${key.name}" deleted permanently.`, 3000, 'success');
          loadKeys();
        }
      );
    });
    actions.appendChild(deleteBtn);
    card.appendChild(actions);
    dom.keysContainer.appendChild(card);
  });
}

export function openCreateKeyModal(updateHistory = true) {
  dom.createKeyForm.classList.remove('hidden');
  dom.createKeyForm.classList.remove('slide-down');
  void dom.createKeyForm.offsetWidth;
  dom.createKeyForm.classList.add('slide-down');
  dom.keyNameInput.value = '';
  dom.keyNameInput.focus();
  setTimeout(() => renderTurnstile(), 200);
  if (updateHistory) {
    const url = new URL(window.location);
    url.searchParams.set('action', 'create-key');
    window.history.pushState({ tab: 'api-keys', action: 'create-key' }, '', url);
  }
}

export function closeCreateKeyModal(updateHistory = true) {
  dom.createKeyForm.classList.add('hidden');
  resetTurnstile();
  if (updateHistory) {
    const url = new URL(window.location);
    url.searchParams.delete('action');
    window.history.pushState({ tab: 'api-keys' }, '', url);
  }
}