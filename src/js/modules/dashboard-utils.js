import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { showToast } from "./ui.js";

export function updateWithTransition(element, value, isHTML = false) {
  if (!element) return;
  element.style.opacity = '0';
  setTimeout(() => {
    if (isHTML) element.innerHTML = value;
    else element.textContent = value;
    element.style.opacity = '1';
  }, 250);
}

export function showSkeleton(containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (type === 'keys') {
    for (let i = 0; i < 3; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'flex flex-col md:flex-row md:items-center justify-between gap-3 p-6 rounded-3xl border border-white/5 bg-zinc-900/30';
      skeleton.style.animationDelay = `${i * 0.05}s`;
      skeleton.innerHTML = `
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="w-32 h-5 bg-white/10 rounded animate-pulse"></div>
            <div class="w-16 h-6 bg-white/10 rounded-full animate-pulse"></div>
          </div>
          <div class="flex items-center gap-4 mt-2">
            <div class="w-48 h-3 bg-white/10 rounded animate-pulse"></div>
          </div>
          <div class="mt-3">
            <div class="w-40 h-5 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 mt-4 md:mt-0">
          <div class="w-20 h-10 bg-white/10 rounded-xl animate-pulse"></div>
          <div class="w-10 h-10 bg-white/10 rounded-xl animate-pulse"></div>
        </div>
      `;
      container.appendChild(skeleton);
    }
  } else if (type === 'domains') {
    for (let i = 0; i < 3; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'flex flex-col md:flex-row md:items-center justify-between gap-3 p-6 rounded-3xl border border-white/5 bg-zinc-900/30';
      skeleton.style.animationDelay = `${i * 0.05}s`;
      skeleton.innerHTML = `
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="w-40 h-5 bg-white/10 rounded animate-pulse"></div>
            <div class="w-16 h-6 bg-white/10 rounded-full animate-pulse"></div>
          </div>
          <div class="flex items-center gap-4 mt-2">
            <div class="w-32 h-3 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 mt-4 md:mt-0">
          <div class="w-10 h-10 bg-white/10 rounded-xl animate-pulse"></div>
          <div class="w-10 h-10 bg-white/10 rounded-xl animate-pulse"></div>
        </div>
      `;
      container.appendChild(skeleton);
    }
  } else if (type === 'overview') {
    for (let i = 0; i < 2; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5';
      skeleton.style.animationDelay = `${i * 0.05}s`;
      skeleton.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 bg-white/10 rounded-full animate-pulse"></div>
          <div class="w-24 h-4 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div class="w-16 h-3 bg-white/10 rounded animate-pulse"></div>
      `;
      container.appendChild(skeleton);
    }
  } else if (type === 'tableRows') {
    for (let i = 0; i < 5; i++) {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-4 mb-3 rounded-xl bg-black/20 border border-white/5';
      row.style.animationDelay = `${i * 0.04}s`;
      row.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-white/10 rounded-xl animate-pulse"></div>
          <div class="flex flex-col gap-1.5">
            <div class="w-24 h-4 bg-white/10 rounded animate-pulse"></div>
            <div class="w-32 h-2 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <div class="w-20 h-3 bg-white/10 rounded animate-pulse hidden md:block"></div>
          <div class="w-16 h-6 bg-white/10 rounded-full animate-pulse"></div>
          <div class="flex flex-col items-end gap-1">
            <div class="w-12 h-4 bg-white/10 rounded animate-pulse"></div>
            <div class="w-8 h-2 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
      `;
      container.appendChild(row);
    }
  }
}

export function hideSkeleton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
}

export function showStatSkeletons() {
  const statElements = [
    dom.totalKeysEl, dom.activeKeysEl, dom.revokedKeysEl,
    dom.keysTotalEl, dom.keysActiveEl, dom.keysRevokedEl,
    dom.totalDomainsEl, dom.activeDomainsEl, dom.inactiveDomainsEl,
    dom.domainsTotalEl, dom.domainsActiveEl, dom.domainsInactiveEl,
    dom.statTotalRequests, dom.statTotalTokens, dom.statAvgResponse, dom.statSuccessRate
  ];
  statElements.forEach(el => {
    if (!el) return;
    el.style.opacity = '1';
    el.innerHTML = '<div class="w-16 h-8 bg-white/10 rounded-lg animate-pulse"></div>';
  });
  if (dom.domainLimitBadge) {
    dom.domainLimitBadge.style.opacity = '1';
    dom.domainLimitBadge.innerHTML = '<div class="w-16 h-4 bg-primary/20 rounded animate-pulse inline-block"></div>';
  }
  if (dom.usageNumber) {
    dom.usageNumber.style.opacity = '1';
    dom.usageNumber.innerHTML = '<div class="w-16 h-8 bg-white/10 rounded-lg animate-pulse"></div>';
  }
  if (dom.usageLimit) {
    dom.usageLimit.style.opacity = '1';
    dom.usageLimit.innerHTML = '<div class="w-10 h-4 bg-white/10 rounded animate-pulse inline-block"></div>';
  }
  if (dom.usagePercentText) {
    dom.usagePercentText.style.opacity = '1';
    dom.usagePercentText.innerHTML = '<div class="w-12 h-3 bg-white/10 rounded animate-pulse"></div>';
  }
  if (dom.usageRemaining) {
    dom.usageRemaining.style.opacity = '1';
    dom.usageRemaining.innerHTML = '<div class="w-8 h-3 bg-white/10 rounded animate-pulse inline-block"></div>';
  }
}

