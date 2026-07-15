const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal-section').forEach(section => {
    sectionObserver.observe(section);
});

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