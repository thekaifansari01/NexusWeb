// modules/domains.js
import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { showToast } from "./ui.js";
import { getDomains, addDomain, deleteDomain, toggleDomainStatus } from "./firestore.js";
import { showSkeleton, hideSkeleton, showStatSkeletons, showCaptchaModal } from "./dashboard-utils.js";

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
  if (dom.totalDomainsEl) dom.totalDomainsEl.textContent = `${total}/${state.MAX_DOMAINS}`;
  if (dom.activeDomainsEl) dom.activeDomainsEl.textContent = active;
  if (dom.inactiveDomainsEl) dom.inactiveDomainsEl.textContent = inactive;
  if (dom.domainsTotalEl) dom.domainsTotalEl.textContent = `${total}/${state.MAX_DOMAINS}`;
  if (dom.domainsActiveEl) dom.domainsActiveEl.textContent = active;
  if (dom.domainsInactiveEl) dom.domainsInactiveEl.textContent = inactive;
  if (dom.domainLimitBadge) {
    dom.domainLimitBadge.textContent = `${total} / ${state.MAX_DOMAINS} used`;
    dom.domainLimitBadge.className = 'domain-limit-badge';
    if (total >= state.MAX_DOMAINS) {
      dom.domainLimitBadge.classList.add('danger');
    } else if (total >= state.MAX_DOMAINS - 2) {
      dom.domainLimitBadge.classList.add('warning');
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