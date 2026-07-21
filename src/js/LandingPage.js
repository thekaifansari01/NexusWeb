document.addEventListener("DOMContentLoaded", () => {
    const counter = document.getElementById("heroUsageCounter");
    const bar = document.getElementById("heroUsageBar");
    if (counter && bar) {
        setTimeout(() => {
            bar.style.width = "34.2%";
            let start = 0;
            const end = 342;
            const duration = 2000;
            const increment = end / (duration / 16);
            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    clearInterval(timer);
                    counter.innerText = end;
                } else {
                    counter.innerText = Math.floor(start);
                }
            }, 16);
        }, 600);
    }
});

(function() {
    'use strict';

    const glow = document.getElementById('cursorGlow');
    if (glow) {
        let x = 0, y = 0, tx = 0, ty = 0;
        document.addEventListener('mousemove', function(e) {
            tx = e.clientX;
            ty = e.clientY;
        });

        function animateGlow() {
            x += (tx - x) * 0.08;
            y += (ty - y) * 0.08;
            glow.style.transform = 'translate(' + (x - 130) + 'px, ' + (y - 130) + 'px)';
            requestAnimationFrame(animateGlow);
        }
        animateGlow();
    }

    const wrapper = document.getElementById('mockup3d');
    if (wrapper) {
        const inner = wrapper.querySelector('.mockup-inner');
        let rotX = 0, rotY = 0, targetX = 0, targetY = 0;
        wrapper.addEventListener('mousemove', function(e) {
            const rect = wrapper.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            targetX = py * -8;
            targetY = px * 8;
        });
        wrapper.addEventListener('mouseleave', function() {
            targetX = 0;
            targetY = 0;
        });

        function animateTilt() {
            rotX += (targetX - rotX) * 0.08;
            rotY += (targetY - rotY) * 0.08;
            inner.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
            requestAnimationFrame(animateTilt);
        }
        animateTilt();
    }

    const copyBtn = document.getElementById('copyScriptBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const script = '<script src="https://nexus.com/widget.js"><\/script>\n<script>Nexus.init({ apiKey: \'nx_live_8f92...\', theme: \'dark\' });<\/script>';
            navigator.clipboard.writeText(script).then(function() {
                const orig = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="ph-bold ph-check"></i> Copied!';
                setTimeout(function() { copyBtn.innerHTML = orig; }, 2000);
            })['catch'](function() {
                alert('Copy the script manually:\n\n' + script);
            });
        });
    }

    const faqToggles = document.querySelectorAll('[data-faq]');
    for (let i = 0; i < faqToggles.length; i++) {
        const toggle = faqToggles[i];
        toggle.addEventListener('click', function() {
            const item = this.closest('.faq-item');
            if (!item) return;
            const isOpen = item.classList.contains('open');
            const container = item.closest('#faqContainer');
            if (container) {
                const items = container.querySelectorAll('.faq-item');
                for (let j = 0; j < items.length; j++) {
                    const el = items[j];
                    el.classList.remove('open');
                    const q = el.querySelector('.faq-question');
                    if (q) {
                        q.classList.remove('text-primary');
                        q.classList.add('text-zinc-400');
                    }
                }
            }
            if (!isOpen) {
                item.classList.add('open');
                const q2 = item.querySelector('.faq-question');
                if (q2) {
                    q2.classList.add('text-primary');
                    q2.classList.remove('text-zinc-400');
                }
            }
        });
    }

    const siteCount = document.getElementById('liveSiteCount');
    if (siteCount) {
        let base = 1247;
        setInterval(function() {
            base += Math.floor(Math.random() * 3);
            siteCount.textContent = base.toLocaleString();
        }, 4000);
    }

    const sections = document.querySelectorAll('.reveal-section');
    const observer = new IntersectionObserver(function(entries) {
        for (let k = 0; k < entries.length; k++) {
            if (entries[k].isIntersecting) {
                entries[k].target.classList.add('visible');
            }
        }
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    for (let m = 0; m < sections.length; m++) {
        observer.observe(sections[m]);
    }
})();