import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { showToast } from "./ui.js";
import { getDomains, addDomain, deleteDomain, toggleDomainStatus } from "./firestore.js";
import { showSkeleton, hideSkeleton, showStatSkeletons, showCaptchaModal, updateWithTransition } from "./dashboard-utils.js";

export async function loadDomains() {
  if (!state.currentUser) return;
  showStatSkeletons();
  showSkeleton('domainsContainer', 'domains');
  dom.domainsEmptyState.classList.add('hidden');
  try {
    const domains = await getDomains(state.currentUser.uid);
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
  updateWithTransition(dom.totalDomainsEl, `${total}/${state.MAX_DOMAINS}`);
  updateWithTransition(dom.activeDomainsEl, active);
  updateWithTransition(dom.inactiveDomainsEl, inactive);
  updateWithTransition(dom.domainsTotalEl, `${total}/${state.MAX_DOMAINS}`);
  updateWithTransition(dom.domainsActiveEl, active);
  updateWithTransition(dom.domainsInactiveEl, inactive);
  if (dom.domainLimitBadge) {
    updateWithTransition(dom.domainLimitBadge, `${total} / ${state.MAX_DOMAINS} used`);
    if (total >= state.MAX_DOMAINS) {
      dom.domainLimitBadge.classList.add('text-red-400', 'bg-red-500/10', 'border-red-500/20');
      dom.domainLimitBadge.classList.remove('text-primary', 'bg-primary/10', 'border-primary/20');
    } else {
      dom.domainLimitBadge.classList.remove('text-red-400', 'bg-red-500/10', 'border-red-500/20');
      dom.domainLimitBadge.classList.add('text-primary', 'bg-primary/10', 'border-primary/20');
    }
  }
}

function renderDomains(domains) {
  hideSkeleton('domainsContainer');
  const items = dom.domainsContainer.querySelectorAll('.domain-card');
  items.forEach(el => el.remove());
  if (domains.length === 0) {
    dom.domainsEmptyState.classList.remove('hidden');
    return;
  }
  dom.domainsEmptyState.classList.add('hidden');
  domains.forEach((domain, index) => {
    const card = document.createElement('div');
    card.className = `domain-card fade-in-up flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-900/30 hover:border-emerald-500/20 transition-all shadow-md`;
    card.style.animationDelay = `${index * 0.04}s`;
    const left = document.createElement('div');
    left.className = 'flex-1 min-w-0';
    const nameRow = document.createElement('div');
    nameRow.className = 'flex items-center gap-3 flex-wrap';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'text-lg font-bold text-white tracking-wide';
    nameSpan.textContent = domain.domain;
    nameRow.appendChild(nameSpan);
    const isActive = domain.status === 'active';
    const badge = document.createElement('span');
    badge.className = `px-2.5 py-1 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 uppercase tracking-wider ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`;
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-zinc-400'}"></span> ${isActive ? 'Active' : 'Inactive'}`;
    nameRow.appendChild(badge);
    left.appendChild(nameRow);
    const metaRow = document.createElement('div');
    metaRow.className = 'flex items-center gap-4 mt-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider';
    if (domain.createdAt) {
      const d = domain.createdAt.toDate ? domain.createdAt.toDate() : new Date(domain.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      metaRow.innerHTML = `<span><i class="ph-bold ph-calendar-blank mr-1"></i> Added ${dateStr}</span>`;
    } else {
      metaRow.innerHTML = `<span><i class="ph-bold ph-calendar-blank mr-1"></i> Recently added</span>`;
    }
    left.appendChild(metaRow);
    card.appendChild(left);
    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-2 flex-shrink-0 mt-4 md:mt-0';
    const toggleBtn = document.createElement('button');
    toggleBtn.className = `px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isActive ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`;
    toggleBtn.textContent = isActive ? 'Deactivate' : 'Activate';
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
    deleteBtn.className = 'w-10 h-10 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all';
    deleteBtn.innerHTML = '<i class="ph-bold ph-trash text-lg"></i>';
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
    dom.domainsContainer.appendChild(card);
  });
}

export function openAddDomainModal(updateHistory = true) {
  dom.addDomainForm.classList.remove('hidden');
  dom.addDomainForm.classList.remove('slide-down');
  void dom.addDomainForm.offsetWidth;
  dom.addDomainForm.classList.add('slide-down');
  dom.domainInput.value = '';
  dom.domainInput.focus();
  if (updateHistory) {
    const url = new URL(window.location);
    url.searchParams.set('action', 'add-domain');
    window.history.pushState({ tab: 'domains', action: 'add-domain' }, '', url);
  }
}

export function closeAddDomainModal(updateHistory = true) {
  dom.addDomainForm.classList.add('hidden');
  if (updateHistory) {
    const url = new URL(window.location);
    url.searchParams.delete('action');
    window.history.pushState({ tab: 'domains' }, '', url);
  }
}