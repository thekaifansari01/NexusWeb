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
import {
    getAuth, reauthenticateWithCredential, updatePassword,
    EmailAuthProvider, reauthenticateWithPopup,
    GoogleAuthProvider, GithubAuthProvider, getIdToken
} from "firebase/auth";

const auth = getAuth();

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
const groqVaultStatusEl = document.querySelector('#tab-overview .stat-card:nth-child(3) .stat-number');

const captchaModal = document.getElementById('captchaModal');
const captchaModalTitle = document.getElementById('captchaModalTitle');
const captchaModalDesc = document.getElementById('captchaModalDesc');
const captchaModalContainer = document.getElementById('captchaModalContainer');
const captchaModalConfirm = document.getElementById('captchaModalConfirm');
const captchaModalCancel = document.getElementById('captchaModalCancel');

const settingsAvatar = document.getElementById('settingsAvatar');
const settingsName = document.getElementById('settingsName');
const settingsEmail = document.getElementById('settingsEmail');
const passwordChangeSection = document.getElementById('passwordChangeSection');
const socialAuthInfo = document.getElementById('socialAuthInfo');
const socialProvider = document.getElementById('socialProvider');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const updatePasswordBtn = document.getElementById('updatePasswordBtn');

const deleteAccountModal = document.getElementById('deleteAccountModal');
const deletePassword = document.getElementById('deletePassword');
const deleteSocialReauth = document.getElementById('deleteSocialReauth');
const deleteSocialProvider = document.getElementById('deleteSocialProvider');
const deleteSocialProviderName = document.getElementById('deleteSocialProviderName');
const deleteReauthSocialBtn = document.getElementById('deleteReauthSocialBtn');
const deleteTurnstileContainer = document.getElementById('deleteTurnstileContainer');
const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');

const statTotalRequests = document.getElementById('statTotalRequests');
const statTotalTokens = document.getElementById('statTotalTokens');
const statAvgResponse = document.getElementById('statAvgResponse');
const statSuccessRate = document.getElementById('statSuccessRate');
const statRequestsTrend = document.getElementById('statRequestsTrend');
const statTokensTrend = document.getElementById('statTokensTrend');
const requestChartCanvas = document.getElementById('requestChart');
const tokenChartCanvas = document.getElementById('tokenChart');
const modelChartCanvas = document.getElementById('modelChart');
const topDomainsContainer = document.getElementById('topDomainsContainer');
const busiestHoursContainer = document.getElementById('busiestHoursContainer');
const logsTableBody = document.getElementById('logsTableBody');
const logSearchInput = document.getElementById('logSearchInput');
const logCount = document.getElementById('logCount');
const rangeBtns = document.querySelectorAll('.range-btn');
const exportBtn = document.getElementById('exportBtn');

let requestChart = null;
let tokenChart = null;
let modelChart = null;
let currentRange = 30;
let allLogs = [];
let filteredLogs = [];

let currentUser = null;
const MAX_DOMAINS = 10;
let captchaToken = null;
let turnstileWidgetId = null;
let turnstileRetryTimeout = null;
let pendingAction = null;
let pendingActionData = null;

let deleteReauthToken = null;
let deleteCaptchaToken = null;
let deleteTurnstileWidgetId = null;
let isSocialUser = false;

