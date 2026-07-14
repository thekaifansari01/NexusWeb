// src/js/modules/plan.js
import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { showStatSkeletons } from "./dashboard-utils.js";

export let planInfo = {
  plan: 'free',
  planLabel: 'Free',
  monthlyUsage: 0,
  monthlyLimit: 1000,
  percentage: 0,
  remaining: 1000
};

export function renderPlanInfo() {
  const { planLabel, monthlyUsage, monthlyLimit, percentage, remaining } = planInfo;
  dom.planBadge.textContent = planLabel;
  dom.usageNumber.textContent = monthlyUsage;
  dom.usageLimit.textContent = monthlyLimit;
  const pct = Math.min(percentage, 100);
  dom.usageProgressBar.style.width = pct + '%';
  dom.usagePercentText.textContent = pct + '% used';
  dom.usageRemaining.textContent = Math.max(0, remaining);
  if (pct >= 90) {
    dom.usageProgressBar.classList.add('bg-red-500');
    dom.usageProgressBar.classList.remove('bg-primary');
  } else {
    dom.usageProgressBar.classList.remove('bg-red-500');
    dom.usageProgressBar.classList.add('bg-primary');
  }
  if (pct >= 80) {
    dom.usageWarning.classList.remove('hidden');
    if (pct >= 100) {
      dom.usageWarning.innerHTML = `<i class="ph-bold ph-warning text-xs"></i> Limit reached. Upgrade to continue.`;
    } else {
      dom.usageWarning.innerHTML = `<i class="ph-bold ph-warning text-xs"></i> Approaching monthly limit`;
    }
  } else {
    dom.usageWarning.classList.add('hidden');
  }
}

export async function loadPlanInfo() {
  if (!state.currentUser) return;
  showStatSkeletons();
  try {
    const response = await fetch('/api/user/plan', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch plan info');
    const data = await response.json();
    planInfo = data;
    renderPlanInfo();
  } catch (error) {
    console.error('Plan info load error:', error);
    dom.planBadge.textContent = 'Free';
    dom.usageNumber.textContent = '—';
    dom.usageLimit.textContent = '1000';
    dom.usageProgressBar.style.width = '0%';
    dom.usagePercentText.textContent = '0% used';
    dom.usageRemaining.textContent = '1000';
  }
}