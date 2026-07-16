import { observeAuthState, signOutUser } from "./modules/auth.js";
import { getApiKeys } from "./modules/firestore.js";

const dom = {
    loadingOverlay: document.getElementById('loadingOverlay'),
    keySelect: document.getElementById('keySelect'),
    modelSelect: document.getElementById('modelSelect'),
    systemPrompt: document.getElementById('systemPrompt'),
    tempSlider: document.getElementById('tempSlider'),
    tempValue: document.getElementById('tempValue'),
    tokensSlider: document.getElementById('tokensSlider'),
    tokensValue: document.getElementById('tokensValue'),
    
    tabChat: document.getElementById('tabChat'),
    tabRaw: document.getElementById('tabRaw'),
    chatView: document.getElementById('chatView'),
    rawView: document.getElementById('rawView'),
    chatContainer: document.getElementById('chatContainer'),
    chatEmptyState: document.getElementById('chatEmptyState'),
    jsonOutput: document.getElementById('jsonOutput'),
    
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    statusMetric: document.getElementById('statusMetric'),
    
    viewCodeBtn: document.getElementById('viewCodeBtn'),
    codeModal: document.getElementById('codeModal'),
    closeCodeBtn: document.getElementById('closeCodeBtn'),
    copyCodeBtn: document.getElementById('copyCodeBtn'),
    curlCode: document.getElementById('curlCode'),

    sidebarMenu: document.getElementById('sidebarMenu'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    closeMobileMenuBtn: document.getElementById('closeMobileMenuBtn'),
    sidebarAvatar: document.getElementById('sidebarAvatar'),
    sidebarName: document.getElementById('sidebarName'),
    sidebarEmail: document.getElementById('sidebarEmail'),
    sidebarSignOut: document.getElementById('sidebarSignOut')
};

let chatHistory = [];
const MAX_HISTORY_LENGTH = 16;
let currentRawData = null;

function init() {
    dom.tempSlider.addEventListener('input', (e) => dom.tempValue.textContent = e.target.value);
    dom.tokensSlider.addEventListener('input', (e) => dom.tokensValue.textContent = e.target.value);
    
    dom.tabChat.addEventListener('click', () => switchTab('chat'));
    dom.tabRaw.addEventListener('click', () => switchTab('raw'));
    
    dom.messageInput.addEventListener('input', autoResizeTextarea);
    dom.messageInput.addEventListener('keydown', handleEnterKey);
    
    dom.sendBtn.addEventListener('click', sendMessage);
    dom.clearChatBtn.addEventListener('click', clearChat);
    
    dom.viewCodeBtn.addEventListener('click', showCodeModal);
    dom.closeCodeBtn.addEventListener('click', hideCodeModal);
    dom.copyCodeBtn.addEventListener('click', copyCode);

    if (dom.mobileMenuBtn && dom.sidebarMenu) {
        dom.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    if (dom.closeMobileMenuBtn && dom.sidebarMenu) {
        dom.closeMobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    if (dom.sidebarSignOut) {
        dom.sidebarSignOut.addEventListener('click', signOutUser);
    }
}

function toggleMobileMenu() {
    if (dom.sidebarMenu.classList.contains('hidden')) {
        dom.sidebarMenu.classList.remove('hidden');
        dom.sidebarMenu.classList.add('absolute', 'inset-y-0', 'left-0');
    } else {
        dom.sidebarMenu.classList.add('hidden');
        dom.sidebarMenu.classList.remove('absolute', 'inset-y-0', 'left-0');
    }
}

function switchTab(tab) {
    if (tab === 'chat') {
        dom.tabChat.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white/10 text-white';
        dom.tabRaw.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-zinc-500 hover:text-white';
        dom.chatView.classList.remove('hidden');
        dom.rawView.classList.add('hidden');
        scrollToBottom();
    } else {
        dom.tabRaw.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white/10 text-white';
        dom.tabChat.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-zinc-500 hover:text-white';
        dom.rawView.classList.remove('hidden');
        dom.chatView.classList.add('hidden');
    }
}

function autoResizeTextarea() {
    dom.messageInput.style.height = 'auto';
    dom.messageInput.style.height = Math.min(dom.messageInput.scrollHeight, 150) + 'px';
}

function handleEnterKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function syntaxHighlight(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function updateRawView(payload, response) {
    const rawObj = {
        timestamp: new Date().toISOString(),
        requestPayload: payload,
        responseContent: response
    };
    currentRawData = rawObj;
    dom.jsonOutput.innerHTML = syntaxHighlight(rawObj);
}

function scrollToBottom() {
    dom.chatView.scrollTop = dom.chatView.scrollHeight;
}

function appendBubble(role, text) {
    dom.chatEmptyState.classList.add('hidden');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role === 'user' ? 'chat-user' : 'chat-ai'}`;
    
    if (role === 'ai') {
        const rawHtml = marked.parse(text);
        const safeHtml = DOMPurify.sanitize(rawHtml);
        bubble.innerHTML = safeHtml;
        
        Prism.highlightAllUnder(bubble);
        
        const preElements = bubble.querySelectorAll('pre');
        preElements.forEach((pre) => {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-code-btn';
            copyBtn.innerHTML = '<i class="ph-bold ph-copy"></i>';
            copyBtn.title = 'Copy code';
            
            copyBtn.addEventListener('click', () => {
                const codeBlock = pre.querySelector('code');
                const textToCopy = codeBlock ? codeBlock.innerText : pre.innerText;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    copyBtn.innerHTML = '<i class="ph-bold ph-check text-emerald-400"></i>';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="ph-bold ph-copy"></i>';
                    }, 2000);
                });
            });
            
            pre.appendChild(copyBtn);
        });
    } else {
        bubble.textContent = text;
    }
    
    dom.chatContainer.appendChild(bubble);
    scrollToBottom();
    return bubble;
}

function showTyping() {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-ai typing-indicator';
    bubble.id = 'typingBubble';
    bubble.innerHTML = '<span></span><span></span><span></span>';
    dom.chatContainer.appendChild(bubble);
    scrollToBottom();
}

function removeTyping() {
    const t = document.getElementById('typingBubble');
    if (t) t.remove();
}

async function sendMessage() {
    const text = dom.messageInput.value.trim();
    if (!text || !dom.keySelect.value) return;

    const apiKey = dom.keySelect.value;
    const model = dom.modelSelect.value;
    const sysPrompt = dom.systemPrompt.value.trim();
    const temp = parseFloat(dom.tempSlider.value);
    const maxTokens = parseInt(dom.tokensSlider.value);

    dom.messageInput.value = '';
    autoResizeTextarea();
    dom.sendBtn.disabled = true;

    chatHistory.push({ role: 'user', content: text });
    
    if (chatHistory.length > MAX_HISTORY_LENGTH) {
        chatHistory = chatHistory.slice(chatHistory.length - MAX_HISTORY_LENGTH);
    }

    appendBubble('user', text);
    showTyping();
    dom.statusMetric.textContent = 'Processing request...';

    const payloadMessages = [];
    if (sysPrompt) {
        payloadMessages.push({ role: 'system', content: sysPrompt });
    }
    payloadMessages.push(...chatHistory);

    const payload = {
        nexusKey: apiKey,
        model: model,
        messages: payloadMessages,
        temperature: temp,
        max_tokens: maxTokens
    };

    const startTime = performance.now();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const endTime = performance.now();
        const elapsed = Math.round(endTime - startTime);

        removeTyping();

        let aiText = '';
        if (data.choices && data.choices[0] && data.choices[0].message) {
            aiText = data.choices[0].message.content;
        } else if (data.error) {
            aiText = `Error: ${data.error.message || JSON.stringify(data.error)}`;
        } else {
            aiText = JSON.stringify(data);
        }

        chatHistory.push({ role: 'assistant', content: aiText });
        
        if (chatHistory.length > MAX_HISTORY_LENGTH) {
            chatHistory = chatHistory.slice(chatHistory.length - MAX_HISTORY_LENGTH);
        }

        appendBubble('ai', aiText);
        updateRawView(payload, data);
        
        let tokens = data.usage ? data.usage.total_tokens : 'N/A';
        dom.statusMetric.textContent = `${response.status} OK • ${elapsed}ms • ${tokens} tokens`;

    } catch (err) {
        removeTyping();
        appendBubble('ai', `System Error: ${err.message}`);
        dom.statusMetric.textContent = `Failed • ${err.message}`;
    }

    dom.sendBtn.disabled = false;
    dom.messageInput.focus();
}

function clearChat() {
    chatHistory = [];
    dom.chatContainer.innerHTML = '';
    dom.jsonOutput.textContent = 'No request made yet.';
    dom.statusMetric.textContent = 'Ready';
    dom.chatEmptyState.classList.remove('hidden');
}

function showCodeModal() {
    const apiKey = dom.keySelect.value || 'YOUR_NEXUS_KEY';
    const model = dom.modelSelect.value;
    const sysPrompt = dom.systemPrompt.value.trim();
    const text = dom.messageInput.value.trim() || 'Hello AI!';
    
    const msgs = [];
    if (sysPrompt) msgs.push({ role: 'system', content: sysPrompt });
    msgs.push({ role: 'user', content: text });

    const payload = {
        nexusKey: apiKey,
        model: model,
        messages: msgs,
        temperature: parseFloat(dom.tempSlider.value),
        max_tokens: parseInt(dom.tokensSlider.value)
    };

    const curl = `curl -X POST https://your-domain.com/api/chat \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;

    dom.curlCode.textContent = curl;
    
    dom.codeModal.classList.remove('hidden');
    setTimeout(() => dom.codeModal.classList.remove('opacity-0'), 10);
}

function hideCodeModal() {
    dom.codeModal.classList.add('opacity-0');
    setTimeout(() => dom.codeModal.classList.add('hidden'), 300);
}

function copyCode() {
    navigator.clipboard.writeText(dom.curlCode.textContent).then(() => {
        const originalText = dom.copyCodeBtn.innerHTML;
        dom.copyCodeBtn.innerHTML = '<i class="ph-bold ph-check text-emerald-400"></i> Copied!';
        dom.copyCodeBtn.classList.add('border-emerald-500/30', 'text-emerald-400');
        setTimeout(() => {
            dom.copyCodeBtn.innerHTML = originalText;
            dom.copyCodeBtn.classList.remove('border-emerald-500/30', 'text-emerald-400');
        }, 2000);
    });
}

observeAuthState(async (user) => {
    if (!user) {
        window.location.href = '/login';
        return;
    }
    
    if (dom.sidebarAvatar) dom.sidebarAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=User&background=a855f7&color=fff&size=40';
    if (dom.sidebarEmail) dom.sidebarEmail.textContent = user.email || 'user@example.com';
    if (dom.sidebarName) dom.sidebarName.textContent = user.displayName || user.email.split('@')[0] || 'User';

    try {
        const keys = await getApiKeys(user.uid);
        const activeKeys = keys.filter(k => k.status === 'active');
        dom.keySelect.innerHTML = '';
        if (activeKeys.length === 0) {
            dom.keySelect.innerHTML = '<option value="">No active keys found</option>';
            dom.sendBtn.disabled = true;
        } else {
            activeKeys.forEach(key => {
                const opt = document.createElement('option');
                opt.value = key.key;
                opt.textContent = `${key.name} (${key.key.slice(0,8)}...)`;
                dom.keySelect.appendChild(opt);
            });
            dom.sendBtn.disabled = false;
        }
    } catch(e) {
        console.error(e);
    }
    
    dom.loadingOverlay.classList.add('hidden');
    dom.chatEmptyState.classList.remove('hidden');
});

init();