function showSkeleton(containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (type === 'keys') {
        for (let i = 0; i < 3; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'key-card skeleton-card';
            skeleton.style.animationDelay = `${i * 0.05}s`;
            skeleton.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 flex-wrap">
                        <div class="skeleton skeleton-text" style="width: 120px; height: 20px;"></div>
                        <div class="skeleton skeleton-badge" style="width: 70px; height: 24px;"></div>
                    </div>
                    <div class="flex items-center gap-4 mt-1.5">
                        <div class="skeleton skeleton-text" style="width: 150px; height: 14px;"></div>
                    </div>
                    <div class="key-value-wrapper mt-2">
                        <div class="skeleton skeleton-text" style="width: 120px; height: 20px;"></div>
                        <div class="skeleton skeleton-icon" style="width: 32px; height: 32px; border-radius: 8px;"></div>
                    </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0 mt-2 md:mt-0">
                    <div class="skeleton skeleton-icon" style="width: 36px; height: 36px; border-radius: 10px;"></div>
                    <div class="skeleton skeleton-icon" style="width: 36px; height: 36px; border-radius: 10px;"></div>
                </div>
            `;
            container.appendChild(skeleton);
        }
    } else if (type === 'domains') {
        for (let i = 0; i < 3; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'domain-card skeleton-card';
            skeleton.style.animationDelay = `${i * 0.05}s`;
            skeleton.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 flex-wrap">
                        <div class="skeleton skeleton-text" style="width: 150px; height: 20px;"></div>
                        <div class="skeleton skeleton-badge" style="width: 70px; height: 24px;"></div>
                    </div>
                    <div class="flex items-center gap-4 mt-1.5">
                        <div class="skeleton skeleton-text" style="width: 120px; height: 14px;"></div>
                    </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0 mt-2 md:mt-0">
                    <div class="skeleton skeleton-icon" style="width: 36px; height: 36px; border-radius: 10px;"></div>
                    <div class="skeleton skeleton-icon" style="width: 36px; height: 36px; border-radius: 10px;"></div>
                </div>
            `;
            container.appendChild(skeleton);
        }
    } else if (type === 'overview') {
        for (let i = 0; i < 2; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5';
            skeleton.style.animationDelay = `${i * 0.05}s`;
            skeleton.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="skeleton skeleton-icon" style="width: 8px; height: 8px; border-radius: 50%;"></div>
                    <div class="skeleton skeleton-text" style="width: 100px; height: 16px;"></div>
                </div>
                <div class="skeleton skeleton-text" style="width: 60px; height: 14px;"></div>
            `;
            container.appendChild(skeleton);
        }
    } else if (type === 'usage') {
        for (let i = 0; i < 5; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5';
            skeleton.style.animationDelay = `${i * 0.05}s`;
            skeleton.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="skeleton skeleton-icon" style="width: 8px; height: 8px; border-radius: 50%;"></div>
                    <div class="skeleton skeleton-text" style="width: 80px; height: 16px;"></div>
                    <div class="skeleton skeleton-text" style="width: 100px; height: 14px;"></div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="skeleton skeleton-text" style="width: 60px; height: 14px;"></div>
                    <div class="skeleton skeleton-text" style="width: 50px; height: 14px;"></div>
                </div>
            `;
            container.appendChild(skeleton);
        }
    }
}

function hideSkeleton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const skeletons = container.querySelectorAll('.skeleton-card, .skeleton, .skeleton-text, .skeleton-badge, .skeleton-icon');
    skeletons.forEach(el => el.remove());
}

function showStatSkeletons() {
    const statElements = [
        totalKeysEl, activeKeysEl, revokedKeysEl,
        keysTotalEl, keysActiveEl, keysRevokedEl,
        totalDomainsEl, activeDomainsEl, inactiveDomainsEl,
        domainsTotalEl, domainsActiveEl, domainsInactiveEl,
        totalRequestsEl, totalTokensEl, successRateEl,
        domainLimitBadge
    ];
    statElements.forEach(el => {
        if (!el) return;
        if (el === domainLimitBadge) {
            el.className = 'domain-limit-badge';
            el.innerHTML = '<span class="skeleton skeleton-stat-sm"></span>';
        } else {
            el.innerHTML = '<span class="skeleton skeleton-stat"></span>';
        }
    });
}

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

function renderDeleteTurnstile() {
    const container = deleteTurnstileContainer;
    if (!container || !window.turnstile) return;
    if (deleteTurnstileWidgetId) {
        try { turnstile.remove(deleteTurnstileWidgetId); } catch (_) {}
        deleteTurnstileWidgetId = null;
    }
    container.innerHTML = '';
    try {
        deleteTurnstileWidgetId = turnstile.render(container, {
            sitekey: '0x4AAAAAADttl-ZBYJPZI8zP',
            callback: function(token) {
                deleteCaptchaToken = token;
                updateDeleteConfirmBtn();
            },
            'expired-callback': function() {
                deleteCaptchaToken = null;
                updateDeleteConfirmBtn();
            },
            'error-callback': function() {
                deleteCaptchaToken = null;
                updateDeleteConfirmBtn();
                if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
                turnstileRetryTimeout = setTimeout(renderDeleteTurnstile, 2000);
            }
        });
    } catch (e) {
        if (turnstileRetryTimeout) clearTimeout(turnstileRetryTimeout);
        turnstileRetryTimeout = setTimeout(renderDeleteTurnstile, 2000);
    }
}