export function showUsageSkeletons() {
  if (dom.statRequestsTrend) {
    dom.statRequestsTrend.style.opacity = '1';
    dom.statRequestsTrend.innerHTML = '<div class="w-20 h-3 bg-white/10 rounded animate-pulse"></div>';
  }
  if (dom.statTokensTrend) {
    dom.statTokensTrend.style.opacity = '1';
    dom.statTokensTrend.innerHTML = '<div class="w-20 h-3 bg-white/10 rounded animate-pulse"></div>';
  }
  const charts = [dom.requestChartCanvas, dom.tokenChartCanvas, dom.modelChartCanvas];
  charts.forEach(canvas => {
    if (canvas && canvas.parentElement) {
      canvas.style.display = 'none';
      let placeholder = canvas.parentElement.querySelector('.chart-skeleton');
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'chart-skeleton w-full h-full bg-white/5 animate-pulse rounded-xl absolute inset-0';
        canvas.parentElement.appendChild(placeholder);
      }
    }
  });
  if (dom.topDomainsContainer) {
    dom.topDomainsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      dom.topDomainsContainer.innerHTML += `<div class="flex justify-between py-2 border-b border-white/5"><div class="w-24 h-4 bg-white/10 rounded animate-pulse"></div><div class="w-8 h-4 bg-white/10 rounded animate-pulse"></div></div>`;
    }
  }
  if (dom.busiestHoursContainer) {
    dom.busiestHoursContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      dom.busiestHoursContainer.innerHTML += `<div class="flex justify-between py-2 border-b border-white/5"><div class="w-16 h-4 bg-white/10 rounded animate-pulse"></div><div class="w-10 h-4 bg-white/10 rounded animate-pulse"></div></div>`;
    }
  }
}

export function hideUsageSkeletons() {
  const charts = [dom.requestChartCanvas, dom.tokenChartCanvas, dom.modelChartCanvas];
  charts.forEach(canvas => {
    if (canvas && canvas.parentElement) {
      canvas.style.display = 'block';
      const placeholder = canvas.parentElement.querySelector('.chart-skeleton');
      if (placeholder) placeholder.remove();
    }
  });
}

export function renderTurnstile(containerId = 'turnstile-container', callback = null) {
  const container = document.getElementById(containerId);
  if (!container || !window.turnstile) return;
  if (state.turnstileWidgetId !== null && state.turnstileWidgetId !== undefined) {
    try { turnstile.remove(state.turnstileWidgetId); } catch (_) {}
    state.turnstileWidgetId = null;
  }
  container.innerHTML = '';
  try {
    state.turnstileWidgetId = turnstile.render(container, {
      sitekey: '0x4AAAAAADttl-ZBYJPZI8zP',
      callback: function(token) {
        state.captchaToken = token;
        if (containerId === 'turnstile-container') {
          dom.saveKeyBtn.classList.remove('hidden');
        } else if (containerId === 'captchaModalContainer') {
          dom.captchaModalConfirm.classList.remove('hidden');
        }
        if (callback) callback(token);
      },
      'expired-callback': function() {
        state.captchaToken = null;
        if (containerId === 'turnstile-container') {
          dom.saveKeyBtn.classList.add('hidden');
        } else if (containerId === 'captchaModalContainer') {
          dom.captchaModalConfirm.classList.add('hidden');
        }
      },
      'error-callback': function() {
        state.captchaToken = null;
        if (containerId === 'turnstile-container') {
          dom.saveKeyBtn.classList.add('hidden');
        } else if (containerId === 'captchaModalContainer') {
          dom.captchaModalConfirm.classList.add('hidden');
        }
        if (state.turnstileRetryTimeout) clearTimeout(state.turnstileRetryTimeout);
        state.turnstileRetryTimeout = setTimeout(() => renderTurnstile(containerId, callback), 2000);
      }
    });
  } catch (e) {
    if (state.turnstileRetryTimeout) clearTimeout(state.turnstileRetryTimeout);
    state.turnstileRetryTimeout = setTimeout(() => renderTurnstile(containerId, callback), 2000);
  }
}

export function resetTurnstile() {
  try {
    if (state.turnstileWidgetId !== null && state.turnstileWidgetId !== undefined && window.turnstile) {
      turnstile.remove(state.turnstileWidgetId);
      state.turnstileWidgetId = null;
    }
  } catch (e) {}
  state.captchaToken = null;
  dom.saveKeyBtn.classList.add('hidden');
  dom.captchaModalConfirm.classList.add('hidden');
  if (state.turnstileRetryTimeout) {
    clearTimeout(state.turnstileRetryTimeout);
    state.turnstileRetryTimeout = null;
  }
}

