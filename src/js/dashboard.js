import { observeAuthState, signOutUser } from "./modules/auth.js";
import { toggleDropdown, closeDropdown, showToast } from "./modules/ui.js";
import {
    getApiKeys, deleteApiKey,
    getDomains, addDomain, deleteDomain, toggleDomainStatus,
    saveGroqApiKey, getGroqApiKey, deleteGroqApiKey
} from "./modules/firestore.js";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "./config/firebase.js";

const userAvatar = document.getElementById('userAvatar');
const userEmail = document.getElementById('userEmail');
const signOutBtn = document.getElementById('signOutBtn');
const avatarBtn = document.getElementById('avatarBtn');

const keysContainer = document.getElementById('keysContainer');
const emptyState = document.getElementById('emptyState');
const createKeyBtn = document.getElementById('createKeyBtn');
const createKeyForm = document.getElementById('createKeyForm');
const keyNameInput = document.getElementById('keyNameInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const cancelKeyBtn = document.getElementById('cancelKeyBtn');
const totalKeysEl = document.getElementById('totalKeys');
const activeKeysEl = document.getElementById('activeKeys');
const revokedKeysEl = document.getElementById('revokedKeys');

const domainsContainer = document.getElementById('domainsContainer');
const domainsEmptyState = document.getElementById('domainsEmptyState');
const addDomainBtn = document.getElementById('addDomainBtn');
const addDomainForm = document.getElementById('addDomainForm');
const domainInput = document.getElementById('domainInput');
const saveDomainBtn = document.getElementById('saveDomainBtn');
const cancelDomainBtn = document.getElementById('cancelDomainBtn');
const totalDomainsEl = document.getElementById('totalDomains');
const domainLimitBadge = document.getElementById('domainLimitBadge');

const groqInput = document.getElementById('groqApiInput');
const groqStatus = document.getElementById('groqKeyStatus');
const saveGroqBtn = document.getElementById('saveGroqBtn');
const deleteGroqBtn = document.getElementById('deleteGroqBtn');
const toggleGroqBtn = document.getElementById('toggleGroqVisibility');

let currentUser = null;
const MAX_DOMAINS = 10;
let captchaToken = null;
let turnstileWidgetId = null;
let turnstileRetryTimeout = null;

function renderTurnstile() {
    const container = document.getElementById('turnstile-container');
    if (!container || !window.turnstile) return;

    if (turnstileWidgetId !== null && turnstileWidgetId !== undefined) {
        try {
            turnstile.remove(turnstileWidgetId);
        } catch (_) {}
        turnstileWidgetId = null;
    }

    container.innerHTML = '';

    try {
        turnstileWidgetId = turnstile.render(container, {
            sitekey: '0x4AAAAAADttl-ZBYJPZI8zP',
            callback: function(token) {
                captchaToken = token;
                saveKeyBtn.classList.remove('hidden');
            },
            'expired-callback': function() {
                captchaToken = null;
                saveKeyBtn.classList.add('hidden');
            },
            'error-callback': function() {
                captchaToken = null;
                saveKeyBtn.classList.add('hidden');
                console.warn('Turnstile error, retrying...');
                if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
                turnstileRetryTimeout = setTimeout(renderTurnstile, 2000);
            }
        });
    } catch (e) {
        console.warn('Turnstile render error:', e);
        if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
        turnstileRetryTimeout = setTimeout(renderTurnstile, 2000);
    }
}

function resetTurnstile() {
    try {
        if (turnstileWidgetId !== null && turnstileWidgetId !== undefined && window.turnstile) {
            turnstile.remove(turnstileWidgetId);
            turnstileWidgetId = null;
        }
    } catch (e) {
        console.warn('Turnstile reset skipped:', e);
    }
    captchaToken = null;
    saveKeyBtn.classList.add('hidden');
    if (turnstileRetryTimeout) {
        clearTimeout(turnstileRetryTimeout);
        turnstileRetryTimeout = null;
    }
}

observeAuthState((user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    userAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=User&background=a855f7&color=fff&size=40';
    userEmail.textContent = user.email || 'user@example.com';
    document.getElementById('greetingName').textContent = user.displayName || user.email || 'User';
    loadKeys();
    loadDomains();
    loadGroqKey();
    setTimeout(renderTurnstile, 100);
});

signOutBtn.addEventListener('click', async () => {
    await signOutUser();
});

avatarBtn.addEventListener('click', toggleDropdown);
document.addEventListener('click', closeDropdown);

createKeyBtn.addEventListener('click', () => {
    const isHidden = createKeyForm.classList.contains('hidden');
    createKeyForm.classList.toggle('hidden');
    if (isHidden) {
        createKeyForm.classList.remove('slide-down');
        void createKeyForm.offsetWidth;
        createKeyForm.classList.add('slide-down');
        keyNameInput.value = '';
        keyNameInput.focus();
        setTimeout(renderTurnstile, 200);
    }
});

cancelKeyBtn.addEventListener('click', () => {
    createKeyForm.classList.add('hidden');
    resetTurnstile();
});

saveKeyBtn.addEventListener('click', async () => {
    const name = keyNameInput.value.trim();
    if (!name) {
        showToast('Please enter a name for the key.', 3000, 'warning');
        return;
    }
    if (!captchaToken) {
        showToast('Please complete the CAPTCHA.', 3000, 'warning');
        return;
    }

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.uid,
                name: name,
                captchaToken: captchaToken
            })
        });
        const data = await response.json();
        if (!response.ok) {
            showToast(data.error || 'Failed to create key.', 3500, 'error');
            return;
        }
        showToast(`API key "${name}" created successfully!`, 3500, 'success');
        createKeyForm.classList.add('hidden');
        loadKeys();
        resetTurnstile();
    } catch (error) {
        console.error(error);
        showToast('Network error. Please try again.', 3500, 'error');
    }
});

keyNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveKeyBtn.click();
});

async function loadKeys() {
    if (!currentUser) return;
    try {
        const keys = await getApiKeys(currentUser.uid);
        renderKeys(keys);
        updateStats(keys);
    } catch (error) {
        console.error(error);
        showToast('Failed to load keys. Please refresh the page.', 3500, 'error');
    }
}

function updateStats(keys) {
    const total = keys.length;
    const active = keys.filter(k => k.status === 'active').length;
    const revoked = keys.filter(k => k.status === 'revoked').length;
    totalKeysEl.textContent = total;
    activeKeysEl.textContent = active;
    revokedKeysEl.textContent = revoked;
}

function renderKeys(keys) {
    const items = keysContainer.querySelectorAll('.key-card');
    items.forEach(el => el.remove());
    if (keys.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');
    keys.forEach((key, index) => {
        const card = document.createElement('div');
        card.className = `key-card fade-in-up flex flex-col md:flex-row md:items-center justify-between gap-3`;
        card.style.animationDelay = `${index * 0.04}s`;
        const left = document.createElement('div');
        left.className = 'flex-1 min-w-0';
        const nameRow = document.createElement('div');
        nameRow.className = 'flex items-center gap-3 flex-wrap';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'key-name';
        nameSpan.textContent = key.name;
        nameRow.appendChild(nameSpan);
        const isActive = key.status === 'active';
        const badge = document.createElement('span');
        badge.className = `status-badge ${isActive ? 'active' : 'revoked'}`;
        badge.innerHTML = `<span class="dot"></span> ${isActive ? 'Active' : 'Revoked'}`;
        nameRow.appendChild(badge);
        left.appendChild(nameRow);
        const metaRow = document.createElement('div');
        metaRow.className = 'flex items-center gap-4 mt-1.5 text-xs text-zinc-500';
        if (key.createdAt) {
            const d = key.createdAt.toDate ? key.createdAt.toDate() : new Date(key.createdAt);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const dateEl = document.createElement('span');
            dateEl.innerHTML = `<i class="ph ph-calendar-blank mr-1"></i> ${dateStr} at ${timeStr}`;
            metaRow.appendChild(dateEl);
        } else {
            const dateEl = document.createElement('span');
            dateEl.innerHTML = `<i class="ph ph-calendar-blank mr-1"></i> Recently created`;
            metaRow.appendChild(dateEl);
        }
        left.appendChild(metaRow);
        const keyValRow = document.createElement('div');
        keyValRow.className = 'key-value-wrapper mt-2';
        const keyText = document.createElement('span');
        keyText.className = 'key-value';
        const masked = key.key ? key.key.slice(0, 8) + '••••••••••••' : '••••••••';
        keyText.textContent = masked;
        keyValRow.appendChild(keyText);
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn-icon success';
        copyBtn.innerHTML = '<i class="ph ph-copy"></i>';
        copyBtn.title = 'Copy key';
        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (key.key) {
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
        actions.className = 'flex items-center gap-1 flex-shrink-0 mt-2 md:mt-0';
        const toggleBtn = document.createElement('button');
        toggleBtn.className = `btn-icon ${isActive ? '' : 'text-primary'}`;
        toggleBtn.innerHTML = `<i class="ph-bold ${isActive ? 'ph-toggle-right' : 'ph-toggle-left'}"></i>`;
        toggleBtn.title = isActive ? 'Revoke' : 'Activate';
        toggleBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newStatus = isActive ? 'revoked' : 'active';
            const action = newStatus === 'active' ? 'activated' : 'revoked';
            try {
                await updateDoc(doc(db, 'apiKeys', key.id), { status: newStatus });
                showToast(`Key "${key.name}" ${action} successfully!`, 3000, 'success');
                loadKeys();
            } catch (error) {
                console.error(error);
                showToast(`Failed to ${action} key.`, 3500, 'error');
            }
        });
        actions.appendChild(toggleBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon danger';
        deleteBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
        deleteBtn.title = 'Delete permanently';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Delete key "${key.name}" permanently? This action cannot be undone.`)) {
                try {
                    await deleteApiKey(key.id);
                    showToast(`Key "${key.name}" deleted permanently.`, 3000, 'success');
                    loadKeys();
                } catch (error) {
                    console.error(error);
                    showToast('Failed to delete key.', 3500, 'error');
                }
            }
        });
        actions.appendChild(deleteBtn);
        card.appendChild(actions);
        keysContainer.appendChild(card);
    });
}

addDomainBtn.addEventListener('click', () => {
    const isHidden = addDomainForm.classList.contains('hidden');
    addDomainForm.classList.toggle('hidden');
    if (isHidden) {
        addDomainForm.classList.remove('slide-down');
        void addDomainForm.offsetWidth;
        addDomainForm.classList.add('slide-down');
        domainInput.value = '';
        domainInput.focus();
    }
});

cancelDomainBtn.addEventListener('click', () => {
    addDomainForm.classList.add('hidden');
});

saveDomainBtn.addEventListener('click', async () => {
    let domain = domainInput.value.trim();
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
        await addDomain(currentUser.uid, domain);
        showToast(`Domain "${domain}" added successfully!`, 3500, 'success');
        addDomainForm.classList.add('hidden');
        loadDomains();
    } catch (error) {
        console.error(error);
        if (error.message === 'Domain already exists') {
            showToast(`Domain "${domain}" already exists.`, 3000, 'warning');
        } else if (error.message === 'Maximum 10 domains allowed') {
            showToast('Maximum 10 domains allowed. Remove some first.', 3500, 'warning');
        } else {
            showToast('Failed to add domain. Please try again.', 3500, 'error');
        }
    }
});

domainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveDomainBtn.click();
});

async function loadDomains() {
    if (!currentUser) return;
    try {
        const domains = await getDomains(currentUser.uid);
        renderDomains(domains);
        updateDomainStats(domains);
    } catch (error) {
        console.error(error);
        showToast('Failed to load domains. Please refresh the page.', 3500, 'error');
    }
}

function updateDomainStats(domains) {
    const total = domains.length;
    totalDomainsEl.textContent = `${total}/${MAX_DOMAINS}`;
    domainLimitBadge.textContent = `${total} / ${MAX_DOMAINS} used`;
    domainLimitBadge.className = 'domain-limit-badge';
    if (total >= MAX_DOMAINS) {
        domainLimitBadge.classList.add('danger');
    } else if (total >= MAX_DOMAINS - 2) {
        domainLimitBadge.classList.add('warning');
    }
}

function renderDomains(domains) {
    const items = domainsContainer.querySelectorAll('.domain-card');
    items.forEach(el => el.remove());
    if (domains.length === 0) {
        domainsEmptyState.classList.remove('hidden');
        return;
    }
    domainsEmptyState.classList.add('hidden');
    domains.forEach((domain, index) => {
        const card = document.createElement('div');
        card.className = `domain-card fade-in-up flex flex-col md:flex-row md:items-center justify-between gap-3`;
        card.style.animationDelay = `${index * 0.04}s`;
        const left = document.createElement('div');
        left.className = 'flex-1 min-w-0';
        const nameRow = document.createElement('div');
        nameRow.className = 'flex items-center gap-3 flex-wrap';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'domain-name';
        nameSpan.textContent = domain.domain;
        nameRow.appendChild(nameSpan);
        const isActive = domain.status === 'active';
        const badge = document.createElement('span');
        badge.className = `status-badge ${isActive ? 'active' : 'inactive'}`;
        badge.innerHTML = `<span class="dot"></span> ${isActive ? 'Active' : 'Inactive'}`;
        nameRow.appendChild(badge);
        left.appendChild(nameRow);
        const metaRow = document.createElement('div');
        metaRow.className = 'flex items-center gap-4 mt-1.5 text-xs text-zinc-500';
        if (domain.createdAt) {
            const d = domain.createdAt.toDate ? domain.createdAt.toDate() : new Date(domain.createdAt);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const dateEl = document.createElement('span');
            dateEl.innerHTML = `<i class="ph ph-calendar-blank mr-1"></i> Added ${dateStr}`;
            metaRow.appendChild(dateEl);
        } else {
            const dateEl = document.createElement('span');
            dateEl.innerHTML = `<i class="ph ph-calendar-blank mr-1"></i> Recently added`;
            metaRow.appendChild(dateEl);
        }
        left.appendChild(metaRow);
        card.appendChild(left);
        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-1 flex-shrink-0 mt-2 md:mt-0';
        const toggleBtn = document.createElement('button');
        toggleBtn.className = `btn-icon ${isActive ? '' : 'text-primary'}`;
        toggleBtn.innerHTML = `<i class="ph-bold ${isActive ? 'ph-toggle-right' : 'ph-toggle-left'}"></i>`;
        toggleBtn.title = isActive ? 'Deactivate' : 'Activate';
        toggleBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const action = isActive ? 'deactivated' : 'activated';
            try {
                await toggleDomainStatus(domain.id, domain.status);
                showToast(`Domain "${domain.domain}" ${action}.`, 3000, 'success');
                loadDomains();
            } catch (error) {
                console.error(error);
                showToast(`Failed to ${action} domain.`, 3500, 'error');
            }
        });
        actions.appendChild(toggleBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon danger';
        deleteBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
        deleteBtn.title = 'Remove domain';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Remove domain "${domain.domain}"?`)) {
                try {
                    await deleteDomain(domain.id);
                    showToast(`Domain "${domain.domain}" removed.`, 3000, 'success');
                    loadDomains();
                } catch (error) {
                    console.error(error);
                    showToast('Failed to remove domain.', 3500, 'error');
                }
            }
        });
        actions.appendChild(deleteBtn);
        card.appendChild(actions);
        domainsContainer.appendChild(card);
    });
}

