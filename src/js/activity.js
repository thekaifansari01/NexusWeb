// activity.js
import { observeAuthState, signOutUser } from "./modules/auth.js";
import { showToast } from "./modules/ui.js";

const sidebarAvatar = document.getElementById('sidebarAvatar');
const sidebarName = document.getElementById('sidebarName');
const sidebarEmail = document.getElementById('sidebarEmail');
const sidebarSignOut = document.getElementById('sidebarSignOut');
const sessionsContainer = document.getElementById('sessionsContainer');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('aside');

let currentUser = null;
let currentSessionId = null;

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

function showSkeleton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5 gap-4 skeleton-card';
        skeleton.style.animationDelay = `${i * 0.05}s`;
        skeleton.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="skeleton skeleton-icon" style="width: 40px; height: 40px; border-radius: 12px;"></div>
                <div class="flex-1 min-w-0 space-y-2">
                    <div class="flex items-center gap-2 flex-wrap">
                        <div class="skeleton skeleton-text" style="width: 140px; height: 18px;"></div>
                        <div class="skeleton skeleton-badge" style="width: 80px; height: 20px;"></div>
                    </div>
                    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div class="skeleton skeleton-text" style="width: 100px; height: 14px;"></div>
                        <div class="skeleton skeleton-text" style="width: 120px; height: 14px;"></div>
                        <div class="skeleton skeleton-text" style="width: 90px; height: 14px;"></div>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-end flex-shrink-0">
                <div class="skeleton skeleton-text" style="width: 100px; height: 36px; border-radius: 10px;"></div>
            </div>
        `;
        container.appendChild(skeleton);
    }
}

function hideSkeleton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const skeletons = container.querySelectorAll('.skeleton-card, .skeleton, .skeleton-text, .skeleton-badge, .skeleton-icon');
    skeletons.forEach(el => el.remove());
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
    loadSessions();
});

if (sidebarSignOut) {
    sidebarSignOut.addEventListener('click', async () => {
        await signOutUser();
    });
}

async function loadSessions() {
    if (!currentUser) return;
    showSkeleton('sessionsContainer');
    try {
        const response = await fetch('/api/session', { credentials: 'include' });
        if (!response.ok) throw new Error("Failed to fetch sessions");
        const data = await response.json();
        currentSessionId = data.currentSessionId;
        hideSkeleton('sessionsContainer');
        renderSessions(data.sessions || []);
    } catch (error) {
        hideSkeleton('sessionsContainer');
        console.error("Session load error:", error);
        if (sessionsContainer) {
            sessionsContainer.innerHTML = '<div class="text-sm text-red-400 text-center py-4">Failed to load session history.</div>';
        }
    }
}

function renderSessions(sessions) {
    if (!sessionsContainer) return;
    sessionsContainer.innerHTML = '';
    if (sessions.length === 0) {
        sessionsContainer.innerHTML = '<div class="text-sm text-zinc-500 text-center py-4">No active sessions found.</div>';
        return;
    }
    sessions.forEach((session, index) => {
        const card = document.createElement('div');
        card.className = 'flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5 gap-4 transition-colors hover:bg-black/60 fade-in-up';
        card.style.animationDelay = `${index * 0.04}s`;
        const isCurrent = session.sessionId === currentSessionId;
        const leftSection = document.createElement('div');
        leftSection.className = 'flex items-start gap-4';
        const iconBox = document.createElement('div');
        iconBox.className = 'w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 mt-0.5 border border-white/5';
        const deviceInfo = session.deviceInfo || 'Unknown Device';
        if (deviceInfo.toLowerCase().includes('windows') || deviceInfo.toLowerCase().includes('mac')) {
            iconBox.innerHTML = '<i class="ph-bold ph-desktop text-xl"></i>';
        } else {
            iconBox.innerHTML = '<i class="ph-bold ph-device-mobile text-xl"></i>';
        }
        const infoBox = document.createElement('div');
        const titleRow = document.createElement('div');
        titleRow.className = 'flex items-center gap-2 flex-wrap mb-1';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'text-sm font-semibold text-white';
        nameSpan.textContent = deviceInfo;
        titleRow.appendChild(nameSpan);
        if (isCurrent) {
            const badge = document.createElement('span');
            badge.className = 'text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold tracking-wide';
            badge.textContent = 'THIS DEVICE';
            titleRow.appendChild(badge);
        }
        infoBox.appendChild(titleRow);
        const loginDate = session.createdAt
            ? new Date(session.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Recently';
        const metaRow = document.createElement('div');
        metaRow.className = 'flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400';
        metaRow.innerHTML = `
            <span class="flex items-center gap-1"><i class="ph-fill ph-map-pin text-zinc-500"></i> ${session.location || 'Unknown Location'}</span>
            <span class="flex items-center gap-1"><i class="ph-fill ph-clock text-zinc-500"></i> ${loginDate}</span>
            <span class="font-mono text-[11px] bg-zinc-900 px-1.5 py-0.5 rounded border border-white/10 text-zinc-300">${session.ipAddress || 'Unknown IP'}</span>
        `;
        infoBox.appendChild(metaRow);
        leftSection.appendChild(iconBox);
        leftSection.appendChild(infoBox);
        card.appendChild(leftSection);
        const rightSection = document.createElement('div');
        rightSection.className = 'flex items-center justify-end flex-shrink-0';
        const actionBtn = document.createElement('button');
        actionBtn.className = isCurrent
            ? 'px-4 py-2 text-xs font-semibold rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1.5'
            : 'px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 transition-all flex items-center gap-1.5';
        actionBtn.innerHTML = isCurrent
            ? '<i class="ph-bold ph-sign-out"></i> Log Out'
            : '<i class="ph-bold ph-x-circle"></i> Revoke';
        actionBtn.addEventListener('click', async () => {
            const confirmMsg = isCurrent
                ? 'Are you sure you want to log out of this session?'
                : `Revoke session on ${deviceInfo}? This device will be forcefully logged out.`;
            if (confirm(confirmMsg)) {
                try {
                    const response = await fetch('/api/session', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ sessionId: session.sessionId })
                    });
                    if (!response.ok) throw new Error("Failed to revoke session");
                    if (typeof showToast === 'function') {
                        showToast(isCurrent ? 'Logging out...' : 'Session revoked successfully.', 3000, 'success');
                    }
                    if (isCurrent) {
                        await signOutUser();
                    } else {
                        loadSessions();
                    }
                } catch (error) {
                    console.error("Revoke error:", error);
                    if (typeof showToast === 'function') {
                        showToast('Failed to revoke session.', 3500, 'error');
                    } else {
                        alert('Failed to revoke session.');
                    }
                }
            }
        });
        rightSection.appendChild(actionBtn);
        card.appendChild(rightSection);
        sessionsContainer.appendChild(card);
    });
}