export function showCaptchaModal(title, desc, action, data = null) {
  dom.captchaModalTitle.textContent = title;
  dom.captchaModalDesc.textContent = desc;
  state.pendingAction = action;
  state.pendingActionData = data;
  dom.captchaModal.classList.remove('hidden');
  dom.captchaModalConfirm.classList.add('hidden');
  setTimeout(() => renderTurnstile('captchaModalContainer'), 200);
}

export function closeCaptchaModal() {
  dom.captchaModal.classList.add('hidden');
  resetTurnstile();
  state.pendingAction = null;
  state.pendingActionData = null;
}

export function renderDeleteTurnstile() {
  const container = dom.deleteTurnstileContainer;
  if (!container || !window.turnstile) return;
  if (state.deleteTurnstileWidgetId) {
    try { turnstile.remove(state.deleteTurnstileWidgetId); } catch (_) {}
    state.deleteTurnstileWidgetId = null;
  }
  container.innerHTML = '';
  try {
    state.deleteTurnstileWidgetId = turnstile.render(container, {
      sitekey: '0x4AAAAAADttl-ZBYJPZI8zP',
      callback: function(token) {
        state.deleteCaptchaToken = token;
        updateDeleteConfirmBtn();
      },
      'expired-callback': function() {
        state.deleteCaptchaToken = null;
        updateDeleteConfirmBtn();
      },
      'error-callback': function() {
        state.deleteCaptchaToken = null;
        updateDeleteConfirmBtn();
        if (state.turnstileRetryTimeout) clearTimeout(state.turnstileRetryTimeout);
        state.turnstileRetryTimeout = setTimeout(renderDeleteTurnstile, 2000);
      }
    });
  } catch (e) {
    if (state.turnstileRetryTimeout) clearTimeout(state.turnstileRetryTimeout);
    state.turnstileRetryTimeout = setTimeout(renderDeleteTurnstile, 2000);
  }
}

function updateDeleteConfirmBtn() {
  dom.deleteConfirmBtn.disabled = !state.deleteCaptchaToken;
}

export function resetDeleteTurnstile() {
  try {
    if (state.deleteTurnstileWidgetId && window.turnstile) {
      turnstile.remove(state.deleteTurnstileWidgetId);
      state.deleteTurnstileWidgetId = null;
    }
  } catch (_) {}
  state.deleteCaptchaToken = null;
  if (state.turnstileRetryTimeout) {
    clearTimeout(state.turnstileRetryTimeout);
    state.turnstileRetryTimeout = null;
  }
}

export function updateUserUI(user) {
  if (dom.sidebarAvatar) dom.sidebarAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=User&background=a855f7&color=fff&size=40';
  if (dom.sidebarEmail) dom.sidebarEmail.textContent = user.email || 'user@example.com';
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'User');
  if (dom.sidebarName) dom.sidebarName.textContent = displayName;
  if (dom.welcomeMessageEl) dom.welcomeMessageEl.textContent = `Welcome back, ${displayName}!`;
  if (dom.settingsAvatar) dom.settingsAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=User&background=a855f7&color=fff&size=80';
  if (dom.settingsName) dom.settingsName.textContent = displayName;
  if (dom.settingsEmail) dom.settingsEmail.textContent = user.email || 'user@example.com';

  const providerData = user.providerData || [];
  const isPassword = providerData.some(p => p.providerId === 'password');
  const socialProviderData = providerData.find(p => p.providerId !== 'password');
  state.isSocialUser = !isPassword && !!socialProviderData;

  if (isPassword) {
    if (dom.passwordChangeSection) dom.passwordChangeSection.classList.remove('hidden');
    if (dom.socialAuthInfo) dom.socialAuthInfo.classList.add('hidden');
    if (dom.deletePassword && dom.deletePassword.parentElement) dom.deletePassword.parentElement.classList.remove('hidden');
    if (dom.deleteSocialReauth) dom.deleteSocialReauth.classList.add('hidden');
  } else {
    if (dom.passwordChangeSection) dom.passwordChangeSection.classList.add('hidden');
    if (dom.socialAuthInfo) dom.socialAuthInfo.classList.remove('hidden');
    if (socialProviderData) {
      const provName = socialProviderData.providerId === 'google.com' ? 'Google' : 'GitHub';
      if (dom.socialProvider) dom.socialProvider.textContent = provName;
      if (dom.deleteSocialProvider) dom.deleteSocialProvider.textContent = provName;
      if (dom.deleteSocialProviderName) dom.deleteSocialProviderName.textContent = provName;
    }
    if (dom.deletePassword && dom.deletePassword.parentElement) dom.deletePassword.parentElement.classList.add('hidden');
    if (dom.deleteSocialReauth) dom.deleteSocialReauth.classList.remove('hidden');
  }

  if (dom.deleteAccountModal) {
    dom.deleteAccountModal.classList.add('hidden');
    dom.deleteAccountModal.style.display = 'none';
  }
}