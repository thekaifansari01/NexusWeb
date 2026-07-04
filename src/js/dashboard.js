// dashboard.js
import { observeAuthState, signOutUser } from "./modules/auth.js";
import { showToast } from "./modules/ui.js";
import {
    getApiKeys, deleteApiKey,
    getDomains, addDomain, deleteDomain, toggleDomainStatus,
    saveGroqApiKey, getGroqApiKey, deleteGroqApiKey,
    getUsageHistory, getDailyUsageStats
} from "./modules/firestore.js";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "./config/firebase.js";

const sidebarAvatar = document.getElementById('sidebarAvatar');
const sidebarName = document.getElementById('sidebarName');
const sidebarEmail = document.getElementById('sidebarEmail');
const sidebarSignOut = document.getElementById('sidebarSignOut');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('aside');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
const keysContainer = document.getElementById('keysContainer');
const overviewKeysContainer = document.getElementById('overviewKeysContainer');
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
const activeDomainsEl = document.getElementById('activeDomains');
const inactiveDomainsEl = document.getElementById('inactiveDomains');
const domainLimitBadge = document.getElementById('domainLimitBadge');
const groqInput = document.getElementById('groqApiInput');
const groqStatus = document.getElementById('groqKeyStatus');
const saveGroqBtn = document.getElementById('saveGroqBtn');
const deleteGroqBtn = document.getElementById('deleteGroqBtn');
const cancelGroqBtn = document.getElementById('cancelGroqBtn');
const toggleGroqBtn = document.getElementById('toggleGroqVisibility');
const totalRequestsEl = document.getElementById('totalRequests');
const totalTokensEl = document.getElementById('totalTokens');
const successRateEl = document.getElementById('successRate');
const usageHistoryContainer = document.getElementById('usageHistoryContainer');
const welcomeMessageEl = document.getElementById('welcomeMessage');
const keysTotalEl = document.getElementById('keysTotal');
const keysActiveEl = document.getElementById('keysActive');
const keysRevokedEl = document.getElementById('keysRevoked');
const domainsTotalEl = document.getElementById('domainsTotal');
const domainsActiveEl = document.getElementById('domainsActive');
const domainsInactiveEl = document.getElementById('domainsInactive');

const captchaModal = document.getElementById('captchaModal');
const captchaModalTitle = document.getElementById('captchaModalTitle');
const captchaModalDesc = document.getElementById('captchaModalDesc');
const captchaModalContainer = document.getElementById('captchaModalContainer');
const captchaModalConfirm = document.getElementById('captchaModalConfirm');
const captchaModalCancel = document.getElementById('captchaModalCancel');

let currentUser = null;
const MAX_DOMAINS = 10;
let captchaToken = null;
let turnstileWidgetId = null;
let turnstileRetryTimeout = null;
let pendingAction = null;
let pendingActionData = null;

function switchTab(tabId, updateHistory = true) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (!btn) return;
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tabContents.forEach(tab => tab.classList.add('hidden'));
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) activeTab.classList.remove('hidden');
    breadcrumbCurrent.textContent = btn.textContent.trim();
    if (window.innerWidth < 768 && sidebar) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('absolute', 'z-50', 'h-full', 'w-64');
    }
    if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.set('tab', tabId);
        url.searchParams.delete('action');
        window.history.pushState({ tab: tabId }, '', url);
    }
}

function openCreateKeyModal(updateHistory = true) {
    createKeyForm.classList.remove('hidden');
    createKeyForm.classList.remove('slide-down');
    void createKeyForm.offsetWidth;
    createKeyForm.classList.add('slide-down');
    keyNameInput.value = '';
    keyNameInput.focus();
    setTimeout(renderTurnstile, 200);
    if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.set('action', 'create-key');
        window.history.pushState({ tab: 'api-keys', action: 'create-key' }, '', url);
    }
}

function closeCreateKeyModal(updateHistory = true) {
    createKeyForm.classList.add('hidden');
    resetTurnstile();
    if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.delete('action');
        window.history.pushState({ tab: 'api-keys' }, '', url);
    }
}

function openAddDomainModal(updateHistory = true) {
    addDomainForm.classList.remove('hidden');
    addDomainForm.classList.remove('slide-down');
    void addDomainForm.offsetWidth;
    addDomainForm.classList.add('slide-down');
    domainInput.value = '';
    domainInput.focus();
    if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.set('action', 'add-domain');
        window.history.pushState({ tab: 'domains', action: 'add-domain' }, '', url);
    }
}

function closeAddDomainModal(updateHistory = true) {
    addDomainForm.classList.add('hidden');
    if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.delete('action');
        window.history.pushState({ tab: 'domains' }, '', url);
    }
}

function handleURLState() {
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

window.addEventListener('popstate', handleURLState);

tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = btn.getAttribute('data-tab');
        switchTab(tabId, true);
    });
});

