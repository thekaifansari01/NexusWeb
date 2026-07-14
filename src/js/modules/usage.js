// src/js/modules/usage.js
import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { showToast } from "./ui.js";
import { showStatSkeletons, showUsageSkeletons, hideUsageSkeletons, hideSkeleton, showSkeleton } from "./dashboard-utils.js";
import { renderStats, renderCharts, renderBreakdowns } from "./charts.js";

export async function loadUsage(range = state.currentRange) {
  if (!state.currentUser) return;
  state.currentPage = 1;
  state.activeFilter = null;
  dom.filterChips.forEach(c => c.classList.remove('active', 'bg-primary/20', 'text-primary', 'border-primary/30'));
  document.querySelector('.filter-chip[data-filter="all"]')?.classList.add('active', 'bg-primary/20', 'text-primary', 'border-primary/30');
  state.sortField = 'timestamp';
  state.sortOrder = 'desc';
  document.querySelectorAll('[data-sort] i').forEach(icon => {
    icon.className = 'ph ph-caret-up-down ml-0.5';
  });
  const firstTh = document.querySelector('[data-sort="timestamp"]');
  if (firstTh) {
    const icon = firstTh.querySelector('i');
    if (icon) icon.className = 'ph ph-caret-down ml-0.5';
  }
  showStatSkeletons();
  showUsageSkeletons();
  showSkeleton('logsTableBody', 'tableRows');
  dom.loadMoreBtn.classList.add('hidden');
  try {
    const response = await fetch(`/api/stats?range=${range}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch stats');
    const data = await response.json();
    state.allLogs = data.recentLogs || [];
    state.filteredLogs = state.allLogs;
    hideUsageSkeletons();
    hideSkeleton('logsTableBody');
    renderStats(data.totals, data.daily);
    renderCharts(data.daily);
    renderBreakdowns(data.modelBreakdown, data.domainBreakdown, data.hourlyDistribution);
    renderTable(state.filteredLogs);
    if (dom.logCount) dom.logCount.textContent = `${state.filteredLogs.length} entries`;
    if (dom.topDomainsContainer) {
      const items = dom.topDomainsContainer.querySelectorAll('.skeleton-card, .skeleton, .skeleton-text');
      items.forEach(el => el.remove());
    }
    if (dom.busiestHoursContainer) {
      const items = dom.busiestHoursContainer.querySelectorAll('.skeleton-card, .skeleton, .skeleton-text');
      items.forEach(el => el.remove());
    }
  } catch (error) {
    console.error('Usage load error:', error);
    hideUsageSkeletons();
    hideSkeleton('logsTableBody');
    if (dom.topDomainsContainer) dom.topDomainsContainer.innerHTML = '<div class="text-sm text-red-400 text-center py-4">Failed to load.</div>';
    if (dom.busiestHoursContainer) dom.busiestHoursContainer.innerHTML = '<div class="text-sm text-red-400 text-center py-4">Failed to load.</div>';
    dom.logsTableBody.innerHTML = '<div class="text-center text-red-400 py-6 text-sm">Failed to load logs.</div>';
  }
}

function renderTable(logs) {
  if (!dom.logsTableBody) return;
  if (!logs || logs.length === 0) {
    dom.logsTableBody.innerHTML = `
      <div class="empty-state">
        <div class="icon-wrap"><i class="ph-bold ph-list-magnifying-glass"></i></div>
        <h4>No Activity Found</h4>
        <p>We couldn't find any recent usage logs for your keys.</p>
      </div>
    `;
    dom.loadMoreBtn.classList.add('hidden');
    if (dom.logCount) dom.logCount.textContent = '0 entries';
    return;
  }
  let data = [...logs];
  if (state.activeFilter) {
    const { type, value } = state.activeFilter;
    data = data.filter(log => {
      if (type === 'model') return (log.model || '').toLowerCase() === value.toLowerCase();
      if (type === 'domain') return (log.domain || '').toLowerCase() === value.toLowerCase();
      if (type === 'status') return (log.status || '').toLowerCase() === value.toLowerCase();
      return true;
    });
  }
  data.sort((a, b) => {
    let aVal = a[state.sortField] || '';
    let bVal = b[state.sortField] || '';
    if (state.sortField === 'tokens') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else if (state.sortField === 'timestamp') {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }
    if (aVal < bVal) return state.sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return state.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  const totalFiltered = data.length;
  const start = 0;
  const end = state.currentPage * state.PAGE_SIZE;
  const pageData = data.slice(start, end);
  const hasMore = end < totalFiltered;
  dom.logsTableBody.innerHTML = '';
  pageData.forEach((log, index) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-4 mb-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all fade-in-up cursor-default';
    row.style.animationDelay = `${index * 0.03}s`;
    const date = log.timestamp ? new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const status = log.status || 'success';
    const statusClass = status === 'success' ? 'active' : 'revoked';
    const modelIcon = log.model && log.model.toLowerCase().includes('llama') ? 'ph-brain' : 'ph-cpu';
    row.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
          <i class="ph-bold ${modelIcon} text-lg"></i>
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-bold text-white tracking-wide">${log.model || 'Unknown Model'}</span>
          <span class="text-xs text-zinc-500 font-mono mt-0.5">${log.domain || 'Direct API'}</span>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="flex flex-col items-end hidden md:flex">
          <span class="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-0.5">Timestamp</span>
          <span class="text-xs text-zinc-400 font-medium">${date}</span>
        </div>
        <span class="status-badge ${statusClass} px-2.5 py-1 text-[10px]"><span class="dot"></span>${status}</span>
        <div class="flex flex-col items-end min-w-[70px]">
          <span class="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-0.5">Tokens</span>
          <span class="text-sm font-mono font-bold text-emerald-400">+${log.totalTokens || 0}</span>
        </div>
      </div>
    `;
    dom.logsTableBody.appendChild(row);
  });
  if (dom.logCount) {
    dom.logCount.textContent = `${pageData.length} of ${totalFiltered} entries`;
  }
  if (hasMore) {
    dom.loadMoreBtn.classList.remove('hidden');
  } else {
    dom.loadMoreBtn.classList.add('hidden');
  }
}

