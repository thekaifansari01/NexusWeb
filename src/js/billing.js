import { observeAuthState, signOutUser } from "./modules/auth.js";
import { showToast } from "./modules/ui.js";

const sidebarAvatar = document.getElementById('sidebarAvatar');
const sidebarName = document.getElementById('sidebarName');
const sidebarEmail = document.getElementById('sidebarEmail');
const sidebarSignOut = document.getElementById('sidebarSignOut');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('aside');

const billingSkeleton = document.getElementById('billingSkeleton');
const billingContent = document.getElementById('billingContent');

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
    billingSkeleton.classList.remove('hidden');
    billingContent.classList.add('hidden');
}

function hideSkeleton() {
    billingSkeleton.classList.add('hidden');
    billingContent.classList.remove('hidden');
}

function renderPlan(data) {
    const { plan, planLabel, monthlyUsage, monthlyLimit, percentage, remaining, nextReset, billingCycle: cycle } = data;

    planBadge.textContent = planLabel;
    planName.textContent = planLabel + ' Tier';
    planPrice.textContent = plan === 'free' ? '$0 / month' : '—';
    billingCycle.textContent = cycle.charAt(0).toUpperCase() + cycle.slice(1);
    nextResetDate.textContent = new Date(nextReset).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    usageNumber.textContent = monthlyUsage;
    usageLimit.textContent = monthlyLimit;
    const pct = Math.min(percentage, 100);
    
    setTimeout(() => {
        usageProgressBar.style.width = pct + '%';
        if (pct >= 90) {
            usageProgressBar.classList.remove('from-purple-500', 'to-primary');
            usageProgressBar.classList.add('from-red-600', 'to-red-500');
            usageProgressBar.parentElement.classList.add('shadow-[0_0_20px_rgba(239,68,68,0.3)]', 'border-red-500/30');
        } else {
            usageProgressBar.classList.add('from-purple-500', 'to-primary');
            usageProgressBar.classList.remove('from-red-600', 'to-red-500');
            usageProgressBar.parentElement.classList.remove('shadow-[0_0_20px_rgba(239,68,68,0.3)]', 'border-red-500/30');
        }
    }, 100);

    usagePercentage.textContent = pct + '% used';
    remainingCount.textContent = Math.max(0, remaining);

    if (pct >= 80) {
        usageWarning.classList.remove('hidden');
        if (pct >= 100) {
            usageWarning.innerHTML = `<i class="ph-bold ph-warning text-xl shrink-0 mt-0.5"></i><span>You've reached your monthly limit. Upgrade to continue.</span>`;
            usageWarning.classList.replace('bg-amber-500/10', 'bg-red-500/10');
            usageWarning.classList.replace('border-amber-500/20', 'border-red-500/30');
            usageWarning.classList.replace('text-amber-400', 'text-red-400');
            usageWarning.classList.replace('shadow-[0_0_15px_rgba(245,158,11,0.1)]', 'shadow-[0_0_15px_rgba(239,68,68,0.15)]');
        } else {
            usageWarning.innerHTML = `<i class="ph-bold ph-warning text-xl shrink-0 mt-0.5"></i><span>You're approaching your monthly limit. Upgrade to continue uninterrupted.</span>`;
        }
    } else {
        usageWarning.classList.add('hidden');
    }
}

async function loadBilling() {
    if (!currentUser) return;
    showSkeleton();
    try {
        const response = await fetch('/api/user/plan', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch billing data');
        const data = await response.json();
        renderPlan(data);
        hideSkeleton();
    } catch (error) {
        console.error('Billing load error:', error);
        showToast('Failed to load billing information.', 3500, 'error');
        hideSkeleton();
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