function resetDeleteTurnstile() {
    try {
        if (deleteTurnstileWidgetId && window.turnstile) {
            turnstile.remove(deleteTurnstileWidgetId);
            deleteTurnstileWidgetId = null;
        }
    } catch (_) {}
    deleteCaptchaToken = null;
    if (turnstileRetryTimeout) {
        clearTimeout(turnstileRetryTimeout);
        turnstileRetryTimeout = null;
    }
}

function updateDeleteConfirmBtn() {
    deleteConfirmBtn.disabled = !deleteCaptchaToken;
}

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
    if (settingsAvatar) settingsAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=User&background=a855f7&color=fff&size=80';
    if (settingsName) settingsName.textContent = user.displayName || user.email.split('@')[0] || 'User';
    if (settingsEmail) settingsEmail.textContent = user.email || 'user@example.com';

    const providerData = user.providerData || [];
    const isPassword = providerData.some(p => p.providerId === 'password');
    const socialProviderData = providerData.find(p => p.providerId !== 'password');
    isSocialUser = !isPassword && !!socialProviderData;

    if (isPassword) {
        if (passwordChangeSection) passwordChangeSection.classList.remove('hidden');
        if (socialAuthInfo) socialAuthInfo.classList.add('hidden');
        if (deletePassword && deletePassword.parentElement) {
            deletePassword.parentElement.classList.remove('hidden');
        }
        if (deleteSocialReauth) deleteSocialReauth.classList.add('hidden');
    } else {
        if (passwordChangeSection) passwordChangeSection.classList.add('hidden');
        if (socialAuthInfo) socialAuthInfo.classList.remove('hidden');
        if (socialProviderData) {
            const provName = socialProviderData.providerId === 'google.com' ? 'Google' : 'GitHub';
            if (socialProvider) socialProvider.textContent = provName;
            if (deleteSocialProvider) deleteSocialProvider.textContent = provName;
            if (deleteSocialProviderName) deleteSocialProviderName.textContent = provName;
        }
        if (deletePassword && deletePassword.parentElement) {
            deletePassword.parentElement.classList.add('hidden');
        }
        if (deleteSocialReauth) deleteSocialReauth.classList.remove('hidden');
    }

    handleURLState();
    loadKeys();
    loadDomains();
    loadGroqKey();
    loadUsage();

    if (deleteAccountModal) {
        deleteAccountModal.classList.add('hidden');
        deleteAccountModal.style.display = 'none';
    }
});

function renderStats(totals, daily) {
    if (statTotalRequests) statTotalRequests.textContent = totals.totalRequests || 0;
    if (statTotalTokens) statTotalTokens.textContent = (totals.totalTokens || 0).toLocaleString();
    if (daily && daily.length > 0) {
        const last = daily[daily.length - 1];
        const prev = daily.length > 1 ? daily[daily.length - 2] : { requests: 0, tokens: 0 };
        const reqDiff = last.requests - prev.requests;
        const tokDiff = last.tokens - prev.tokens;
        if (statRequestsTrend) {
            statRequestsTrend.textContent = reqDiff >= 0 ? `↑ +${reqDiff} from yesterday` : `↓ ${reqDiff} from yesterday`;
            statRequestsTrend.className = `text-xs mt-0.5 ${reqDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`;
        }
        if (statTokensTrend) {
            statTokensTrend.textContent = tokDiff >= 0 ? `↑ +${tokDiff} from yesterday` : `↓ ${tokDiff} from yesterday`;
            statTokensTrend.className = `text-xs mt-0.5 ${tokDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`;
        }
    } else {
        if (statRequestsTrend) { statRequestsTrend.textContent = '—'; statRequestsTrend.className = 'text-xs mt-0.5 text-zinc-500'; }
        if (statTokensTrend) { statTokensTrend.textContent = '—'; statTokensTrend.className = 'text-xs mt-0.5 text-zinc-500'; }
    }
    if (statAvgResponse) statAvgResponse.textContent = '—';
    if (statSuccessRate) statSuccessRate.textContent = '—';
}

