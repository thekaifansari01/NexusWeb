export function updateUIForUser(user) {
    const signInBtn = document.getElementById('signInBtn');
    const loginLink = document.getElementById('loginLink');
    const userArea = document.getElementById('userArea');
    const userAvatar = document.getElementById('userAvatar');
    const userEmail = document.getElementById('userEmail');
    const heroSignInBtn = document.getElementById('heroSignInBtn');
    const heroDashboardBtn = document.getElementById('heroDashboardBtn');
    const footerSignInBtn = document.getElementById('footerSignInBtn');
    const footerDashboardBtn = document.getElementById('footerDashboardBtn');

    if (signInBtn) signInBtn.classList.add('hidden');
    if (loginLink) loginLink.classList.add('hidden');
    if (userArea) userArea.classList.remove('hidden');
    if (userAvatar) userAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=User&background=a855f7&color=fff&size=40';
    if (userEmail) userEmail.textContent = user.email || 'user@example.com';

    if (heroSignInBtn) heroSignInBtn.classList.add('hidden');
    if (heroDashboardBtn) heroDashboardBtn.classList.remove('hidden');
    if (footerSignInBtn) footerSignInBtn.classList.add('hidden');
    if (footerDashboardBtn) footerDashboardBtn.classList.remove('hidden');
}

export function updateUIForSignedOut() {
    const signInBtn = document.getElementById('signInBtn');
    const loginLink = document.getElementById('loginLink');
    const userArea = document.getElementById('userArea');
    const avatarDropdown = document.getElementById('avatarDropdown');
    const heroSignInBtn = document.getElementById('heroSignInBtn');
    const heroDashboardBtn = document.getElementById('heroDashboardBtn');
    const footerSignInBtn = document.getElementById('footerSignInBtn');
    const footerDashboardBtn = document.getElementById('footerDashboardBtn');

    if (signInBtn) signInBtn.classList.remove('hidden');
    if (loginLink) loginLink.classList.remove('hidden');
    if (userArea) userArea.classList.add('hidden');
    if (avatarDropdown) avatarDropdown.classList.remove('open');

    if (heroSignInBtn) heroSignInBtn.classList.remove('hidden');
    if (heroDashboardBtn) heroDashboardBtn.classList.add('hidden');
    if (footerSignInBtn) footerSignInBtn.classList.remove('hidden');
    if (footerDashboardBtn) footerDashboardBtn.classList.add('hidden');
}

export function toggleDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('avatarDropdown');
    if (dropdown) dropdown.classList.toggle('open');
}

export function closeDropdown() {
    const dropdown = document.getElementById('avatarDropdown');
    if (dropdown) dropdown.classList.remove('open');
}

export function showToast(message, duration = 3500, type = 'success') {
    const existing = document.getElementById('toastOverlay');
    if (existing) existing.remove();

    const config = {
        success: {
            icon: 'ph-check-circle',
            color: '#34d399',
            bg: 'rgba(52, 211, 153, 0.15)',
            border: 'rgba(52, 211, 153, 0.3)',
            glow: 'rgba(52, 211, 153, 0.2)'
        },
        error: {
            icon: 'ph-x-circle',
            color: '#fb7185',
            bg: 'rgba(251, 113, 133, 0.15)',
            border: 'rgba(251, 113, 133, 0.3)',
            glow: 'rgba(251, 113, 133, 0.2)'
        },
        warning: {
            icon: 'ph-warning',
            color: '#fbbf24',
            bg: 'rgba(251, 191, 36, 0.15)',
            border: 'rgba(251, 191, 36, 0.3)',
            glow: 'rgba(251, 191, 36, 0.2)'
        },
        info: {
            icon: 'ph-info',
            color: '#60a5fa',
            bg: 'rgba(96, 165, 250, 0.15)',
            border: 'rgba(96, 165, 250, 0.3)',
            glow: 'rgba(96, 165, 250, 0.2)'
        }
    };

    const style = config[type] || config.success;

    const overlay = document.createElement('div');
    overlay.id = 'toastOverlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: toastOverlayIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        opacity: 0;
    `;

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: rgba(24, 24, 27, 0.95);
        border: 1px solid ${style.border};
        border-radius: 24px;
        padding: 2rem 2.5rem;
        max-width: 480px;
        width: 90%;
        box-shadow: 0 40px 80px rgba(0, 0, 0, 0.8), 0 0 60px ${style.glow};
        transform: scale(0.9) translateY(20px);
        animation: toastCardIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        position: relative;
        overflow: hidden;
    `;

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: ${style.color};
        border-radius: 0 0 24px 24px;
        width: 100%;
        animation: toastProgress ${duration}ms linear forwards;
    `;

    const iconCircle = document.createElement('div');
    iconCircle.style.cssText = `
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: ${style.bg};
        border: 2px solid ${style.border};
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
    `;
    iconCircle.innerHTML = `<i class="ph-bold ${style.icon}" style="color: ${style.color}; font-size: 2rem;"></i>`;

    const title = document.createElement('div');
    title.style.cssText = `
        font-weight: 700;
        color: #fafafa;
        font-size: 1.2rem;
        text-align: center;
        margin-bottom: 0.5rem;
    `;
    title.textContent = type.charAt(0).toUpperCase() + type.slice(1);

    const msg = document.createElement('div');
    msg.style.cssText = `
        color: #a1a1aa;
        font-size: 0.95rem;
        text-align: center;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    `;
    msg.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        color: #a1a1aa;
        padding: 0.5rem 2rem;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.2s ease;
        width: 100%;
        font-family: 'Plus Jakarta Sans', sans-serif;
    `;
    closeBtn.textContent = 'Got it';
    closeBtn.onmouseover = () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.08)';
        closeBtn.style.color = '#fafafa';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        closeBtn.style.color = '#a1a1aa';
    };
    closeBtn.onclick = () => {
        closeToast(overlay);
    };

    toast.appendChild(progressBar);
    toast.appendChild(iconCircle);
    toast.appendChild(title);
    toast.appendChild(msg);
    toast.appendChild(closeBtn);
    overlay.appendChild(toast);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
    });

    clearTimeout(overlay._timeout);
    overlay._timeout = setTimeout(() => {
        closeToast(overlay);
    }, duration);
}

function closeToast(overlay) {
    if (!overlay) return;
    overlay.style.opacity = '0';
    const toast = overlay.querySelector('div');
    if (toast) {
        toast.style.transform = 'scale(0.9) translateY(20px)';
        toast.style.opacity = '0';
    }
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.remove();
        }
    }, 400);
}

if (!document.getElementById('toastStyles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'toastStyles';
    styleSheet.textContent = `
        @keyframes toastOverlayIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes toastCardIn {
            from { 
                transform: scale(0.9) translateY(20px);
                opacity: 0;
            }
            to { 
                transform: scale(1) translateY(0);
                opacity: 1;
            }
        }
        @keyframes toastProgress {
            from { width: 100%; }
            to { width: 0%; }
        }
    `;
    document.head.appendChild(styleSheet);
}