export function filterLogs(query) {
  if (!query) {
    state.filteredLogs = state.allLogs;
  } else {
    state.filteredLogs = state.allLogs.filter(log =>
      (log.model || '').toLowerCase().includes(query) ||
      (log.domain || '').toLowerCase().includes(query) ||
      (log.status || '').toLowerCase().includes(query)
    );
  }
  state.currentPage = 1;
  renderTable(state.filteredLogs);
  if (dom.logCount) dom.logCount.textContent = `${state.filteredLogs.length} entries`;
}

export function applyFilter(type, value) {
  if (type === 'all') {
    state.activeFilter = null;
    dom.filterChips.forEach(c => c.classList.remove('active', 'bg-primary/20', 'text-primary', 'border-primary/30'));
    document.querySelector('.filter-chip[data-filter="all"]')?.classList.add('active', 'bg-primary/20', 'text-primary', 'border-primary/30');
  } else {
    const chip = Array.from(dom.filterChips).find(c => c.dataset.filter === type);
    if (chip) {
      const isActive = chip.classList.contains('active');
      dom.filterChips.forEach(c => c.classList.remove('active', 'bg-primary/20', 'text-primary', 'border-primary/30'));
      if (!isActive) {
        chip.classList.add('active', 'bg-primary/20', 'text-primary', 'border-primary/30');
        state.activeFilter = { type: chip.dataset.filterType || 'model', value: chip.textContent.trim().toLowerCase() };
      } else {
        state.activeFilter = null;
        document.querySelector('.filter-chip[data-filter="all"]')?.classList.add('active', 'bg-primary/20', 'text-primary', 'border-primary/30');
      }
    }
  }
  state.currentPage = 1;
  renderTable(state.filteredLogs);
}

export function loadMoreLogs() {
  state.currentPage++;
  renderTable(state.filteredLogs);
}

export function sortLogs(field) {
  if (state.sortField === field) {
    state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortField = field;
    state.sortOrder = 'desc';
  }
  state.currentPage = 1;
  renderTable(state.filteredLogs);
  document.querySelectorAll('[data-sort] i').forEach(icon => {
    icon.className = 'ph ph-caret-up-down ml-0.5';
  });
  const el = document.querySelector(`[data-sort="${field}"]`);
  if (el) {
    const icon = el.querySelector('i');
    if (icon) {
      icon.className = state.sortOrder === 'asc' ? 'ph ph-caret-up ml-0.5' : 'ph ph-caret-down ml-0.5';
    }
  }
}

export function exportLogs() {
  if (!state.allLogs || state.allLogs.length === 0) {
    showToast('No data to export.', 3000, 'warning');
    return;
  }
  let csv = 'Timestamp,Model,Tokens,Status,Domain\n';
  state.allLogs.forEach(log => {
    const date = log.timestamp ? new Date(log.timestamp).toISOString() : '';
    csv += `${date},${log.model || ''},${log.totalTokens || 0},${log.status || ''},${log.domain || ''}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nexus_usage_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Export started.', 2000, 'success');
}