function renderCharts(daily) {
    const labels = daily.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const requestData = daily.map(d => d.requests);
    const tokenData = daily.map(d => d.tokens);
    const ctx1 = requestChartCanvas?.getContext('2d');
    const ctx2 = tokenChartCanvas?.getContext('2d');
    if (requestChart) { requestChart.destroy(); requestChart = null; }
    if (tokenChart) { tokenChart.destroy(); tokenChart = null; }
    if (ctx1) {
        requestChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Requests',
                    data: requestData,
                    backgroundColor: 'rgba(168, 85, 247, 0.4)',
                    borderColor: '#a855f7',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#71717a' } },
                    x: { grid: { display: false }, ticks: { color: '#71717a', maxRotation: 45 } }
                }
            }
        });
    }
    if (ctx2) {
        tokenChart = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tokens',
                    data: tokenData,
                    borderColor: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#fbbf24',
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#71717a' } },
                    x: { grid: { display: false }, ticks: { color: '#71717a', maxRotation: 45 } }
                }
            }
        });
    }
}

function renderBreakdowns(models, domains, hours) {
    const ctx3 = modelChartCanvas?.getContext('2d');
    if (modelChart) { modelChart.destroy(); modelChart = null; }
    if (ctx3 && models && models.length > 0) {
        const colors = ['#a855f7', '#34d399', '#fbbf24', '#60a5fa', '#f472b6'];
        modelChart = new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: models.map(m => m.name),
                datasets: [{
                    data: models.map(m => m.count),
                    backgroundColor: colors.slice(0, models.length),
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.2)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#a1a1aa', font: { size: 9 }, boxWidth: 10, padding: 6 } }
                },
                cutout: '60%'
            }
        });
    } else if (ctx3) {
        modelChart = new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{ data: [1], backgroundColor: ['#2a2a2e'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
    if (topDomainsContainer) {
        topDomainsContainer.innerHTML = '';
        if (domains && domains.length > 0) {
            const sorted = domains.sort((a, b) => b.count - a.count).slice(0, 5);
            sorted.forEach(d => {
                const div = document.createElement('div');
                div.className = 'domain-item';
                div.innerHTML = `<span>${d.name}</span><span class="count">${d.count}</span>`;
                topDomainsContainer.appendChild(div);
            });
        } else {
            topDomainsContainer.innerHTML = '<div class="text-sm text-zinc-500 text-center py-4">No domains</div>';
        }
    }
    if (busiestHoursContainer) {
        busiestHoursContainer.innerHTML = '';
        if (hours && hours.length > 0) {
            const sorted = hours.sort((a, b) => b.count - a.count).slice(0, 5);
            sorted.forEach(h => {
                const div = document.createElement('div');
                div.className = 'hour-item';
                const hourLabel = `${String(h.hour).padStart(2, '0')}:00`;
                div.innerHTML = `<span>${hourLabel}</span><span class="count">${h.count}</span>`;
                busiestHoursContainer.appendChild(div);
            });
        } else {
            busiestHoursContainer.innerHTML = '<div class="text-sm text-zinc-500 text-center py-4">No data</div>';
        }
    }
}

function renderTable(logs) {
    if (!logsTableBody) return;
    if (!logs || logs.length === 0) {
        logsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-zinc-500 py-6 text-sm">No usage data available yet.</td></tr>';
        return;
    }
    logsTableBody.innerHTML = '';
    logs.slice(0, 50).forEach(log => {
        const tr = document.createElement('tr');
        const date = log.timestamp ? new Date(log.timestamp).toLocaleString() : '—';
        const status = log.status || 'success';
        const statusClass = status === 'success' ? 'active' : 'revoked';
        tr.innerHTML = `
            <td class="py-2 px-3 text-zinc-400 text-xs">${date}</td>
            <td class="py-2 px-3 text-zinc-300 text-xs">${log.model || 'unknown'}</td>
            <td class="py-2 px-3 text-zinc-400 text-xs">${log.totalTokens || 0}</td>
            <td class="py-2 px-3"><span class="status-badge ${statusClass} text-[10px]">${status}</span></td>
            <td class="py-2 px-3 text-zinc-400 text-xs font-mono">${log.domain || '—'}</td>
        `;
        logsTableBody.appendChild(tr);
    });
}

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
    showStatSkeletons();
    showSkeleton('keysContainer', 'keys');
    showSkeleton('overviewKeysContainer', 'overview');
    emptyState.classList.add('hidden');
    try {
        const keys = await getApiKeys(currentUser.uid);
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
    if (totalKeysEl) totalKeysEl.textContent = total;
    if (activeKeysEl) activeKeysEl.textContent = active;
    if (revokedKeysEl) revokedKeysEl.textContent = revoked;
    if (keysTotalEl) keysTotalEl.textContent = total;
    if (keysActiveEl) keysActiveEl.textContent = active;
    if (keysRevokedEl) keysRevokedEl.textContent = revoked;
}

function renderOverviewKeys(keys) {
    if (!overviewKeysContainer) return;
    hideSkeleton('overviewKeysContainer');
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
    hideSkeleton('keysContainer');
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
    showStatSkeletons();
    showSkeleton('domainsContainer', 'domains');
    domainsEmptyState.classList.add('hidden');
    try {
        const domains = await getDomains(currentUser.uid);
        hideSkeleton('domainsContainer');
        renderDomains(domains);
        updateDomainStats(domains);
    } catch (error) {
        hideSkeleton('domainsContainer');
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
    hideSkeleton('domainsContainer');
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
            if (groqVaultStatusEl) {
                groqVaultStatusEl.textContent = '🔒 Encrypted';
                groqVaultStatusEl.className = 'stat-number text-emerald-400 text-xl font-bold';
            }
        } else {
            groqInput.value = '';
            groqStatus.textContent = 'No key saved';
            groqStatus.style.color = '#71717a';
            deleteGroqBtn.classList.add('hidden');
            resetGroqForm();
            if (groqVaultStatusEl) {
                groqVaultStatusEl.textContent = '⚠️ Not Configured';
                groqVaultStatusEl.className = 'stat-number text-amber-400 text-xl font-bold';
            }
        }
    } catch (error) {
        groqStatus.textContent = 'Failed to load key';
        groqStatus.style.color = '#fb7185';
        deleteGroqBtn.classList.add('hidden');
        resetGroqForm();
        if (groqVaultStatusEl) {
            groqVaultStatusEl.textContent = '❌ Error';
            groqVaultStatusEl.className = 'stat-number text-red-400 text-xl font-bold';
        }
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
                loadGroqKey();
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
                loadGroqKey();
            }
        );
    });
}

