function setupPremiumModals() {
    if (document.getElementById('premium-modal-backdrop')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'premium-modal-backdrop';
    backdrop.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300';
    
    backdrop.innerHTML = `
        <div id="premium-modal-card" class="bg-zinc-950 border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-[0_30px_60px_rgba(0,0,0,0.8)] transform scale-95 transition-all duration-300 relative overflow-hidden">
            <div id="premium-modal-glow" class="absolute top-0 left-0 w-full h-1"></div>
            <div class="flex flex-col items-center text-center">
                <div id="premium-modal-icon-bg" class="w-16 h-16 rounded-full flex items-center justify-center mb-5 border shadow-inner">
                    <i id="premium-modal-icon" class="text-3xl"></i>
                </div>
                <h3 id="premium-modal-title" class="text-xl font-black text-white tracking-tight mb-2"></h3>
                <p id="premium-modal-desc" class="text-sm text-zinc-400 font-medium leading-relaxed mb-8"></p>
                <div class="flex gap-3 w-full">
                    <button id="premium-modal-cancel" class="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 px-4 py-3 rounded-xl text-sm font-bold transition-all hidden">Cancel</button>
                    <button id="premium-modal-confirm" class="flex-1 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all">OK</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);

    let activeResolve = null;

    const close = (result) => {
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        document.getElementById('premium-modal-card').classList.replace('scale-100', 'scale-95');
        setTimeout(() => {
            if (activeResolve) {
                activeResolve(result);
                activeResolve = null;
            }
        }, 300);
    };

    document.getElementById('premium-modal-cancel').addEventListener('click', () => close(false));
    document.getElementById('premium-modal-confirm').addEventListener('click', () => close(true));

    window.customModal = function(type, title, message) {
        return new Promise((resolve) => {
            activeResolve = resolve;

            const titleEl = document.getElementById('premium-modal-title');
            const descEl = document.getElementById('premium-modal-desc');
            const iconBg = document.getElementById('premium-modal-icon-bg');
            const iconEl = document.getElementById('premium-modal-icon');
            const glow = document.getElementById('premium-modal-glow');
            const cancelBtn = document.getElementById('premium-modal-cancel');
            const confirmBtn = document.getElementById('premium-modal-confirm');

            titleEl.textContent = title;
            descEl.textContent = message;

            iconBg.className = 'w-16 h-16 rounded-full flex items-center justify-center mb-5 border shadow-inner';
            confirmBtn.className = 'flex-1 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all';

            if (type === 'alert') {
                iconBg.classList.add('bg-primary/10', 'border-primary/20');
                iconEl.className = 'ph-bold ph-info text-3xl text-primary';
                glow.className = 'absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-primary';
                cancelBtn.classList.add('hidden');
                confirmBtn.classList.add('bg-primary', 'hover:bg-primaryHover', 'shadow-[0_0_20px_rgba(168,85,247,0.4)]');
                confirmBtn.textContent = 'Acknowledge';
            } else {
                iconBg.classList.add('bg-red-500/10', 'border-red-500/20');
                iconEl.className = 'ph-bold ph-warning text-3xl text-red-500';
                glow.className = 'absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400';
                cancelBtn.classList.remove('hidden');
                confirmBtn.classList.add('bg-red-500', 'hover:bg-red-600', 'shadow-[0_0_20px_rgba(239,68,68,0.4)]');
                confirmBtn.textContent = 'Confirm Action';
            }

            backdrop.classList.remove('opacity-0', 'pointer-events-none');
            document.getElementById('premium-modal-card').classList.replace('scale-95', 'scale-100');
        });
    };

    window.alert = function(message) {
        return window.customModal('alert', 'Notification', message);
    };

    window.confirm = function(message) {
        return window.customModal('confirm', 'Are you sure?', message);
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPremiumModals);
} else {
    setupPremiumModals();
}