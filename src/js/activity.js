import { observeAuthState, signOutUser } from "./modules/auth.js";
import { showToast } from "./modules/ui.js";

const sidebarAvatar = document.getElementById('sidebarAvatar');
const sidebarName = document.getElementById('sidebarName');
const sidebarEmail = document.getElementById('sidebarEmail');
const sidebarSignOut = document.getElementById('sidebarSignOut');
const sessionsContainer = document.getElementById('sessionsContainer');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('aside');
const refreshBtn = document.getElementById('refreshBtn');
const logoutAllBtn = document.getElementById('logoutAllBtn');

let currentUser = null;
let currentSessionId = null;
let isRefreshing = false;

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

function getRelativeTime(timestamp) {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    if (diffMs < 0) return 'Future';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Active now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDeviceIcon(type) {
    if (type === 'mobile') return '<i class="ph-bold ph-device-mobile"></i>';
    if (type === 'tablet') return '<i class="ph-bold ph-device-tablet"></i>';
    return '<i class="ph-bold ph-desktop"></i>';
}

function getDeviceClass(type) {
    if (type === 'mobile') return 'mobile';
    if (type === 'tablet') return 'tablet';
    return 'desktop';
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

if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        if (!isRefreshing) {
            loadSessions();
        }
    });
}

if (logoutAllBtn) {
    logoutAllBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const confirmMsg = 'This will sign you out from all other devices. Continue?';
        if (!confirm(confirmMsg)) return;
        logoutAllBtn.disabled = true;
        logoutAllBtn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Revoking...';
        try {
            const response = await fetch('/api/session', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ revokeAll: true })
            });
            if (!response.ok) throw new Error('Failed to revoke sessions');
            if (typeof showToast === 'function') {
                showToast('All other sessions revoked.', 3000, 'success');
            }
            loadSessions();
        } catch (error) {
            console.error('Logout all error:', error);
            if (typeof showToast === 'function') {
                showToast('Failed to revoke sessions.', 3500, 'error');
            }
        } finally {
            logoutAllBtn.disabled = false;
            logoutAllBtn.innerHTML = '<i class="ph-bold ph-sign-out text-base"></i> Sign Out All Others';
        }
    });
}

async function loadSessions() {
    if (!currentUser) return;
    isRefreshing = true;
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i>';
    }
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
    } finally {
        isRefreshing = false;
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="ph-bold ph-arrows-clockwise text-base"></i> Refresh';
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
        const deviceType = session.deviceType || 'desktop';
        const deviceOS = session.deviceOS || 'Unknown';
        const deviceBrowser = session.deviceBrowser || 'Unknown';
        const displayName = `${deviceBrowser} on ${deviceOS}`;
        const lastActive = session.lastActive || session.createdAt;
        const relativeTime = getRelativeTime(lastActive);
        const isActiveNow = relativeTime === 'Active now';

        const leftSection = document.createElement('div');
        leftSection.className = 'flex items-start gap-4';

        const iconBox = document.createElement('div');
        iconBox.className = `device-icon ${getDeviceClass(deviceType)}`;
        iconBox.innerHTML = getDeviceIcon(deviceType);

        const infoBox = document.createElement('div');
        const titleRow = document.createElement('div');
        titleRow.className = 'flex items-center gap-2 flex-wrap mb-1';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'text-sm font-semibold text-white';
        nameSpan.textContent = displayName;
        titleRow.appendChild(nameSpan);
        if (isCurrent) {
            const badge = document.createElement('span');
            badge.className = 'text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold tracking-wide';
            badge.textContent = 'THIS DEVICE';
            titleRow.appendChild(badge);
        }
        infoBox.appendChild(titleRow);

        const metaRow = document.createElement('div');
        metaRow.className = 'flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400';
        metaRow.innerHTML = `
            <span class="flex items-center gap-1"><i class="ph-fill ph-map-pin text-zinc-500"></i> ${session.location || 'Unknown Location'}</span>
            <span class="flex items-center gap-1"><i class="ph-fill ph-clock text-zinc-500"></i> ${session.createdAt ? new Date(session.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
            <span class="relative-time ${isActiveNow ? 'active' : ''}">${isActiveNow ? '🟢 Active now' : relativeTime}</span>
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
                : `Revoke session on ${displayName}? This device will be forcefully logged out.`;
            if (!confirm(confirmMsg)) return;
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
                }
            }
        });
        rightSection.appendChild(actionBtn);
        card.appendChild(rightSection);
        sessionsContainer.appendChild(card);
    });
}