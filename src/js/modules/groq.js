// modules/groq.js
import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { showToast } from "./ui.js";
import { getGroqApiKey, saveGroqApiKey, deleteGroqApiKey } from "./firestore.js";
import { showCaptchaModal, renderTurnstile, resetTurnstile } from "./dashboard-utils.js";

export async function loadGroqKey() {
  if (!state.currentUser) return;
  try {
    const keyExists = await getGroqApiKey(state.currentUser.uid);
    if (keyExists) {
      dom.groqInput.value = '';
      dom.groqStatus.textContent = '✅ Key saved';
      dom.groqStatus.style.color = '#34d399';
      dom.deleteGroqBtn.classList.remove('hidden');
      resetGroqForm();
      if (dom.groqVaultStatusEl) {
        dom.groqVaultStatusEl.textContent = '🔒 Encrypted';
        dom.groqVaultStatusEl.className = 'stat-number text-emerald-400 text-xl font-bold';
      }
    } else {
      dom.groqInput.value = '';
      dom.groqStatus.textContent = 'No key saved';
      dom.groqStatus.style.color = '#71717a';
      dom.deleteGroqBtn.classList.add('hidden');
      resetGroqForm();
      if (dom.groqVaultStatusEl) {
        dom.groqVaultStatusEl.textContent = '⚠️ Not Configured';
        dom.groqVaultStatusEl.className = 'stat-number text-amber-400 text-xl font-bold';
      }
    }
  } catch (error) {
    dom.groqStatus.textContent = 'Failed to load key';
    dom.groqStatus.style.color = '#fb7185';
    dom.deleteGroqBtn.classList.add('hidden');
    resetGroqForm();
    if (dom.groqVaultStatusEl) {
      dom.groqVaultStatusEl.textContent = '❌ Error';
      dom.groqVaultStatusEl.className = 'stat-number text-red-400 text-xl font-bold';
    }
  }
}

function resetGroqForm() {
  dom.saveGroqBtn.classList.add('hidden');
  dom.cancelGroqBtn.classList.add('hidden');
}

function showGroqSaveCancel() {
  dom.saveGroqBtn.classList.remove('hidden');
  dom.cancelGroqBtn.classList.remove('hidden');
}

export function handleGroqInput() {
  const currentVal = dom.groqInput.value.trim();
  if (currentVal.length > 0) {
    showGroqSaveCancel();
  } else {
    resetGroqForm();
  }
}

export function cancelGroqEdit() {
  dom.groqInput.value = '';
  resetGroqForm();
  loadGroqKey();
}

export function toggleGroqVisibility() {
  const input = dom.groqInput;
  const icon = dom.toggleGroqBtn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'ph-bold ph-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'ph-bold ph-eye';
  }
}

export function saveGroqKeyHandler() {
  const key = dom.groqInput.value.trim();
  if (!key) {
    showToast('Please enter a Groq API key.', 3000, 'warning');
    return;
  }
  showCaptchaModal(
    'Save Groq API Key',
    'Are you sure you want to save this Groq API key?',
    async () => {
      await saveGroqApiKey(state.currentUser.uid, key);
      showToast('Groq API key saved successfully!', 3500, 'success');
      dom.groqInput.value = '';
      dom.groqStatus.textContent = '✅ Key saved';
      dom.groqStatus.style.color = '#34d399';
      dom.deleteGroqBtn.classList.remove('hidden');
      resetGroqForm();
      loadGroqKey();
    }
  );
}

export function deleteGroqKeyHandler() {
  showCaptchaModal(
    'Delete Groq API Key',
    'Are you sure you want to delete your Groq API key?',
    async () => {
      await deleteGroqApiKey(state.currentUser.uid);
      dom.groqInput.value = '';
      dom.groqStatus.textContent = 'No key saved';
      dom.groqStatus.style.color = '#71717a';
      dom.deleteGroqBtn.classList.add('hidden');
      resetGroqForm();
      showToast('Groq API key deleted.', 3000, 'success');
      loadGroqKey();
    }
  );
}