if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
        if (!sidebar.classList.contains('hidden')) {
            sidebar.classList.add('absolute', 'z-50', 'h-full', 'w-64');
        } else {
            sidebar.classList.remove('absolute', 'z-50', 'h-full', 'w-64');
        }
    });
}

function renderTurnstile(containerId = 'turnstile-container', callback = null) {
    const container = document.getElementById(containerId);
    if (!container || !window.turnstile) return;
    if (turnstileWidgetId !== null && turnstileWidgetId !== undefined) {
        try { turnstile.remove(turnstileWidgetId); } catch (_) {}
        turnstileWidgetId = null;
    }
    container.innerHTML = '';
    try {
        turnstileWidgetId = turnstile.render(container, {
            sitekey: '0x4AAAAAADttl-ZBYJPZI8zP',
            callback: function(token) {
                captchaToken = token;
                if (containerId === 'turnstile-container') {
                    saveKeyBtn.classList.remove('hidden');
                } else if (containerId === 'captchaModalContainer') {
                    captchaModalConfirm.classList.remove('hidden');
                }
                if (callback) callback(token);
            },
            'expired-callback': function() {
                captchaToken = null;
                if (containerId === 'turnstile-container') {
                    saveKeyBtn.classList.add('hidden');
                } else if (containerId === 'captchaModalContainer') {
                    captchaModalConfirm.classList.add('hidden');
                }
            },
            'error-callback': function() {
                captchaToken = null;
                if (containerId === 'turnstile-container') {
                    saveKeyBtn.classList.add('hidden');
                } else if (containerId === 'captchaModalContainer') {
                    captchaModalConfirm.classList.add('hidden');
                }
                if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
                turnstileRetryTimeout = setTimeout(() => renderTurnstile(containerId, callback), 2000);
            }
        });
    } catch (e) {
        if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
        turnstileRetryTimeout = setTimeout(() => renderTurnstile(containerId, callback), 2000);
    }
}

function resetTurnstile() {
    try {
        if (turnstileWidgetId !== null && turnstileWidgetId !== undefined && window.turnstile) {
            turnstile.remove(turnstileWidgetId);
            turnstileWidgetId = null;
        }
    } catch (e) {}
    captchaToken = null;
    saveKeyBtn.classList.add('hidden');
    captchaModalConfirm.classList.add('hidden');
    if (turnstileRetryTimeout) {
        clearTimeout(turnstileRetryTimeout);
        turnstileRetryTimeout = null;
    }
}

function showCaptchaModal(title, desc, action, data = null) {
    captchaModalTitle.textContent = title;
    captchaModalDesc.textContent = desc;
    pendingAction = action;
    pendingActionData = data;
    captchaModal.classList.remove('hidden');
    captchaModalConfirm.classList.add('hidden');
    setTimeout(() => renderTurnstile('captchaModalContainer'), 200);
}

function closeCaptchaModal() {
    captchaModal.classList.add('hidden');
    resetTurnstile();
    pendingAction = null;
    pendingActionData = null;
}

captchaModalCancel.addEventListener('click', closeCaptchaModal);

captchaModalConfirm.addEventListener('click', async () => {
    if (!captchaToken) {
        showToast('Please complete the CAPTCHA.', 3000, 'warning');
        return;
    }
    if (!pendingAction) {
        closeCaptchaModal();
        return;
    }
    try {
        await pendingAction(pendingActionData);
        closeCaptchaModal();
    } catch (error) {
        showToast(error.message || 'Action failed.', 3500, 'error');
        closeCaptchaModal();
    }
});

observeAuthState((user) => {
    if (!user) {
        window.location.href = '/login';
        return;
    }
    currentUser = user;
    if (sidebarAvatar) sidebarAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=User&background=a855f7&color=fff&size=40';
    if (sidebarEmail) sidebarEmail.textContent = user.email || 'user@example.com';
    if (sidebarName) sidebarName.textContent = user.displayName || user.email.split('@')[0] || 'User';
    if (welcomeMessageEl) {
        welcomeMessageEl.textContent = `Welcome back, ${user.displayName || user.email.split('@')[0] || 'User'}!`;
    }
    handleURLState();
    loadKeys();
    loadDomains();
    loadGroqKey();
    loadUsage();
});

if (sidebarSignOut) {
    sidebarSignOut.addEventListener('click', async () => {
        await signOutUser();
    });
}

createKeyBtn.addEventListener('click', () => {
    if (createKeyForm.classList.contains('hidden')) openCreateKeyModal(true);
    else closeCreateKeyModal(true);
});

cancelKeyBtn.addEventListener('click', () => closeCreateKeyModal(true));

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
            credentials: 'include',
            body: JSON.stringify({
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
        closeCreateKeyModal(true);
        loadKeys();
    } catch (error) {
        showToast('Network error. Please try again.', 3500, 'error');
    }
});

keyNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !saveKeyBtn.classList.contains('hidden')) saveKeyBtn.click();
});

async function loadKeys() {
    if (!currentUser) return;
    try {
        const keys = await getApiKeys(currentUser.uid);
        renderKeys(keys);
        renderOverviewKeys(keys);
        updateStats(keys);
    } catch (error) {
        showToast('Failed to load keys. Please refresh the page.', 3500, 'error');
    }
}

function updateStats(keys) {
    const total = keys.length;
    const active = keys.filter(k => k.status === 'active').length;
    const revoked = keys.filter(k => k.status === 'revoked').length;
    if (totalKeysEl) totalKeysEl.textContent = total;
    if (activeKeysEl) activeKeysEl.textContent = active;
    if (revokedKeysEl) revokedKeysEl.textContent = revoked;
    if (keysTotalEl) keysTotalEl.textContent = total;
    if (keysActiveEl) keysActiveEl.textContent = active;
    if (keysRevokedEl) keysRevokedEl.textContent = revoked;
}

function renderOverviewKeys(keys) {
    if (!overviewKeysContainer) return;
    overviewKeysContainer.innerHTML = '';
    if (keys.length === 0) {
        overviewKeysContainer.innerHTML = '<p class="text-sm text-zinc-500">No keys created yet.</p>';
        return;
    }
    keys.slice(0, 3).forEach(key => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5';
        const isActive = key.status === 'active';
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}"></div>
                <span class="text-sm text-white font-medium">${key.name}</span>
            </div>
            <span class="text-xs font-mono text-zinc-500">${key.key ? key.key.slice(0, 8) + '...' : 'N/A'}</span>
        `;
        overviewKeysContainer.appendChild(div);
    });
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
            metaRow.innerHTML = `<span><i class="ph ph-calendar-blank mr-1"></i> ${dateStr} at ${timeStr}</span>`;
        } else {
            metaRow.innerHTML = `<span><i class="ph ph-calendar-blank mr-1"></i> Recently created</span>`;
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
        deleteBtn.className = 'btn-icon danger';
        deleteBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
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
        keysContainer.appendChild(card);
    });
}

addDomainBtn.addEventListener('click', () => {
    if (addDomainForm.classList.contains('hidden')) openAddDomainModal(true);
    else closeAddDomainModal(true);
});

cancelDomainBtn.addEventListener('click', () => closeAddDomainModal(true));

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
        showToast('Failed to load domains.', 3500, 'error');
    }
}

function updateDomainStats(domains) {
    const total = domains.length;
    const active = domains.filter(d => d.status === 'active').length;
    const inactive = domains.filter(d => d.status === 'inactive').length;
    if (totalDomainsEl) totalDomainsEl.textContent = `${total}/${MAX_DOMAINS}`;
    if (activeDomainsEl) activeDomainsEl.textContent = active;
    if (inactiveDomainsEl) inactiveDomainsEl.textContent = inactive;
    if (domainsTotalEl) domainsTotalEl.textContent = `${total}/${MAX_DOMAINS}`;
    if (domainsActiveEl) domainsActiveEl.textContent = active;
    if (domainsInactiveEl) domainsInactiveEl.textContent = inactive;
    if (domainLimitBadge) {
        domainLimitBadge.textContent = `${total} / ${MAX_DOMAINS} used`;
        domainLimitBadge.className = 'domain-limit-badge';
        if (total >= MAX_DOMAINS) {
            domainLimitBadge.classList.add('danger');
        } else if (total >= MAX_DOMAINS - 2) {
            domainLimitBadge.classList.add('warning');
        }
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
            metaRow.innerHTML = `<span><i class="ph ph-calendar-blank mr-1"></i> Added ${dateStr}</span>`;
        } else {
            metaRow.innerHTML = `<span><i class="ph ph-calendar-blank mr-1"></i> Recently added</span>`;
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
            showCaptchaModal(
                isActive ? 'Deactivate Domain' : 'Activate Domain',
                isActive ? `Are you sure you want to deactivate "${domain.domain}"?` : `Are you sure you want to activate "${domain.domain}"?`,
                async () => {
                    const action = isActive ? 'deactivated' : 'activated';
                    await toggleDomainStatus(domain.id, domain.status);
                    showToast(`Domain "${domain.domain}" ${action}.`, 3000, 'success');
                    loadDomains();
                }
            );
        });
        actions.appendChild(toggleBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon danger';
        deleteBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
        deleteBtn.title = 'Remove domain';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            showCaptchaModal(
                'Remove Domain',
                `Are you sure you want to remove "${domain.domain}"?`,
                async () => {
                    await deleteDomain(domain.id);
                    showToast(`Domain "${domain.domain}" removed.`, 3000, 'success');
                    loadDomains();
                }
            );
        });
        actions.appendChild(deleteBtn);
        card.appendChild(actions);
        domainsContainer.appendChild(card);
    });
}

if (toggleGroqBtn) {
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
}

function resetGroqForm() {
    saveGroqBtn.classList.add('hidden');
    cancelGroqBtn.classList.add('hidden');
}

function showGroqSaveCancel() {
    saveGroqBtn.classList.remove('hidden');
    cancelGroqBtn.classList.remove('hidden');
}

if (groqInput) {
    groqInput.addEventListener('input', () => {
        const currentVal = groqInput.value.trim();
        if (currentVal.length > 0) {
            showGroqSaveCancel();
        } else {
            resetGroqForm();
        }
    });
}

if (cancelGroqBtn) {
    cancelGroqBtn.addEventListener('click', () => {
        groqInput.value = '';
        resetGroqForm();
        loadGroqKey();
    });
}

async function loadGroqKey() {
    if (!currentUser) return;
    try {
        const keyExists = await getGroqApiKey(currentUser.uid);
        if (keyExists) {
            groqInput.value = '';
            groqStatus.textContent = '✅ Key saved';
            groqStatus.style.color = '#34d399';
            deleteGroqBtn.classList.remove('hidden');
            resetGroqForm();
        } else {
            groqInput.value = '';
            groqStatus.textContent = 'No key saved';
            groqStatus.style.color = '#71717a';
            deleteGroqBtn.classList.add('hidden');
            resetGroqForm();
        }
    } catch (error) {
        groqStatus.textContent = 'Failed to load key';
        groqStatus.style.color = '#fb7185';
        deleteGroqBtn.classList.add('hidden');
        resetGroqForm();
    }
}

if (saveGroqBtn) {
    saveGroqBtn.addEventListener('click', async () => {
        const key = groqInput.value.trim();
        if (!key) {
            showToast('Please enter a Groq API key.', 3000, 'warning');
            return;
        }
        showCaptchaModal(
            'Save Groq API Key',
            'Are you sure you want to save this Groq API key?',
            async () => {
                await saveGroqApiKey(currentUser.uid, key);
                showToast('Groq API key saved successfully!', 3500, 'success');
                groqInput.value = '';
                groqStatus.textContent = '✅ Key saved';
                groqStatus.style.color = '#34d399';
                deleteGroqBtn.classList.remove('hidden');
                resetGroqForm();
            }
        );
    });
}

if (deleteGroqBtn) {
    deleteGroqBtn.addEventListener('click', async () => {
        showCaptchaModal(
            'Delete Groq API Key',
            'Are you sure you want to delete your Groq API key?',
            async () => {
                await deleteGroqApiKey(currentUser.uid);
                groqInput.value = '';
                groqStatus.textContent = 'No key saved';
                groqStatus.style.color = '#71717a';
                deleteGroqBtn.classList.add('hidden');
                resetGroqForm();
                showToast('Groq API key deleted.', 3000, 'success');
            }
        );
    });
}

async function loadUsage() {
    if (!currentUser) return;
    try {
        const history = await getUsageHistory(currentUser.uid, 10);
        if (history.length === 0) {
            usageHistoryContainer.innerHTML = '<div class="text-sm text-zinc-500 text-center py-4">No usage data available yet.</div>';
        } else {
            usageHistoryContainer.innerHTML = '';
            history.forEach((log, index) => {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 fade-in-up';
                div.style.animationDelay = `${index * 0.04}s`;
                const date = log.timestamp?.toDate?.() || new Date();
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}"></div>
                        <span class="text-sm text-zinc-300 font-medium">${log.model || 'Unknown'}</span>
                        <span class="text-xs text-zinc-500 font-mono">${dateStr}</span>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-zinc-400">
                        <span>${log.totalTokens || 0} tokens</span>
                        <span class="font-bold ${log.status === 'success' ? 'text-emerald-400' : 'text-red-400'}">${log.status}</span>
                    </div>
                `;
                usageHistoryContainer.appendChild(div);
            });
        }
        const stats = await getDailyUsageStats(currentUser.uid);
        if (totalRequestsEl) totalRequestsEl.textContent = stats.totalRequests || 0;
        if (totalTokensEl) totalTokensEl.textContent = stats.totalTokens || 0;
        if (history.length > 0 && successRateEl) {
            const successCount = history.filter(h => h.status === 'success').length;
            const rate = Math.round((successCount / history.length) * 100);
            successRateEl.textContent = rate + '%';
        } else if (successRateEl) {
            successRateEl.textContent = 'N/A';
        }
    } catch (error) {
        console.error("Usage load error:", error);
        if (usageHistoryContainer) {
            usageHistoryContainer.innerHTML = 
                '<div class="text-sm text-red-400 text-center py-4">Failed to load usage data.</div>';
        }
    }
}