async function loadUsage(range = currentRange) {
    if (!currentUser) return;
    showStatSkeletons();
    showSkeleton('usageHistoryContainer', 'usage');
    if (topDomainsContainer) topDomainsContainer.innerHTML = '<div class="text-sm text-zinc-500 text-center py-4">Loading...</div>';
    if (busiestHoursContainer) busiestHoursContainer.innerHTML = '<div class="text-sm text-zinc-500 text-center py-4">Loading...</div>';
    try {
        const response = await fetch(`/api/stats?range=${range}`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        allLogs = data.recentLogs || [];
        filteredLogs = allLogs;
        renderStats(data.totals, data.daily);
        renderCharts(data.daily);
        renderBreakdowns(data.modelBreakdown, data.domainBreakdown, data.hourlyDistribution);
        renderTable(filteredLogs);
        if (logCount) logCount.textContent = `${filteredLogs.length} entries`;
        if (usageHistoryContainer) {
            hideSkeleton('usageHistoryContainer');
            usageHistoryContainer.innerHTML = '';
        }
        if (topDomainsContainer) {
            const items = topDomainsContainer.querySelectorAll('.skeleton-card, .skeleton, .skeleton-text');
            items.forEach(el => el.remove());
        }
        if (busiestHoursContainer) {
            const items = busiestHoursContainer.querySelectorAll('.skeleton-card, .skeleton, .skeleton-text');
            items.forEach(el => el.remove());
        }
    } catch (error) {
        console.error('Usage load error:', error);
        if (usageHistoryContainer) {
            hideSkeleton('usageHistoryContainer');
            usageHistoryContainer.innerHTML = '<div class="text-sm text-red-400 text-center py-4">Failed to load usage data.</div>';
        }
        if (topDomainsContainer) topDomainsContainer.innerHTML = '<div class="text-sm text-red-400 text-center py-4">Failed to load.</div>';
        if (busiestHoursContainer) busiestHoursContainer.innerHTML = '<div class="text-sm text-red-400 text-center py-4">Failed to load.</div>';
    }
}

updatePasswordBtn.addEventListener('click', async () => {
    const currPass = currentPassword.value.trim();
    const newPass = newPassword.value.trim();
    const confirmPass = confirmPassword.value.trim();
    if (!currPass || !newPass || !confirmPass) {
        showToast('Please fill all password fields.', 3000, 'warning');
        return;
    }
    if (newPass.length < 6) {
        showToast('New password must be at least 6 characters.', 3000, 'warning');
        return;
    }
    if (newPass !== confirmPass) {
        showToast('Passwords do not match.', 3000, 'warning');
        return;
    }
    const user = auth.currentUser;
    if (!user) return;
    const credential = EmailAuthProvider.credential(user.email, currPass);
    try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPass);
        showToast('Password updated successfully!', 3500, 'success');
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
    } catch (error) {
        let msg = 'Password update failed.';
        if (error.code === 'auth/wrong-password') msg = 'Current password is incorrect.';
        else if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
        else if (error.message) msg = error.message;
        showToast(msg, 3500, 'error');
    }
});