toggleGroqBtn.addEventListener('click', () => {
    const input = document.getElementById('groqApiInput');
    const icon = toggleGroqBtn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'ph-bold ph-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'ph-bold ph-eye';
    }
});

async function loadGroqKey() {
    if (!currentUser) return;
    try {
        const key = await getGroqApiKey(currentUser.uid);
        if (key) {
            groqInput.value = key;
            groqStatus.textContent = '✅ Key saved';
            groqStatus.style.color = '#34d399';
            deleteGroqBtn.classList.remove('hidden');
        } else {
            groqInput.value = '';
            groqStatus.textContent = 'No key saved';
            groqStatus.style.color = '#71717a';
            deleteGroqBtn.classList.add('hidden');
        }
    } catch (error) {
        console.error(error);
        groqStatus.textContent = 'Failed to load key';
        groqStatus.style.color = '#fb7185';
    }
}

saveGroqBtn.addEventListener('click', async () => {
    const key = groqInput.value.trim();
    if (!key) {
        showToast('Please enter a Groq API key.', 3000, 'warning');
        return;
    }
    try {
        await saveGroqApiKey(currentUser.uid, key);
        showToast('Groq API key saved successfully!', 3500, 'success');
        groqStatus.textContent = '✅ Key saved';
        groqStatus.style.color = '#34d399';
        deleteGroqBtn.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        showToast('Failed to save key.', 3500, 'error');
    }
});

deleteGroqBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete your Groq API key?')) return;
    try {
        await deleteGroqApiKey(currentUser.uid);
        groqInput.value = '';
        groqStatus.textContent = 'No key saved';
        groqStatus.style.color = '#71717a';
        deleteGroqBtn.classList.add('hidden');
        showToast('Groq API key deleted.', 3000, 'success');
    } catch (error) {
        console.error(error);
        showToast('Failed to delete key.', 3500, 'error');
    }
});