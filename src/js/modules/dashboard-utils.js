// modules/dashboard-utils.js
import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { showToast } from "./ui.js";

export function showSkeleton(containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (type === 'keys') {
    for (let i = 0; i < 3; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'key-card skeleton-card';
      skeleton.style.animationDelay = `${i * 0.05}s`;
      skeleton.innerHTML = `
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="skeleton skeleton-text" style="width: 120px; height: 20px;"></div>
            <div class="skeleton skeleton-badge" style="width: 70px; height: 24px;"></div>
          </div>
          <div class="flex items-center gap-4 mt-1.5">
            <div class="skeleton skeleton-text" style="width: 150px; height: 14px;"></div>
          </div>
          <div class="key-value-wrapper mt-2">
            <div class="skeleton skeleton-text" style="width: 120px; height: 20px;"></div>
            <div class="skeleton skeleton-icon" style="width: 32px; height: 32px; border-radius: 8px;"></div>
          </div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0 mt-2 md:mt-0">
          <div class="skeleton skeleton-icon" style="width: 36px; height: 36px; border-radius: 10px;"></div>
          <div class="skeleton skeleton-icon" style="width: 36px; height: 36px; border-radius: 10px;"></div>
        </div>
      `;
      container.appendChild(skeleton);
    }
  } else if (type === 'domains') {
    for (let i = 0; i < 3; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'domain-card skeleton-card';
      skeleton.style.animationDelay = `${i * 0.05}s`;
      skeleton.innerHTML = `
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="skeleton skeleton-text" style="width: 150px; height: 20px;"></div>
            <div class="skeleton skeleton-badge" style="width: 70px; height: 24px;"></div>
          </div>
          <div class="flex items-center gap-4 mt-1.5">
            <div class="skeleton skeleton-text" style="width: 120px; height: 14px;"></div>
          </div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0 mt-2 md:mt-0">
          <div class="skeleton skeleton-icon" style="width: 36px; height: 36px; border-radius: 10px;"></div>
          <div class="skeleton skeleton-icon" style="width: 36px; height: 36px; border-radius: 10px;"></div>
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
          <div class="skeleton skeleton-icon" style="width: 8px; height: 8px; border-radius: 50%;"></div>
          <div class="skeleton skeleton-text" style="width: 100px; height: 16px;"></div>
        </div>
        <div class="skeleton skeleton-text" style="width: 60px; height: 14px;"></div>
      `;
      container.appendChild(skeleton);
    }
  } else if (type === 'tableRows') {
    for (let i = 0; i < 5; i++) {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-4 mb-3 rounded-xl bg-black/20 border border-white/5 skeleton-card';
      row.style.animationDelay = `${i * 0.04}s`;
      row.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="skeleton skeleton-icon" style="width: 40px; height: 40px;"></div>
          <div class="flex flex-col gap-1.5">
            <div class="skeleton skeleton-text" style="width: 100px; height: 14px;"></div>
            <div class="skeleton skeleton-text" style="width: 140px; height: 10px;"></div>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <div class="skeleton skeleton-badge hidden md:block" style="width: 80px; height: 14px;"></div>
          <div class="skeleton skeleton-badge" style="width: 60px; height: 24px;"></div>
          <div class="flex flex-col items-end gap-1">
            <div class="skeleton skeleton-text" style="width: 50px; height: 16px;"></div>
            <div class="skeleton skeleton-text" style="width: 30px; height: 10px;"></div>
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
  const skeletons = container.querySelectorAll('.skeleton-card, .skeleton, .skeleton-text, .skeleton-badge, .skeleton-icon');
  skeletons.forEach(el => el.remove());
}

export function showStatSkeletons() {
  const statElements = [
    dom.totalKeysEl, dom.activeKeysEl, dom.revokedKeysEl,
    dom.keysTotalEl, dom.keysActiveEl, dom.keysRevokedEl,
    dom.totalDomainsEl, dom.activeDomainsEl, dom.inactiveDomainsEl,
    dom.domainsTotalEl, dom.domainsActiveEl, dom.domainsInactiveEl,
    dom.totalRequestsEl, dom.totalTokensEl, dom.successRateEl,
    dom.domainLimitBadge
  ];
  statElements.forEach(el => {
    if (!el) return;
    if (el === dom.domainLimitBadge) {
      el.className = 'domain-limit-badge';
      el.innerHTML = '<span class="skeleton skeleton-stat-sm"></span>';
    } else {
      el.innerHTML = '<span class="skeleton skeleton-stat"></span>';
    }
  });
}

export function showUsageSkeletons() {
  const statElements = [dom.statTotalRequests, dom.statTotalTokens, dom.statAvgResponse, dom.statSuccessRate];
  statElements.forEach(el => {
    if (el) el.innerHTML = '<div class="skeleton skeleton-stat w-16 h-8"></div>';
  });
  if (dom.statRequestsTrend) dom.statRequestsTrend.innerHTML = '<div class="skeleton skeleton-text w-20 mt-1"></div>';
  if (dom.statTokensTrend) dom.statTokensTrend.innerHTML = '<div class="skeleton skeleton-text w-20 mt-1"></div>';
  const charts = [dom.requestChartCanvas, dom.tokenChartCanvas, dom.modelChartCanvas];
  charts.forEach(canvas => {
    if (canvas && canvas.parentElement) {
      canvas.style.display = 'none';
      let placeholder = canvas.parentElement.querySelector('.chart-skeleton');
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'chart-skeleton w-full h-full skeleton rounded-xl';
        canvas.parentElement.appendChild(placeholder);
      }
    }
  });
  if (dom.topDomainsContainer) {
    dom.topDomainsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      dom.topDomainsContainer.innerHTML += `<div class="flex justify-between py-2 border-b border-white/5"><div class="skeleton skeleton-text w-24"></div><div class="skeleton skeleton-text w-8"></div></div>`;
    }
  }
  if (dom.busiestHoursContainer) {
    dom.busiestHoursContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      dom.busiestHoursContainer.innerHTML += `<div class="flex justify-between py-2 border-b border-white/5"><div class="skeleton skeleton-text w-16"></div><div class="skeleton skeleton-text w-10"></div></div>`;
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
  if (dom.sidebarName) dom.sidebarName.textContent = user.displayName || user.email.split('@')[0] || 'User';
  if (dom.welcomeMessageEl) {
    dom.welcomeMessageEl.textContent = `Welcome back, ${user.displayName || user.email.split('@')[0] || 'User'}!`;
  }
  if (dom.settingsAvatar) dom.settingsAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=User&background=a855f7&color=fff&size=80';
  if (dom.settingsName) dom.settingsName.textContent = user.displayName || user.email.split('@')[0] || 'User';
  if (dom.settingsEmail) dom.settingsEmail.textContent = user.email || 'user@example.com';

  const providerData = user.providerData || [];
  const isPassword = providerData.some(p => p.providerId === 'password');
  const socialProviderData = providerData.find(p => p.providerId !== 'password');
  state.isSocialUser = !isPassword && !!socialProviderData;

  if (isPassword) {
    if (dom.passwordChangeSection) dom.passwordChangeSection.classList.remove('hidden');
    if (dom.socialAuthInfo) dom.socialAuthInfo.classList.add('hidden');
    if (dom.deletePassword && dom.deletePassword.parentElement) {
      dom.deletePassword.parentElement.classList.remove('hidden');
    }
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
    if (dom.deletePassword && dom.deletePassword.parentElement) {
      dom.deletePassword.parentElement.classList.add('hidden');
    }
    if (dom.deleteSocialReauth) dom.deleteSocialReauth.classList.remove('hidden');
  }
  if (dom.deleteAccountModal) {
    dom.deleteAccountModal.classList.add('hidden');
    dom.deleteAccountModal.style.display = 'none';
  }
}

export function closeToast(overlay) {
  if (!overlay) return;
  overlay.style.opacity = '0';
  const toast = overlay.querySelector('div');
  if (toast) {
    toast.style.transform = 'scale(0.92) translateY(16px)';
    toast.style.opacity = '0';
  }
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  }, 350);
}