import { observeAuthState, signOutUser } from "./modules/auth.js";
import { getApiKeys } from "./modules/firestore.js";

const signInBtn = document.getElementById('signInBtn');
const userArea = document.getElementById('userArea');
const userAvatar = document.getElementById('userAvatar');
const userEmail = document.getElementById('userEmail');
const signOutBtn = document.getElementById('signOutBtn');
const avatarBtn = document.getElementById('avatarBtn');
const avatarDropdown = document.getElementById('avatarDropdown');

const loadingKeys = document.getElementById('loadingKeys');
const playgroundForm = document.getElementById('playgroundForm');
const emptyKeys = document.getElementById('emptyKeys');
const keySelect = document.getElementById('keySelect');
const modelSelect = document.getElementById('modelSelect');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const responseArea = document.getElementById('responseArea');
const responseBody = document.getElementById('responseBody');
const statusValue = document.getElementById('statusValue');
const timeValue = document.getElementById('timeValue');
const tokensValue = document.getElementById('tokensValue');

let currentUser = null;

function updateUIForUser(user) {
    if (signInBtn) signInBtn.classList.add('hidden');
    if (userArea) userArea.classList.remove('hidden');
    if (userAvatar) userAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=User&background=a855f7&color=fff&size=40';
    if (userEmail) userEmail.textContent = user.email || 'user@example.com';
}

function updateUIForSignedOut() {
    if (signInBtn) signInBtn.classList.remove('hidden');
    if (userArea) userArea.classList.add('hidden');
    if (avatarDropdown) avatarDropdown.classList.remove('open');
}

function toggleDropdown(e) {
    e.stopPropagation();
    if (avatarDropdown) avatarDropdown.classList.toggle('open');
}

function closeDropdown() {
    if (avatarDropdown) avatarDropdown.classList.remove('open');
}

function showLoadingState() {
    loadingKeys.classList.remove('hidden');
    playgroundForm.classList.add('hidden');
    emptyKeys.classList.add('hidden');
    responseArea.classList.add('hidden');
}

function showFormState() {
    loadingKeys.classList.add('hidden');
    playgroundForm.classList.remove('hidden');
    emptyKeys.classList.add('hidden');
}

function showEmptyState() {
    loadingKeys.classList.add('hidden');
    playgroundForm.classList.add('hidden');
    emptyKeys.classList.remove('hidden');
    responseArea.classList.add('hidden');
}

function formatJSON(data) {
    try {
        return JSON.stringify(data, null, 2);
    } catch {
        return String(data);
    }
}

function setResponse(status, time, tokens, body) {
    responseArea.classList.remove('hidden');
    const isSuccess = status >= 200 && status < 300;
    statusValue.textContent = `${status} ${isSuccess ? 'OK' : 'Error'}`;
    statusValue.className = `value ${isSuccess ? 'success' : 'error'}`;
    timeValue.textContent = time ? `${time}ms` : '—';
    tokensValue.textContent = tokens !== undefined && tokens !== null ? tokens : '—';
    responseBody.textContent = body ? formatJSON(body) : 'No response body';
}

function clearResponse() {
    responseArea.classList.add('hidden');
    statusValue.textContent = '—';
    statusValue.className = 'value';
    timeValue.textContent = '—';
    tokensValue.textContent = '—';
    responseBody.textContent = 'Response will appear here…';
}

async function loadKeys(user) {
    showLoadingState();
    try {
        const keys = await getApiKeys(user.uid);
        const activeKeys = keys.filter(k => k.status === 'active');
        if (activeKeys.length === 0) {
            showEmptyState();
            return;
        }
        keySelect.innerHTML = '';
        activeKeys.forEach(key => {
            const option = document.createElement('option');
            option.value = key.key;
            option.textContent = `${key.name} (${key.key.slice(0, 8)}...)`;
            keySelect.appendChild(option);
        });
        showFormState();
    } catch (error) {
        console.error('Failed to load keys:', error);
        showEmptyState();
    }
}

async function sendRequest() {
    const key = keySelect.value;
    const model = modelSelect.value;
    const message = messageInput.value.trim();

    if (!key) {
        alert('Please select a valid Nexus key.');
        return;
    }
    if (!message) {
        alert('Please enter a message.');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.classList.add('loading');
    clearResponse();

    const startTime = performance.now();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                nexusKey: key,
                messages: [{ role: 'user', content: message }],
                model: model
            })
        });

        const endTime = performance.now();
        const elapsed = Math.round(endTime - startTime);

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        let tokens = null;
        if (data && typeof data === 'object' && data.usage && data.usage.total_tokens !== undefined) {
            tokens = data.usage.total_tokens;
        } else if (data && typeof data === 'object' && data.totalTokens !== undefined) {
            tokens = data.totalTokens;
        }

        setResponse(response.status, elapsed, tokens, data);

    } catch (error) {
        const endTime = performance.now();
        const elapsed = Math.round(endTime - startTime);
        setResponse(0, elapsed, null, { error: error.message || 'Network error' });
    } finally {
        sendBtn.disabled = false;
        sendBtn.classList.remove('loading');
    }
}

function clearAll() {
    messageInput.value = '';
    clearResponse();
    messageInput.focus();
}

observeAuthState((user) => {
    if (!user) {
        window.location.href = '/login';
        return;
    }
    currentUser = user;
    updateUIForUser(user);
    loadKeys(user);
});

if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
        await signOutUser();
    });
}

if (avatarBtn) {
    avatarBtn.addEventListener('click', toggleDropdown);
}

document.addEventListener('click', closeDropdown);

if (sendBtn) {
    sendBtn.addEventListener('click', sendRequest);
}

if (clearBtn) {
    clearBtn.addEventListener('click', clearAll);
}

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            sendRequest();
        }
    }
});