deleteAccountBtn.addEventListener('click', () => {
    if (deleteAccountModal) {
        deleteAccountModal.classList.remove('hidden');
        deleteAccountModal.style.display = 'flex';
    }
    deleteReauthToken = 'dummy';
    if (deleteConfirmBtn) deleteConfirmBtn.disabled = true;
    if (deletePassword && deletePassword.parentElement) {
        deletePassword.parentElement.classList.add('hidden');
    }
    if (deleteSocialReauth) deleteSocialReauth.classList.add('hidden');
    renderDeleteTurnstile();
});

deleteCancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteAccountModal) {
        deleteAccountModal.classList.add('hidden');
        deleteAccountModal.style.display = 'none';
    }
    resetDeleteTurnstile();
    deleteReauthToken = null;
    if (deleteConfirmBtn) deleteConfirmBtn.disabled = true;
});

deleteConfirmBtn.addEventListener('click', async () => {
    if (!deleteCaptchaToken) {
        showToast('Please complete the CAPTCHA.', 3000, 'warning');
        return;
    }
    deleteConfirmBtn.disabled = true;
    deleteConfirmBtn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Deleting...';
    try {
        const response = await fetch('/api/user', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                captchaToken: deleteCaptchaToken
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Deletion failed.');
        }
        showToast('Account deleted successfully.', 4000, 'success');
        deleteAccountModal.classList.add('hidden');
        resetDeleteTurnstile();
        await signOutUser();
        window.location.href = '/';
    } catch (error) {
        showToast(error.message || 'Failed to delete account.', 3500, 'error');
        deleteConfirmBtn.disabled = false;
        deleteConfirmBtn.innerHTML = 'Confirm Delete';
    }
});

rangeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        rangeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRange = parseInt(btn.dataset.range);
        loadUsage(currentRange);
    });
});

if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        if (!allLogs || allLogs.length === 0) {
            showToast('No data to export.', 3000, 'warning');
            return;
        }
        let csv = 'Timestamp,Model,Tokens,Status,Domain\n';
        allLogs.forEach(log => {
            const date = log.timestamp ? new Date(log.timestamp).toISOString() : '';
            csv += `${date},${log.model || ''},${log.totalTokens || 0},${log.status || ''},${log.domain || ''}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexus_usage_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Export started.', 2000, 'success');
    });
}

if (logSearchInput) {
    logSearchInput.addEventListener('input', () => {
        const query = logSearchInput.value.toLowerCase().trim();
        if (!query) {
            filteredLogs = allLogs;
        } else {
            filteredLogs = allLogs.filter(log =>
                (log.model || '').toLowerCase().includes(query) ||
                (log.domain || '').toLowerCase().includes(query) ||
                (log.status || '').toLowerCase().includes(query)
            );
        }
        renderTable(filteredLogs);
        if (logCount) logCount.textContent = `${filteredLogs.length} entries`;
    });
}