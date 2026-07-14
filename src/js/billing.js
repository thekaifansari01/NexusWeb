// src/js/billing.js
import { observeAuthState, signOutUser } from "./modules/auth.js";
import { showToast } from "./modules/ui.js";

const sidebarAvatar = document.getElementById('sidebarAvatar');
const sidebarName = document.getElementById('sidebarName');
const sidebarEmail = document.getElementById('sidebarEmail');
const sidebarSignOut = document.getElementById('sidebarSignOut');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('aside');

// UI elements
const planBadge = document.getElementById('planBadge');
const planName = document.getElementById('planName');
const planPrice = document.getElementById('planPrice');
const billingCycle = document.getElementById('billingCycle');
const nextResetDate = document.getElementById('nextResetDate');
const usageNumber = document.getElementById('usageNumber');
const usageLimit = document.getElementById('usageLimit');
const usageProgressBar = document.getElementById('usageProgressBar');
const usagePercentage = document.getElementById('usagePercentage');
const remainingCount = document.getElementById('remainingCount');
const remainingText = document.getElementById('remainingText');
const usageWarning = document.getElementById('usageWarning');
const upgradeBtn = document.getElementById('upgradeBtn');

let currentUser = null;

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

function showSkeleton() {
    // Simply show loading text – can be enhanced with skeleton UI
    usageNumber.textContent = '…';
    usageLimit.textContent = '…';
    usageProgressBar.style.width = '0%';
    usagePercentage.textContent = 'Loading…';
    remainingCount.textContent = '…';
    planBadge.textContent = 'Loading';
    planName.textContent = 'Loading…';
    nextResetDate.textContent = '—';
}

function renderPlan(data) {
    const { plan, planLabel, monthlyUsage, monthlyLimit, percentage, remaining, nextReset, billingCycle: cycle } = data;

    // Plan info
    planBadge.textContent = planLabel;
    planName.textContent = planLabel + ' Tier';
    planPrice.textContent = plan === 'free' ? '$0 / month' : '—';
    billingCycle.textContent = cycle.charAt(0).toUpperCase() + cycle.slice(1);
    nextResetDate.textContent = new Date(nextReset).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Usage
    usageNumber.textContent = monthlyUsage;
    usageLimit.textContent = monthlyLimit;
    const pct = Math.min(percentage, 100);
    usageProgressBar.style.width = pct + '%';
    usagePercentage.textContent = pct + '% used';
    remainingCount.textContent = Math.max(0, remaining);

    // Colour the progress bar if near limit
    if (pct >= 90) {
        usageProgressBar.classList.add('bg-red-500');
        usageProgressBar.classList.remove('bg-primary');
    } else {
        usageProgressBar.classList.remove('bg-red-500');
        usageProgressBar.classList.add('bg-primary');
    }

    // Show warning if >= 80%
    if (pct >= 80) {
        usageWarning.classList.remove('hidden');
        if (pct >= 100) {
            usageWarning.innerHTML = `<i class="ph-bold ph-warning text-lg"></i> You've reached your monthly limit. Upgrade to continue.`;
        } else {
            usageWarning.innerHTML = `<i class="ph-bold ph-warning text-lg"></i> You're approaching your monthly limit. Upgrade to continue uninterrupted.`;
        }
    } else {
        usageWarning.classList.add('hidden');
    }

    // Upgrade button – disabled for now
    upgradeBtn.disabled = true;
    upgradeBtn.innerHTML = '<i class="ph-bold ph-arrow-up-right"></i> Upgrade (Coming Soon)';
}

async function loadBilling() {
    if (!currentUser) return;
    showSkeleton();
    try {
        const response = await fetch('/api/user/plan', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch billing data');
        const data = await response.json();
        renderPlan(data);
    } catch (error) {
        console.error('Billing load error:', error);
        showToast('Failed to load billing information.', 3500, 'error');
    }
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
    loadBilling();
});

if (sidebarSignOut) {
    sidebarSignOut.addEventListener('click', async () => {
        await signOutUser();
    });
}